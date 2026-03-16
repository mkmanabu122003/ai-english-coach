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
import { buildReportPrompt, buildReportWithLearningsPrompt } from "../prompts/reportPrompt";
import {
  getNudgeMessage,
  pickQuestion,
  NudgeType,
} from "../prompts/pushMessages";
import { getCurrentHourJST, getTodayJST, getWeekId } from "../utils/dateUtils";
import { PUSH_BATCH_SIZE, PUSH_BATCH_DELAY_MS, INACTIVE_ALERT_DAYS } from "../config/constants";
import { TargetLanguage, getLangStrings } from "../config/languages";
import { calculateSkillScores, formatScoreDelta } from "../utils/skillScore";
import { User } from "../types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── dailyPush ──

export async function dailyPush(lang: TargetLanguage = "en"): Promise<void> {
  const currentHour = getCurrentHourJST();
  const todayJST = getTodayJST();

  const users = await getActiveUsersByPushTime(currentHour, lang);
  logger.info("dailyPush: target users", {
    hour: currentHour,
    lang,
    count: users.length,
  });

  // バッチ処理: 10人ずつ、間に200msディレイ
  for (let i = 0; i < users.length; i += PUSH_BATCH_SIZE) {
    const batch = users.slice(i, i + PUSH_BATCH_SIZE);
    await Promise.allSettled(
      batch.map((user) => sendDailyPush(user, todayJST, lang))
    );
    if (i + PUSH_BATCH_SIZE < users.length) {
      await sleep(PUSH_BATCH_DELAY_MS);
    }
  }
}

