import * as logger from "firebase-functions/logger";
import { Timestamp } from "firebase-admin/firestore";
import {
  getUser,
  createUser,
  updateUser,
  addChatLog,
  getRecentChatLogs,
  incrementDailyStat,
} from "../services/firestore";
import { getProfile, replyText, replyFlexMessage } from "../services/line";
import { chatCompletion } from "../services/openai";
import { buildSystemPrompt, extractLevel, shouldReassessLevel } from "../prompts/systemPrompt";
import { withErrorHandling } from "../middleware/errorHandler";
import { checkRateLimit } from "../middleware/rateLimiter";
import { sanitizeTextInput } from "../middleware/validator";
import { updateStreak } from "../utils/streak";
import { checkMilestones } from "../utils/milestones";
import { getTodayJST } from "../utils/dateUtils";
import {
  CONTEXT_WINDOW_SIZE,
  CONTEXT_RESET_MINUTES,
} from "../config/constants";
import { TargetLanguage, getLangStrings } from "../config/languages";
import { User } from "../types";
import { getWeekActivityDates } from "../services/firestore";
import { buildLevelCheckFlexMessage } from "../utils/guideBadge";

export async function handleTextChat(
  userId: string,
  text: string,
  replyToken: string,
  lang: TargetLanguage = "en"
): Promise<void> {
  await withErrorHandling(replyToken, async () => {
    const strings = getLangStrings(lang);

    // 1. getUser — create if missing (follow前にメッセージが来るケースの保険)
    let user = await getUser(userId, lang);
    if (!user) {
      const profile = await getProfile(userId, lang);
      await createUser(userId, profile.displayName, lang);
      user = (await getUser(userId, lang))!;
    }

    // 2a. レベル確認コマンド → Flex Message
    if (text === strings.commands.levelCheck) {
      const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeDates = await getWeekActivityDates(userId, sevenDaysAgo, lang);
      const todayJST = getTodayJST();
      const flexMessage = buildLevelCheckFlexMessage(user, activeDates, todayJST);
      await replyFlexMessage(replyToken, flexMessage, lang);
      return;
    }

    // 2b. 日本語コマンド判定（完全一致）
    const commandResult = handleCommand(text, user, lang);
    if (commandResult !== null) {
      if (commandResult.updates) {
        await updateUser(userId, commandResult.updates, lang);
      }
      // 施策1: 通知設定コマンド後のオンボーディング誘導
      let commandReply = commandResult.reply;
      if (commandResult.onboardingKey) {
        commandReply += strings.onboardingMessages[commandResult.onboardingKey];
      }
      await replyText(replyToken, commandReply, lang);
      return;
    }

    // 3. sanitizeTextInput
    const sanitized = sanitizeTextInput(text);
    if (sanitized.length === 0) {
      return;
    }

    // 4. checkRateLimit（施策6: FreeプランのTry again免除チェック）
    const todayJST = getTodayJST();
    let tryAgainExempt = false;
    if (user.plan === "free") {
      const recentLogs = await getRecentChatLogs(userId, 1, lang);
      if (recentLogs.length > 0) {
        const lastLog = recentLogs[0];
        const hasRetryPrompt = lastLog.aiResponse.includes("🔄");
        const elapsed = lastLog.createdAt
          ? (Date.now() - lastLog.createdAt.toMillis()) / 1000
          : Infinity;
        tryAgainExempt = hasRetryPrompt && elapsed <= 60;
      }
    }
    const rateLimit = checkRateLimit(user, "text", todayJST, lang, tryAgainExempt);
    if (!rateLimit.allowed) {
      await incrementDailyStat(todayJST, "rateLimitHits", lang);
      await replyText(replyToken, rateLimit.message!, lang);
      return;
    }

    // 5. getRecentChatLogs — コンテキスト構築
    const recentLogs = await getRecentChatLogs(userId, CONTEXT_WINDOW_SIZE, lang);
    const contextMessages = buildContextMessages(recentLogs);

    // 6. buildSystemPrompt + 会話履歴 + ユーザーメッセージでchatCompletion
    const systemPrompt = buildSystemPrompt(user, lang);
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
      ...contextMessages,
      { role: "user", content: sanitized },
    ];

    const startMs = Date.now();
    const result = await chatCompletion(messages);
    const latencyMs = Date.now() - startMs;

    logger.info("API call completed", {
      userId,
      type: "text_chat",
      lang,
      model: "claude-sonnet-4",
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      latencyMs,
    });

    // 7. レベル抽出・更新（初回判定 or 定期再判定）
    let responseText = result.text;
    if (user.englishLevel === "unset" || shouldReassessLevel(user)) {
      const { level, cleanResponse } = extractLevel(responseText);
      responseText = cleanResponse;
      if (level && level !== user.englishLevel) {
        const { Timestamp: Ts } = await import("firebase-admin/firestore");
        const previousLevel = user.englishLevel;
        const updates: Partial<User> = {
          englishLevel: level as User["englishLevel"],
          levelHistory: [
            ...(user.levelHistory ?? []),
            { level, changedAt: Ts.now() },
          ],
        };
        if (user.englishLevel === "unset") {
          updates.onboardingStatus = {
            ...(user.onboardingStatus ?? { firstText: false, levelSet: false, pushTimeSet: false, firstVoice: false, streak3: false }),
            levelSet: true,
          };
        }
        await updateUser(userId, updates, lang);

        // レベルアップ通知（初回判定時は除く）
        if (previousLevel !== "unset") {
          const levelNames: Record<string, string> = {
            beginner: "Beginner",
            intermediate: "Intermediate",
            advanced: "Advanced",
          };
          responseText += `\n\n🎊 レベルアップ！ ${levelNames[previousLevel] ?? previousLevel} → ${levelNames[level] ?? level}\nこれまでの努力の成果です！`;
        }
      }
    }

    // 8. replyText — 初回返信にはヒント、テキスト3回ごと（添削時のみ）に音声促進を追加
    if (user.totalChats === 0) {
      responseText += strings.firstChatHint;
    } else {
      const todayTextCount = rateLimit.resetNeeded ? 1 : user.dailyTextCount + 1;
      const todayVoiceCount = rateLimit.resetNeeded ? 0 : user.dailyVoiceCount;
      const isCorrection = responseText.includes("📝");
      if (todayTextCount % 3 === 0 && todayVoiceCount === 0 && isCorrection) {
        responseText += strings.voicePromptMessage;
      }
    }
    // 8b. マイルストーン達成チェック（reply前に計算）
    const streakUpdates = updateStreak(user, todayJST);
    const newTotalChats = user.totalChats + 1;
    const milestoneResult = checkMilestones(user, {
      chatType: "text",
      newStreak: streakUpdates.currentStreak ?? user.currentStreak,
      newTotalChats: newTotalChats,
      newTotalVoice: user.totalVoice,
    }, lang);
    if (milestoneResult.messages.length > 0) {
      responseText += "\n\n" + milestoneResult.messages.join("\n");
    }

    // 施策1: オンボーディング段階的ナビゲーション
    const onboardingNav = getOnboardingNavMessage(user, streakUpdates, "text", strings);
    if (onboardingNav) {
      responseText += onboardingNav;
    }

    // 施策2: ストリーク切れリカバリー
    if (
      user.currentStreak === 0 &&
      user.longestStreak >= 3 &&
      (streakUpdates.currentStreak === 1)
    ) {
      responseText += strings.streakRecoveryMessage(user.longestStreak);
    }

    await replyText(replyToken, responseText, lang);

    // 9. addChatLog + 統計カウンター更新
    await addChatLog(userId, {
      type: "text",
      userMessage: sanitized,
      aiResponse: responseText,
      tokenUsage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
      },
    }, lang);

    // 統計カウンターのインクリメント（日次統計ドキュメントへ）
    const statPromises: Promise<void>[] = [
      incrementDailyStat(todayJST, "textChats", lang),
      incrementDailyStat(todayJST, "promptTokens", lang, result.usage.promptTokens),
      incrementDailyStat(todayJST, "completionTokens", lang, result.usage.completionTokens),
    ];
    // DAU: 当日初チャットの場合のみカウント
    if (user.lastActiveDate !== todayJST) {
      statPromises.push(incrementDailyStat(todayJST, "dau", lang));
    }
    // 初回チャットユーザー
    if (user.totalChats === 0) {
      statPromises.push(incrementDailyStat(todayJST, "firstChatUsers", lang));
    }
    await Promise.all(statPromises);

    // 10. updateStreak + dailyTextCount++ + totalChats++ + milestones + onboarding
    const counterUpdates: Partial<User> = {
      ...streakUpdates,
      dailyTextCount: tryAgainExempt
        ? (rateLimit.resetNeeded ? 0 : user.dailyTextCount)
        : (rateLimit.resetNeeded ? 1 : user.dailyTextCount + 1),
      totalChats: newTotalChats,
    };
    if (rateLimit.resetNeeded) {
      counterUpdates.dailyVoiceCount = 0;
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
    if (!onboarding.firstText && user.totalChats === 0) {
      onboarding.firstText = true;
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

    // 施策7: プッシュ問題に回答した記録
    if (user.lastPushQuestion && !user.lastPushQuestion.answered) {
      counterUpdates.lastPushQuestion = {
        ...user.lastPushQuestion,
        answered: true,
      };
    }

    await updateUser(userId, counterUpdates, lang);
  }, lang);
}

