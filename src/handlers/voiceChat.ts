import {
  getUser,
  createUser,
  updateUser,
  addChatLog,
} from "../services/firestore";
import { getProfile, replyText, getContent } from "../services/line";
import { chatCompletion, transcribeAudio } from "../services/openai";
import { buildSystemPrompt } from "../prompts/systemPrompt";
import { VOICE_ADDITION } from "../prompts/voicePrompt";
import { withErrorHandling } from "../middleware/errorHandler";
import { checkRateLimit } from "../middleware/rateLimiter";
import { updateStreak } from "../utils/streak";
import { getTodayJST } from "../utils/dateUtils";
import { RATE_LIMITS } from "../config/constants";
import { User } from "../types";

export async function handleVoiceChat(
  userId: string,
  messageId: string,
  replyToken: string,
  duration?: number
): Promise<void> {
  await withErrorHandling(replyToken, async () => {
    // 1. getUser — なければcreateUser
    let user = await getUser(userId);
    if (!user) {
      const profile = await getProfile(userId);
      await createUser(userId, profile.displayName);
      user = (await getUser(userId))!;
    }

    // 2. checkRateLimit("voice")
    const todayJST = getTodayJST();
    const rateLimit = checkRateLimit(user, "voice", todayJST);
    if (!rateLimit.allowed) {
      await replyText(replyToken, rateLimit.message!);
      return;
    }

    // 3. duration確認 — 180秒（3分）超え → 終了
    if (
      duration !== undefined &&
      duration > RATE_LIMITS.VOICE_MAX_DURATION_SEC * 1000
    ) {
      await replyText(
        replyToken,
        "音声メッセージは3分以内でお願いします"
      );
      return;
    }

    // 4. getContent でBufferとして取得（ディスクに書かない）
    const audioBuffer = await getContent(messageId);

    // 5. transcribeAudio で文字起こし
    const transcription = await transcribeAudio(audioBuffer);

    // 6. 空文字 or 5文字以下 → 聞き取れなかった旨を返して終了
    if (!transcription || transcription.trim().length <= 5) {
      await replyText(
        replyToken,
        "音声が聞き取れませんでした。もう少しはっきり話してみてください"
      );
      return;
    }

    // 7. buildSystemPrompt + VOICE_ADDITION + 文字起こし結果でchatCompletion
    const systemPrompt = buildSystemPrompt(user);
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt + "\n\n" + VOICE_ADDITION },
      { role: "user", content: transcription },
    ];

    const result = await chatCompletion(messages);

    // 8. replyText
    await replyText(replyToken, result.text);

    // 9. addChatLog (type: "voice", userMessage: 文字起こし結果)
    await addChatLog(userId, {
      type: "voice",
      userMessage: transcription,
      aiResponse: result.text,
      tokenUsage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
      },
    });

    // 10. updateStreak + dailyVoiceCount++ + totalVoice++
    const streakUpdates = updateStreak(user, todayJST);
    const counterUpdates: Partial<User> = {
      ...streakUpdates,
      dailyVoiceCount: rateLimit.resetNeeded ? 1 : user.dailyVoiceCount + 1,
      totalVoice: user.totalVoice + 1,
    };
    if (rateLimit.resetNeeded) {
      counterUpdates.dailyTextCount = 0;
      counterUpdates.lastCountDate = todayJST;
    }
    await updateUser(userId, counterUpdates);
  });
}
