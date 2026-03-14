import * as logger from "firebase-functions/logger";
import { Timestamp } from "firebase-admin/firestore";
import {
  getUser,
  createUser,
  updateUser,
  addChatLog,
  getRecentChatLogs,
} from "../services/firestore";
import { getProfile, replyText } from "../services/line";
import { chatCompletion } from "../services/openai";
import { buildSystemPrompt, extractLevel } from "../prompts/systemPrompt";
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
import { User } from "../types";

export async function handleTextChat(
  userId: string,
  text: string,
  replyToken: string
): Promise<void> {
  await withErrorHandling(replyToken, async () => {
    // 1. getUser — create if missing (follow前にメッセージが来るケースの保険)
    let user = await getUser(userId);
    if (!user) {
      const profile = await getProfile(userId);
      await createUser(userId, profile.displayName);
      user = (await getUser(userId))!;
    }

    // 2. 日本語コマンド判定（完全一致）
    const commandResult = handleCommand(text, user);
    if (commandResult !== null) {
      if (commandResult.updates) {
        await updateUser(userId, commandResult.updates);
      }
      await replyText(replyToken, commandResult.reply);
      return;
    }

    // 3. sanitizeTextInput
    const sanitized = sanitizeTextInput(text);
    if (sanitized.length === 0) {
      return;
    }

    // 4. checkRateLimit
    const todayJST = getTodayJST();
    const rateLimit = checkRateLimit(user, "text", todayJST);
    if (!rateLimit.allowed) {
      await replyText(replyToken, rateLimit.message!);
      return;
    }

    // 5. getRecentChatLogs — コンテキスト構築
    const recentLogs = await getRecentChatLogs(userId, CONTEXT_WINDOW_SIZE);
    const contextMessages = buildContextMessages(recentLogs);

    // 6. buildSystemPrompt + 会話履歴 + ユーザーメッセージでchatCompletion
    const systemPrompt = buildSystemPrompt(user);
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
      model: "claude-sonnet-4",
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      latencyMs,
    });

    // 7. englishLevel "unset" ならレベル抽出・更新
    let responseText = result.text;
    if (user.englishLevel === "unset") {
      const { level, cleanResponse } = extractLevel(responseText);
      responseText = cleanResponse;
      if (level) {
        await updateUser(userId, {
          englishLevel: level as User["englishLevel"],
        });
      }
    }

    // 8. replyText — 初回返信にはヒント、テキスト3回ごとに音声促進を追加
    if (user.totalChats === 0) {
      responseText +=
        "\n\n──────\n" +
        "💡 ヒント: 毎朝、今日の練習問題が届きます。\n" +
        "通知時間の変更は「通知設定 08:00」のように送ってください。";
    } else {
      const todayTextCount = rateLimit.resetNeeded ? 1 : user.dailyTextCount + 1;
      const todayVoiceCount = rateLimit.resetNeeded ? 0 : user.dailyVoiceCount;
      if (todayTextCount % 3 === 0 && todayVoiceCount === 0) {
        responseText +=
          "\n\n──────\n" +
          "🎤 テキストでの練習、順調ですね！\n" +
          "次は同じ内容を音声で言ってみましょう。\n" +
          "通訳ガイドは「話す力」が最重要です！";
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
    });
    if (milestoneResult.messages.length > 0) {
      responseText += "\n\n" + milestoneResult.messages.join("\n");
    }

    await replyText(replyToken, responseText);

    // 9. addChatLog
    await addChatLog(userId, {
      type: "text",
      userMessage: sanitized,
      aiResponse: responseText,
      tokenUsage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
      },
    });

    // 10. updateStreak + dailyTextCount++ + totalChats++ + milestones
    const counterUpdates: Partial<User> = {
      ...streakUpdates,
      dailyTextCount: rateLimit.resetNeeded ? 1 : user.dailyTextCount + 1,
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

    await updateUser(userId, counterUpdates);
  });
}

function handleCommand(
  text: string,
  user: User
): { reply: string; updates?: Partial<User> } | null {
  // 「通知設定 HH:MM」コマンド
  const pushTimeMatch = text.match(/^通知設定\s+(\d{1,2}):(\d{2})$/);
  if (pushTimeMatch) {
    const hour = parseInt(pushTimeMatch[1], 10);
    const minute = parseInt(pushTimeMatch[2], 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return {
        reply: "時刻の形式が正しくありません。例: 通知設定 08:00",
      };
    }
    const newTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return {
      reply: `通知時間を ${newTime} に変更しました`,
      updates: { pushTime: newTime },
    };
  }

  switch (text) {
    case "通知オフ":
      return {
        reply: "通知をオフにしました",
        updates: { isActive: false },
      };
    case "通知オン":
      return {
        reply: `通知をオンにしました。毎日${user.pushTime}に届きます`,
        updates: { isActive: true },
      };
    case "レベル確認":
      return {
        reply:
          `レベル: ${user.englishLevel}\n` +
          `連続学習: ${user.currentStreak}日\n` +
          `累計チャット: ${user.totalChats}回`,
      };
    case "ヘルプ":
      return {
        reply:
          "【使い方】\n" +
          "・英文を送ると添削します\n" +
          "・音声メッセージもOKです🎤\n" +
          "・日本語で質問もできます\n\n" +
          "【コマンド】\n" +
          "・通知オン / 通知オフ\n" +
          "・通知設定 HH:MM（例: 通知設定 21:00）\n" +
          "・レベル確認\n" +
          "・ヘルプ",
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