/** 施策1: オンボーディング完了時の次ステップ誘導メッセージ */
function getOnboardingNavMessage(
  user: User,
  streakUpdates: Partial<User>,
  chatType: "text" | "voice",
  strings: ReturnType<typeof getLangStrings>
): string | null {
  const onboarding = user.onboardingStatus ?? {
    firstText: false, levelSet: false, pushTimeSet: false,
    firstVoice: false, streak3: false,
  };

  // levelSet が今回のチャットで新たに設定された（初回テキスト時）
  if (
    chatType === "text" &&
    user.englishLevel === "unset" &&
    user.totalChats === 0 &&
    !onboarding.pushTimeSet
  ) {
    return strings.onboardingMessages.afterLevelSet;
  }

  // firstVoice が今回初めて達成された
  if (
    chatType === "voice" &&
    !onboarding.firstVoice &&
    user.totalVoice === 0
  ) {
    return strings.onboardingMessages.afterFirstVoice;
  }

  // streak3 が今回初めて達成された
  const newStreak = streakUpdates.currentStreak ?? user.currentStreak;
  if (!onboarding.streak3 && newStreak >= 3) {
    return strings.onboardingMessages.afterStreak3;
  }

  return null;
}

function handleCommand(
  text: string,
  user: User,
  lang: TargetLanguage
): { reply: string; updates?: Partial<User>; onboardingKey?: keyof ReturnType<typeof getLangStrings>["onboardingMessages"] } | null {
  const strings = getLangStrings(lang);

  // 「通知設定 HH:MM」コマンド
  const pushTimeMatch = text.match(strings.commands.pushTimePattern);
  if (pushTimeMatch) {
    const hour = parseInt(pushTimeMatch[1], 10);
    const minute = parseInt(pushTimeMatch[2], 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return {
        reply: strings.commands.pushTimeErrorReply,
      };
    }
    const newTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const onboarding = user.onboardingStatus ?? {
      firstText: false, levelSet: false, pushTimeSet: false,
      firstVoice: false, streak3: false,
    };
    const updates: Partial<User> = { pushTime: newTime };
    let onboardingKey: keyof ReturnType<typeof getLangStrings>["onboardingMessages"] | undefined;
    if (!onboarding.pushTimeSet) {
      updates.onboardingStatus = { ...onboarding, pushTimeSet: true };
      onboardingKey = "afterPushTimeSet";
    }
    return {
      reply: strings.commands.pushTimeSuccessReply(newTime),
      updates,
      onboardingKey,
    };
  }

  switch (text) {
    case strings.commands.notifOff:
      return {
        reply: strings.commands.notifOffReply,
        updates: { isActive: false },
      };
    case strings.commands.notifOn:
      return {
        reply: strings.commands.notifOnReply(user.pushTime),
        updates: { isActive: true },
      };
    case strings.commands.levelCheck:
      return {
        reply: strings.commands.levelCheckReply(
          user.englishLevel,
          user.currentStreak,
          user.totalChats,
          user.longestStreak
        ),
      };
    case strings.commands.help:
      return {
        reply: strings.commands.helpReply,
      };
    default:
      return null;
  }
}

function buildContextMessages(
  logs: Array<{
    userMessage: string;
    aiResponse: string;
    createdAt: Timestamp;
  }>
): Array<{ role: string; content: string }> {
  if (logs.length === 0) {
    return [];
  }

  // 最新ログのcreatedAtが60分以上前ならコンテキスト空にする
  const lastLog = logs[logs.length - 1];
  const lastCreatedAt = lastLog.createdAt;
  if (lastCreatedAt) {
    const now = Date.now();
    const logTime = lastCreatedAt.toMillis();
    const diffMinutes = (now - logTime) / (1000 * 60);
    if (diffMinutes > CONTEXT_RESET_MINUTES) {
      return [];
    }
  }

  const messages: Array<{ role: string; content: string }> = [];
  for (const log of logs) {
    messages.push({ role: "user", content: log.userMessage });
    messages.push({ role: "assistant", content: log.aiResponse });
  }
  return messages;
}
