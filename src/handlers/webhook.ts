import * as logger from "firebase-functions/logger";
import { Request } from "firebase-functions/v2/https";
import { Response } from "express";
import { validateSignature, replyText, getProfile } from "../services/line";
import { createUser, getUser, updateUser } from "../services/firestore";
import { getSecret } from "../config/secrets";
import { handleTextChat } from "./textChat";
import { handleVoiceChat } from "./voiceChat";

const WELCOME_MESSAGE =
  "はじめまして！AI English Coach です 🎓\n" +
  "通訳ガイドの英語力アップをお手伝いします。\n\n" +
  "このBotでできること：\n" +
  "📝 英文を送ると → 添削＋ガイド向け表現を提案\n" +
  "🎤 音声を送ると → 発音チェック＋改善ポイント\n" +
  "📊 毎週日曜に → 学習レポートをお届け\n\n" +
  "さっそく始めましょう！\n" +
  "まずは英語であなたの自己紹介をしてください。\n" +
  '例: "Hi, I\'m [名前]. I\'ve been a tour guide for [X] years."\n\n' +
  "【コマンド】\n" +
  "・通知オン / 通知オフ\n" +
  "・通知設定 HH:MM（例: 通知設定 21:00）\n" +
  "・レベル確認\n" +
  "・ヘルプ";

export async function webhookHandler(
  req: Request,
  res: Response
): Promise<void> {
  // 1. 署名検証
  const signature = req.headers["x-line-signature"] as string | undefined;
  if (!signature) {
    res.status(403).send("Missing signature");
    return;
  }

  const secret = await getSecret("LINE_CHANNEL_SECRET");
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

  const tasks = events.map((event) => processEvent(event));
  await Promise.allSettled(tasks);
}

async function processEvent(
  event: Record<string, unknown>
): Promise<void> {
  const eventType = event.type as string;
  const source = event.source as { userId?: string } | undefined;
  const userId = source?.userId;

  if (!userId) {
    return;
  }

  const replyToken = event.replyToken as string | undefined;

  try {
    switch (eventType) {
      case "follow": {
        // createUser + ウェルカムメッセージ
        const existing = await getUser(userId);
        if (!existing) {
          const profile = await getProfile(userId);
          await createUser(userId, profile.displayName);
        } else if (!existing.isActive) {
          await updateUser(userId, { isActive: true });
        }
        if (replyToken) {
          await replyText(replyToken, WELCOME_MESSAGE);
        }
        break;
      }

      case "unfollow": {
        await updateUser(userId, { isActive: false });
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
          await handleTextChat(userId, message.text, replyToken);
        } else if (message.type === "audio" && message.id) {
          await handleVoiceChat(userId, message.id, replyToken, message.duration);
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
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}
