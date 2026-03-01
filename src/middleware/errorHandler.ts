import * as logger from "firebase-functions/logger";
import OpenAI from "openai";
import { replyText } from "../services/line";

export async function withErrorHandling(
  replyToken: string,
  handler: () => Promise<void>
): Promise<void> {
  try {
    await handler();
  } catch (err) {
    logger.error("Handler error", { error: err });

    let userMessage: string;

    if (err instanceof Error && err.name === "AbortError") {
      userMessage =
        "少々お待ちください…もう一度お試しいただけますか？";
    } else if (
      err instanceof OpenAI.APIError &&
      err.status === 429
    ) {
      userMessage =
        "ただいま混み合っています。1分後にもう一度お試しください。";
    } else {
      userMessage =
        "すみません、一時的にエラーが発生しました。もう一度お試しください。";
    }

    try {
      await replyText(replyToken, userMessage);
    } catch (replyErr) {
      logger.error("Failed to send error reply", { error: replyErr });
    }
  }
}