async function sendDailyPush(user: User, todayJST: string, lang: TargetLanguage): Promise<void> {
  try {
    const strings = getLangStrings(lang);

    // 施策5: 学習済みユーザーには励ましメッセージ（スキップではなく）
    if (user.lastActiveDate === todayJST) {
      const msgFns = strings.dailyCompletedMessages;
      const msgFn = msgFns[Math.floor(Math.random() * msgFns.length)];
      await pushText(user.lineUserId, msgFn(user.currentStreak), lang);
      return;
    }

    // 施策4: 14日以上不活動ユーザーは月曜のみ週1回送信
    const inactiveDays = getInactiveDays(user, todayJST);
    if (inactiveDays >= 14) {
      const dayOfWeek = new Date(todayJST + "T00:00:00Z").getUTCDay();
      if (dayOfWeek !== 1) {
        // 月曜以外はスキップ
        return;
      }
    }

    // nudgeタイプ判定
    const nudgeType = determineNudgeType(user, todayJST);
    const nudgeMessage = getNudgeMessage(nudgeType, lang);

    // 施策4: comebackナッジ時はレベルを1段階下げて出題
    let questionLevel = user.englishLevel;
    if (nudgeType === "comeback") {
      if (questionLevel === "advanced") questionLevel = "intermediate";
      else if (questionLevel === "intermediate") questionLevel = "beginner";
    }

    // 質問選択: レベルに合った、recentQuestionsに含まれない質問をランダム選択
    const question = pickQuestion(user.recentQuestions, questionLevel, lang);

    // 施策7: 前日の未回答問題リマインド
    let reminderSuffix = "";
    if (
      user.lastPushQuestion &&
      !user.lastPushQuestion.answered
    ) {
      reminderSuffix = strings.unansweredReminderTemplate(user.lastPushQuestion.questionText);
    }

    const message = `${nudgeMessage}\n\n🗣️ ${question.question}${reminderSuffix}`;
    await pushText(user.lineUserId, message, lang);

    logger.info("Push sent", {
      userId: user.lineUserId,
      type: "daily_push",
      lang,
      nudgeType,
      questionId: question.id,
    });

    // recentQuestions更新（7件超えたら古いのを削除）
    const updatedRecent = [...user.recentQuestions, question.id];
    if (updatedRecent.length > 7) {
      updatedRecent.splice(0, updatedRecent.length - 7);
    }
    await updateUser(user.lineUserId, {
      recentQuestions: updatedRecent,
      lastPushQuestion: {
        questionText: question.question,
        sentAt: Timestamp.now(),
        answered: false,
      },
      interventions: [
        ...(user.interventions ?? []),
        {
          type: "auto_nudge" as const,
          content: message,
          sentAt: Timestamp.now(),
        },
      ],
    }, lang);
  } catch (err) {
    logger.error("dailyPush: failed for user", {
      userId: user.lineUserId,
      type: "daily_push",
      lang,
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

function getInactiveDays(user: User, todayJST: string): number {
  if (!user.lastActiveDate) return Infinity;
  const lastActive = new Date(user.lastActiveDate + "T00:00:00Z");
  const today = new Date(todayJST + "T00:00:00Z");
  return Math.floor(
    (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function determineNudgeType(user: User, todayJST: string): NudgeType {
  if (!user.lastActiveDate) {
    return "gentle_nudge";
  }

  const diffDays = getInactiveDays(user, todayJST);

  // 連続学習中（昨日も学習していて、当日まだ未学習）
  if (diffDays === 1 && user.currentStreak >= 1) {
    return "streak_boost";
  }

  // 施策4: 7日以上不活動 → comeback
  if (diffDays >= 7) {
    return "comeback";
  }

  // 未学習3日以上
  if (diffDays >= 3) {
    return "strong_nudge";
  }

  // 未学習1-2日
  return "gentle_nudge";
}

// ── weeklyReport ──

export async function weeklyReport(lang: TargetLanguage = "en"): Promise<void> {
  const allUsers = await getAllActiveUsers(lang);
  logger.info("weeklyReport: target users", { lang, count: allUsers.length });

  // バッチ処理: 10人ずつ、間に200msディレイ
  for (let i = 0; i < allUsers.length; i += PUSH_BATCH_SIZE) {
    const batch = allUsers.slice(i, i + PUSH_BATCH_SIZE);
    await Promise.allSettled(
      batch.map((user) => sendWeeklyReport(user, lang))
    );
    if (i + PUSH_BATCH_SIZE < allUsers.length) {
      await sleep(PUSH_BATCH_DELAY_MS);
    }
  }
}

async function sendWeeklyReport(user: User, lang: TargetLanguage): Promise<void> {
  try {
    const strings = getLangStrings(lang);

    // 7日前のTimestampを計算
    const sevenDaysAgo = Timestamp.fromMillis(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    // chatLogsを集計
    const logs = await getWeeklyChatLogs(user.lineUserId, sevenDaysAgo, lang);

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

    // 添削履歴を抽出（📝マーカーを含むAI応答 = 添削あり）
    const corrections = logs
      .filter((log) => log.aiResponse && log.aiResponse.includes("📝"))
      .slice(-10) // 最新10件まで
      .map((log) => log.aiResponse.slice(0, 200)) // 各200文字まで
      .join("\n---\n");

    // 施策3: FreeユーザーにはAI生成コメントなしの簡易レポート
    let reportText: string;
    if (user.plan === "free") {
      reportText =
        strings.weeklyReportHeader(textCount, voiceCount, activeDays, user.currentStreak) +
        strings.weeklyReportFreeFooter;
    } else {
      // ProユーザーにはAI生成コメント + 学びTOP3付きレポート
      const hasCorrections = corrections.length > 0;
      const prompt = hasCorrections
        ? buildReportWithLearningsPrompt({
            displayName: user.displayName,
            textCount,
            voiceCount,
            activeDays,
            currentStreak: user.currentStreak,
            topTopics,
            corrections,
          }, lang)
        : buildReportPrompt({
            displayName: user.displayName,
            textCount,
            voiceCount,
            activeDays,
            currentStreak: user.currentStreak,
            topTopics,
          }, lang);

      const startMs = Date.now();
      const result = await chatCompletion(
        [{ role: "user", content: prompt }],
        hasCorrections ? 400 : 200
      );
      const latencyMs = Date.now() - startMs;

      logger.info("API call completed", {
        userId: user.lineUserId,
        type: "weekly_report",
        lang,
        model: "claude-sonnet-4",
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        latencyMs,
      });

      // Parse the structured response
      const header = strings.weeklyReportHeader(textCount, voiceCount, activeDays, user.currentStreak);
      if (hasCorrections && result.text.includes("---COMMENT---")) {
        const commentMatch = result.text.match(/---COMMENT---\s*([\s\S]*?)---LEARNINGS---/);
        const learningsMatch = result.text.match(/---LEARNINGS---\s*([\s\S]*?)$/);
        const comment = commentMatch ? commentMatch[1].trim() : result.text;
        const learnings = learningsMatch ? learningsMatch[1].trim() : "";

        reportText = header + comment;
        if (learnings && learnings !== "添削データなし") {
          reportText += `\n\n📝 今週の学びTOP3\n${learnings}`;
        }
      } else {
        reportText = header + result.text;
      }
    }

    // スキルスコア算出・追記（Pro/Free共通）
    const newScores = calculateSkillScores(user, logs);
    if (newScores) {
      const scoreUpdates: Partial<User> = {
        previousSkillScores: user.skillScores ?? undefined,
        skillScores: newScores,
      };
      await updateUser(user.lineUserId, scoreUpdates, lang);

      const delta = user.skillScores
        ? ` ${formatScoreDelta(newScores.overall, user.skillScores.overall)}`
        : "";
      reportText += `\n\n📊 スキルスコア: ${newScores.cefrLabel} (${newScores.overall}点)${delta}`;
    }

    await pushText(user.lineUserId, reportText, lang);

    // weeklyReports保存
    const todayJST = getTodayJST();
    const weekId = getWeekId(todayJST);
    await saveWeeklyReport(user.lineUserId, weekId, {
      weekStart: todayJST,
      textCount,
      voiceCount,
      activeDays,
      reportText,
    }, lang);
  } catch (err) {
    logger.error("weeklyReport: failed for user", {
      userId: user.lineUserId,
      type: "weekly_report",
      lang,
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

// ── churnDetection ──

export async function churnDetection(lang: TargetLanguage = "en"): Promise<void> {
  const todayJST = getTodayJST();
  const users = await getAllActiveUsers(lang);
  const strings = getLangStrings(lang);

  // Bot Proプランで一定期間非アクティブなユーザーを検出
  const churningUsers = users.filter((u) => {
    if (u.plan !== "bot_pro") return false;
    if (!u.lastActiveDate) return false;

    const lastActive = new Date(u.lastActiveDate + "T00:00:00Z");
    const today = new Date(todayJST + "T00:00:00Z");
    const diffDays = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= INACTIVE_ALERT_DAYS;
  });

  logger.info("churnDetection: results", {
    lang,
    totalActive: users.length,
    churning: churningUsers.length,
  });

  if (churningUsers.length === 0) {
    return;
  }

  // インストラクターへのアラート（環境変数でLINE IDを設定）
  const instructorId = process.env.INSTRUCTOR_LINE_USER_ID;
  if (!instructorId) {
    logger.warn("churnDetection: INSTRUCTOR_LINE_USER_ID not set, skipping alert");
    return;
  }

  const alertLines = churningUsers.map((u) => {
    const lastActive = new Date(u.lastActiveDate + "T00:00:00Z");
    const today = new Date(todayJST + "T00:00:00Z");
    const days = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `・${u.displayName}（${days}${strings.churnDaysLabel}）`;
  });

  const alertMessage =
    strings.churnAlertHeader(todayJST, INACTIVE_ALERT_DAYS) +
    alertLines.join("\n");

  try {
    // Churn alerts are always sent via the English bot's LINE account
    await pushText(instructorId, alertMessage, "en");
    logger.info("churnDetection: alert sent", {
      instructorId,
      lang,
      churningCount: churningUsers.length,
    });
  } catch (err) {
    logger.error("churnDetection: failed to send alert", {
      error: err instanceof Error ? err.message : err,
    });
  }
}
