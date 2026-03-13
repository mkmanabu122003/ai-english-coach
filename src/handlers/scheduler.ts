import * as logger from "firebase-functions/logger";
import { Timestamp } from "firebase-admin/firestore";
import {
  getActiveUsersByPushTime,
  getAllActiveUsers,
  getWeeklyChatLogs,
  updateUser,
  saveWeeklyReport,
} from "../services/firestore";
import { pushText } from "../services/line";
import { chatCompletion } from "../services/openai";
import { buildReportPrompt } from "../prompts/reportPrompt";
import {
  getNudgeMessage,
  pickQuestion,
  NudgeType,
} from "../prompts/pushMessages";
import { getCurrentHourJST, getTodayJST, getWeekId } from "../utils/dateUtils";
import { PUSH_BATCH_SIZE, PUSH_BATCH_DELAY_MS } from "../config/constants";
import { User } from "../types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── dailyPush ──

export async function dailyPush(): Promise<void> {
  const currentHour = getCurrentHourJST();
  const todayJST = getTodayJST();

  const users = await getActiveUsersByPushTime(currentHour);
  logger.info("dailyPush: target users", {
    hour: currentHour,
    count: users.length,
  });

  // バッチ処理: 10人ずつ、間に200msディレイ
  for (let i = 0; i < users.length; i += PUSH_BATCH_SIZE) {
    const batch = users.slice(i, i + PUSH_BATCH_SIZE);
    await Promise.allSettled(
      batch.map((user) => sendDailyPush(user, todayJST))
    );
    if (i + PUSH_BATCH_SIZE < users.length) {
      await sleep(PUSH_BATCH_DELAY_MS);
    }
  }
}

async function sendDailyPush(user: User, todayJST: string): Promise<void> {
  try {
    // lastActiveDate === today → skip（今日学習済み）
    if (user.lastActiveDate === todayJST) {
      return;
    }

    // nudgeタイプ判定
    const nudgeType = determineNudgeType(user, todayJST);
    const nudgeMessage = getNudgeMessage(nudgeType);

    // 質問選択: recentQuestionsに含まれない質問をランダム選択
    const question = pickQuestion(user.recentQuestions);

    const message = `${nudgeMessage}\n\n🗣️ ${question.question}`;
    await pushText(user.lineUserId, message);

    logger.info("Push sent", {
      userId: user.lineUserId,
      type: "daily_push",
      nudgeType,
      questionId: question.id,
    });

    // recentQuestions更新（7件超えたら古いのを削除）
    const updatedRecent = [...user.recentQuestions, question.id];
    if (updatedRecent.length > 7) {
      updatedRecent.splice(0, updatedRecent.length - 7);
    }
    await updateUser(user.lineUserId, { recentQuestions: updatedRecent });
  } catch (err) {
    logger.error("dailyPush: failed for user", {
      userId: user.lineUserId,
      type: "daily_push",
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

function determineNudgeType(user: User, todayJST: string): NudgeType {
  if (!user.lastActiveDate) {
    return "gentle_nudge";
  }

  const lastActive = new Date(user.lastActiveDate + "T00:00:00Z");
  const today = new Date(todayJST + "T00:00:00Z");
  const diffDays = Math.floor(
    (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 連続学習中（昨日も学習していて、当日まだ未学習）
  if (diffDays === 1 && user.currentStreak >= 1) {
    return "streak_boost";
  }

  // 未学習3日以上
  if (diffDays >= 3) {
    return "strong_nudge";
  }

  // 未学習1-2日
  return "gentle_nudge";
}

// ── weeklyReport ──

export async function weeklyReport(): Promise<void> {
  const users = await getAllActiveUsers();
  logger.info("weeklyReport: target users", { count: users.length });

  // バッチ処理: 10人ずつ、間に200msディレイ
  for (let i = 0; i < users.length; i += PUSH_BATCH_SIZE) {
    const batch = users.slice(i, i + PUSH_BATCH_SIZE);
    await Promise.allSettled(
      batch.map((user) => sendWeeklyReport(user))
    );
    if (i + PUSH_BATCH_SIZE < users.length) {
      await sleep(PUSH_BATCH_DELAY_MS);
    }
  }
}

async function sendWeeklyReport(user: User): Promise<void> {
  try {
    // 7日前のTimestampを計算
    const sevenDaysAgo = Timestamp.fromMillis(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    // chatLogsを集計
    const logs = await getWeeklyChatLogs(user.lineUserId, sevenDaysAgo);

    let textCount = 0;
    let voiceCount = 0;
    const activeDates = new Set<string>();
    const topics: string[] = [];

    for (const log of logs) {
      if (log.type === "text") {
        textCount++;
      } else {
        voiceCount++;
      }
      // activeDaysの算出
      if (log.createdAt) {
        const dateStr = log.createdAt.toDate().toISOString().slice(0, 10);
        activeDates.add(dateStr);
      }
      // トピック収集（ユーザーメッセージの先頭30文字）
      if (log.userMessage) {
        topics.push(log.userMessage.slice(0, 30));
      }
    }

    const activeDays = activeDates.size;
    const topTopics =
      topics.length > 0
        ? topics.slice(-5).join(", ")
        : "なし";

    // buildReportPromptでGPT-4oにコメント生成
    const prompt = buildReportPrompt({
      displayName: user.displayName,
      textCount,
      voiceCount,
      activeDays,
      currentStreak: user.currentStreak,
      topTopics,
    });

    const startMs = Date.now();
    const result = await chatCompletion(
      [{ role: "user", content: prompt }],
      200
    );
    const latencyMs = Date.now() - startMs;

    logger.info("API call completed", {
      userId: user.lineUserId,
      type: "weekly_report",
      model: "gpt-4o",
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      latencyMs,
    });

    // フォーマットして送信
    const reportText =
      `📊 今週の振り返り\n` +
      `テキスト: ${textCount}回\n` +
      `音声: ${voiceCount}回\n` +
      `学習日数: ${activeDays}/7\n` +
      `ストリーク: ${user.currentStreak}日\n\n` +
      result.text;

    await pushText(user.lineUserId, reportText);

    // weeklyReports保存
    const todayJST = getTodayJST();
    const weekId = getWeekId(todayJST);
    await saveWeeklyReport(user.lineUserId, weekId, {
      weekStart: todayJST,
      textCount,
      voiceCount,
      activeDays,
      reportText,
    });
  } catch (err) {
    logger.error("weeklyReport: failed for user", {
      userId: user.lineUserId,
      type: "weekly_report",
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}
