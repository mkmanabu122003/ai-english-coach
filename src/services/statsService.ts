import * as logger from "firebase-functions/logger";
import { Timestamp } from "firebase-admin/firestore";
import { TargetLanguage } from "../config/languages";
import { LangSplit, User } from "../types";
import {
  getAllUsers,
  getAllActiveUsers,
  getWeeklyChatLogs,
  setDailyStats,
  updateUser,
} from "./firestore";
import { calculateHealthScore } from "../utils/healthScore";
import { getTodayJST } from "../utils/dateUtils";

function emptyLangSplit(): LangSplit {
  return { en: 0, es: 0 };
}

/**
 * Generate daily stats document by scanning all users.
 * Called by the dailyStats Cloud Function after midnight JST.
 *
 * Computes user-count-based metrics (totals, averages, health scores)
 * and merges them into the daily stats doc alongside the real-time counters
 * that were incremented throughout the day.
 */
export async function generateDailyStats(): Promise<void> {
  const todayJST = getTodayJST();
  logger.info("generateDailyStats: starting", { date: todayJST });

  const totalUsers = emptyLangSplit();
  const activeUsers = emptyLangSplit();
  const freeUsers = emptyLangSplit();
  const proUsers = emptyLangSplit();
  const avgStreak = emptyLangSplit();
  const avgHealthScore = emptyLangSplit();
  const churnRiskCount = emptyLangSplit();

  const streakSums: LangSplit = { en: 0, es: 0 };
  const healthSums: LangSplit = { en: 0, es: 0 };
  const activeCount: LangSplit = { en: 0, es: 0 };

  const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const lang of ["en", "es"] as TargetLanguage[]) {
    const allUsers = await getAllUsers(lang);
    const active = allUsers.filter((u) => u.isActive);

    totalUsers[lang] = allUsers.length;
    activeUsers[lang] = active.length;
    freeUsers[lang] = allUsers.filter((u) => u.plan === "free").length;
    proUsers[lang] = allUsers.filter((u) => u.plan === "bot_pro").length;

    // Process health scores for active users
    for (const user of active) {
      const chatLogs = await getWeeklyChatLogs(user.lineUserId, sevenDaysAgo, lang);
      const score = calculateHealthScore(user, chatLogs);

      // Write health score back to user
      await updateUser(user.lineUserId, { healthScore: score }, lang);

      streakSums[lang] += user.currentStreak;
      healthSums[lang] += score;
      activeCount[lang]++;

      if (score < 30 && user.plan === "bot_pro") {
        churnRiskCount[lang]++;
      }
    }

    if (activeCount[lang] > 0) {
      avgStreak[lang] = Math.round(streakSums[lang] / activeCount[lang]);
      avgHealthScore[lang] = Math.round(healthSums[lang] / activeCount[lang]);
    }
  }

  // Merge computed stats into the daily doc (preserves real-time counters)
  await setDailyStats(todayJST, {
    totalUsers,
    activeUsers,
    freeUsers,
    proUsers,
    avgStreak,
    avgHealthScore,
    churnRiskCount,
    generatedAt: Timestamp.now(),
  });

  logger.info("generateDailyStats: completed", {
    date: todayJST,
    totalEn: totalUsers.en,
    totalEs: totalUsers.es,
    activeEn: activeUsers.en,
    activeEs: activeUsers.es,
  });
}
