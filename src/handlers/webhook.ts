import * as logger from "firebase-functions/logger";
import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import { validateSignature, replyText, getProfile } from "../services/line";
import { createUser, getUser, updateUser, incrementDailyStat } from "../services/firestore";
import { getTodayJST } from "../utils/dateUtils";
import { getSecret } from "../config/secrets";
import { handleTextChat } from "./textChat";
import { handleVoiceChat } from "./voiceChat";
import { TargetLanguage, getLangStrings } from "../config/languages";

export function createWebhookHandler(lang: TargetLanguage) {
  return async (req: Request, res: Response): Promise<void> => {
    // 1. 署名検証
    const signature = req.headers["x-line-signature"] as string | undefined;
    if (!signature) {
      res.status(403).send("Missing signature");
      return;
    }

    const strings = getLangStrings(lang);
    const secret = await getSecret(strings.lineChannelSecret);
    const bodyStr =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    if (!validateSignature(bodyStr, signature, secret)) {
      res.status(403).send("Invalid signature");
      return;
    }

    // 2. 即返却（LINEの再送防止）
    res.status(200).send("OK");

    // 3. events配列をループ
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const events: Array<Record<string, unknown>> = body.events ?? [];

    const tasks = events.map((event) => processEvent(event, lang));
    await Promise.allSettled(tasks);
  };
}

/** @deprecated Use createWebhookHandler("en") instead */
export const webhookHandler = createWebhookHandler("en");

async function processEvent(
  event: Record<string, unknown>,
  lang: TargetLanguage
): Promise<void> {
  const eventType = event.type as string;
  const source = event.source as { userId?: string } | undefined;
  const userId = source?.userId;

  if (!userId) {
    return;
  }

  const replyToken = event.replyToken as string | undefined;
  const strings = getLangStrings(lang);

  try {
    switch (eventType) {
      case "follow": {
        // createUser + ウェルカムメッセージ + 統計カウンター
        const existing = await getUser(userId, lang);
        if (!existing) {
          const profile = await getProfile(userId, lang);
          await createUser(userId, profile.displayName, lang);
        } else if (!existing.isActive) {
          await updateUser(userId, { isActive: true }, lang);
        }
        await incrementDailyStat(getTodayJST(), "newFollows", lang);
        if (replyToken) {
          await replyText(replyToken, strings.welcomeMessage, lang);
        }
        break;
      }

      case "unfollow": {
        await updateUser(userId, { isActive: false }, lang);
        await incrementDailyStat(getTodayJST(), "unfollows", lang);
        break;
      }

      case "message": {
        const message = event.message as {
          type: string;
          text?: string;
          id?: string;
          duration?: number;
        } | undefined;
        if (!message || !replyToken) {
          break;
        }

        if (message.type === "text" && message.text) {
          await handleTextChat(userId, message.text, replyToken, lang);
        } else if (message.type === "audio" && message.id) {
          await handleVoiceChat(userId, message.id, replyToken, lang, message.duration);
        }
        // その他のメッセージタイプは無視
        break;
      }

      default:
        // その他のイベントは無視
        break;
    }
  } catch (err) {
    logger.error("Event processing error", {
      eventType,
      userId,
      lang,
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}
