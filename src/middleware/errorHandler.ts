import * as logger from "firebase-functions/logger";
import Anthropic from "@anthropic-ai/sdk";
import { replyText } from "../services/line";
import { TargetLanguage, getLangStrings } from "../config/languages";

export async function withErrorHandling(
  replyToken: string,
  handler: () => Promise<void>,
  lang: TargetLanguage = "en"
): Promise<void> {
  try {
    await handler();
  } catch (err) {
    logger.error("Handler error", {
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });

    const strings = getLangStrings(lang);
    let userMessage: string;

    if (err instanceof Error && err.name === "AbortError") {
      userMessage = strings.errorAbort;
    } else if (
      err instanceof Anthropic.APIError &&
      err.status === 429
    ) {
      userMessage = strings.errorRateLimit;
    } else {
      userMessage = strings.errorGeneric;
    }

    try {
      await replyText(replyToken, userMessage, lang);
    } catch (replyErr) {
      logger.error("Failed to send error reply", {
        error: replyErr instanceof Error ? replyErr.message : replyErr,
        stack: replyErr instanceof Error ? replyErr.stack : undefined,
      });
    }
  }
}
