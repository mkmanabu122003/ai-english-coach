import * as logger from "firebase-functions/logger";
import {
  getUser,
  createUser,
  updateUser,
  addChatLog,
  incrementDailyStat,
} from "../services/firestore";
import { getProfile, replyText, getContent } from "../services/line";
import { chatCompletion, transcribeAudio } from "../services/openai";
import { buildSystemPrompt } from "../prompts/systemPrompt";
import { getVoiceAddition } from "../prompts/voicePrompt";
import { withErrorHandling } from "../middleware/errorHandler";
import { checkRateLimit } from "../middleware/rateLimiter";
import { updateStreak } from "../utils/streak";
import { checkMilestones } from "../utils/milestones";
import { getTodayJST } from "../utils/dateUtils";
import { RATE_LIMITS } from "../config/constants";
import { TargetLanguage, getLangStrings } from "../config/languages";
import { User } from "../types";

export async function handleVoiceChat(
  userId: string,
  messageId: string,
  replyToken: string,
  lang: TargetLanguage = "en",
  duration?: number
): Promise<void> {
  await withErrorHandling(replyToken, async () => {
    const strings = getLangStrings(lang);

    // 1. getUser — なければcreateUser
    let user = await getUser(userId, lang);
    if (!user) {
      const profile = await getProfile(userId, lang);
      await createUser(userId, profile.displayName, lang);
      user = (await getUser(userId, lang))!;
    }

    // 2. checkRateLimit("voice")
    const todayJST = getTodayJST();
    const rateLimit = checkRateLimit(user, "voice", todayJST, lang);
    if (!rateLimit.allowed) {
      await incrementDailyStat(todayJST, "rateLimitHits", lang);
      await replyText(replyToken, rateLimit.message!, lang);
      return;
    }

    // 3. duration確認 — 180秒（3分）超え → 終了
    if (
      duration !== undefined &&
      duration > RATE_LIMITS.VOICE_MAX_DURATION_SEC * 1000
    ) {
      await replyText(replyToken, strings.voiceTooLongMessage, lang);
      return;
    }

    // 4. getContent でBufferとして取得（ディスクに書かない）
    const audioBuffer = await getContent(messageId, lang);

    // 5. transcribeAudio で文字起こし
    const whisperStartMs = Date.now();
    const transcription = await transcribeAudio(audioBuffer, strings.speechLanguageCode);
    const whisperLatencyMs = Date.now() - whisperStartMs;

    logger.info("API call completed", {
      userId,
      type: "voice_chat",
      lang,
      model: "google-speech-to-text",
      latencyMs: whisperLatencyMs,
    });

    // 6. 空文字 or 5文字以下 → 聞き取れなかった旨を返して終了
    if (!transcription || transcription.trim().length <= 5) {
      await replyText(replyToken, strings.voiceNotRecognizedMessage, lang);
      return;
    }

    // 7. buildSystemPrompt + VOICE_ADDITION + 文字起こし結果でchatCompletion
    const systemPrompt = buildSystemPrompt(user, lang);
    const voiceAddition = getVoiceAddition(lang);
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt + "\n\n" + voiceAddition },
      { role: "user", content: transcription },
    ];

    const chatStartMs = Date.now();
    const result = await chatCompletion(messages);
    const chatLatencyMs = Date.now() - chatStartMs;

    logger.info("API call completed", {
      userId,
      type: "voice_chat",
      lang,
      model: "claude-sonnet-4",
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      latencyMs: chatLatencyMs,
    });

    // 8. マイルストーン達成チェック（reply前に計算）
    const streakUpdates = updateStreak(user, todayJST);
    const newTotalVoice = user.totalVoice + 1;
    const milestoneResult = checkMilestones(user, {
      chatType: "voice",
      newStreak: streakUpdates.currentStreak ?? user.currentStreak,
      newTotalChats: user.totalChats,
      newTotalVoice: newTotalVoice,
    }, lang);

    let responseText = result.text;
    if (milestoneResult.messages.length > 0) {
      responseText += "\n\n" + milestoneResult.messages.join("\n");
    }

    await replyText(replyToken, responseText, lang);

    // 9. addChatLog + 統計カウンター更新
    await addChatLog(userId, {
      type: "voice",
      userMessage: transcription,
      aiResponse: responseText,
      tokenUsage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
      },
    }, lang);

    // 統計カウンターのインクリメント
    const statPromises: Promise<void>[] = [
      incrementDailyStat(todayJST, "voiceChats", lang),
      incrementDailyStat(todayJST, "promptTokens", lang, result.usage.promptTokens),
      incrementDailyStat(todayJST, "completionTokens", lang, result.usage.completionTokens),
    ];
    if (user.lastActiveDate !== todayJST) {
      statPromises.push(incrementDailyStat(todayJST, "dau", lang));
    }
    await Promise.all(statPromises);

    // 10. updateStreak + dailyVoiceCount++ + totalVoice++ + milestones + onboarding
    const counterUpdates: Partial<User> = {
      ...streakUpdates,
      dailyVoiceCount: rateLimit.resetNeeded ? 1 : user.dailyVoiceCount + 1,
      totalVoice: newTotalVoice,
    };
    if (rateLimit.resetNeeded) {
      counterUpdates.dailyTextCount = 0;
      counterUpdates.lastCountDate = todayJST;
    }
    if (milestoneResult.ids.length > 0) {
      counterUpdates.achievedMilestones = [
        ...(user.achievedMilestones ?? []),
        ...milestoneResult.ids,
      ];
    }

    // onboardingStatus 更新
    const onboarding = user.onboardingStatus ?? {
      firstText: false, levelSet: false, pushTimeSet: false,
      firstVoice: false, streak3: false,
    };
    let onboardingChanged = false;
    if (!onboarding.firstVoice && user.totalVoice === 0) {
      onboarding.firstVoice = true;
      onboardingChanged = true;
    }
    const newStreak = streakUpdates.currentStreak ?? user.currentStreak;
    if (!onboarding.streak3 && newStreak >= 3) {
      onboarding.streak3 = true;
      onboardingChanged = true;
    }
    if (onboardingChanged) {
      counterUpdates.onboardingStatus = onboarding;
    }

    await updateUser(userId, counterUpdates, lang);
  }, lang);
}
