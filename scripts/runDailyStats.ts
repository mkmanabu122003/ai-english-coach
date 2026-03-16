/**
 * Manually run generateDailyStats logic to populate computed fields
 * (totalUsers, activeUsers, proUsers, avgStreak, avgHealthScore, churnRiskCount)
 * for today's stats document.
 *
 * Usage:
 *   npx ts-node scripts/runDailyStats.ts
 */

import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const projectId = process.env.GCP_PROJECT_ID || "ai-english-coach-bot";
admin.initializeApp({ projectId });
const db = admin.firestore();

interface LangSplit {
  en: number;
  es: number;
}

interface User {
  lineUserId: string;
  isActive: boolean;
  plan: string;
  currentStreak: number;
  englishLevel: string;
  healthScore?: number;
}

interface ChatLog {
  type: "text" | "voice";
  createdAt: admin.firestore.Timestamp;
}

const LEVEL_POINTS: Record<string, number> = {
  unset: 0,
  beginner: 7,
  intermediate: 14,
  advanced: 20,
};

function calculateHealthScore(user: User, recentChatLogs: ChatLog[]): number {
  const streakScore = Math.min(user.currentStreak / 7, 1) * 30;

  const activeDates = new Set<string>();
  let hasVoice = false;
  for (const log of recentChatLogs) {
    if (log.createdAt) {
      const dateStr = log.createdAt.toDate().toISOString().slice(0, 10);
      activeDates.add(dateStr);
    }
    if (log.type === "voice") {
      hasVoice = true;
    }
  }
  const frequencyScore = Math.min(activeDates.size / 5, 1) * 30;
  const voiceScore = hasVoice ? 20 : 0;
  const levelScore = LEVEL_POINTS[user.englishLevel] ?? 0;

  return Math.round(streakScore + frequencyScore + voiceScore + levelScore);
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

async function generateDailyStats(): Promise<void> {
  const todayJST = getTodayJST();
  console.log(`Generating daily stats for: ${todayJST}`);

  const totalUsers: LangSplit = { en: 0, es: 0 };
  const activeUsers: LangSplit = { en: 0, es: 0 };
  const freeUsers: LangSplit = { en: 0, es: 0 };
  const proUsers: LangSplit = { en: 0, es: 0 };
  const avgStreak: LangSplit = { en: 0, es: 0 };
  const avgHealthScore: LangSplit = { en: 0, es: 0 };
  const churnRiskCount: LangSplit = { en: 0, es: 0 };

  const streakSums: LangSplit = { en: 0, es: 0 };
  const healthSums: LangSplit = { en: 0, es: 0 };
  const activeCount: LangSplit = { en: 0, es: 0 };

  const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const lang of ["en", "es"] as const) {
    const collectionName = lang === "en" ? "users" : "usersEs";
    const snap = await db.collection(collectionName).get();
    const allUsers = snap.docs.map((doc) => doc.data() as User);
    const active = allUsers.filter((u) => u.isActive);

    totalUsers[lang] = allUsers.length;
    activeUsers[lang] = active.length;
    freeUsers[lang] = allUsers.filter((u) => u.plan === "free").length;
    proUsers[lang] = allUsers.filter((u) => u.plan === "bot_pro").length;

    for (const user of active) {
      // Get recent chat logs for health score
      const chatSnap = await db
        .collection(collectionName)
        .doc(user.lineUserId)
        .collection("chatLogs")
        .where("createdAt", ">=", sevenDaysAgo)
        .orderBy("createdAt", "asc")
        .get();
      const chatLogs = chatSnap.docs.map((doc) => doc.data() as ChatLog);

      const score = calculateHealthScore(user, chatLogs);

      // Write health score back to user
      await db.collection(collectionName).doc(user.lineUserId).update({ healthScore: score });

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

    console.log(`  ${lang}: total=${totalUsers[lang]}, active=${activeUsers[lang]}, pro=${proUsers[lang]}`);
  }

  // Merge computed stats into the daily doc (preserves real-time counters)
  const statsRef = db.collection("stats").doc("daily").collection("dates").doc(todayJST);
  await statsRef.set(
    {
      totalUsers,
      activeUsers,
      freeUsers,
      proUsers,
      avgStreak,
      avgHealthScore,
      churnRiskCount,
      generatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  console.log(`\nDaily stats generated successfully for ${todayJST}`);
}

generateDailyStats()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
