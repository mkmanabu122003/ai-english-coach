import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { User, ChatLog, WeeklyReport, AdminAction, DailyStats } from "../types";
import { TargetLanguage, getLangStrings } from "../config/languages";

let db: FirebaseFirestore.Firestore;

export function getDb(): FirebaseFirestore.Firestore {
  return db;
}

export function initializeFirestore(): void {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  db = admin.firestore();
}

function usersRef(lang: TargetLanguage = "en"): FirebaseFirestore.CollectionReference {
  const collection = getLangStrings(lang).usersCollection;
  return db.collection(collection);
}

function chatLogsRef(userId: string, lang: TargetLanguage = "en"): FirebaseFirestore.CollectionReference {
  const collection = getLangStrings(lang).usersCollection;
  return db.collection(collection).doc(userId).collection("chatLogs");
}

function weeklyReportsRef(userId: string, lang: TargetLanguage = "en"): FirebaseFirestore.CollectionReference {
  const collection = getLangStrings(lang).usersCollection;
  return db.collection(collection).doc(userId).collection("weeklyReports");
}

export async function getUser(userId: string, lang: TargetLanguage = "en"): Promise<User | null> {
  const snap = await usersRef(lang).doc(userId).get();
  if (!snap.exists) {
    return null;
  }
  return snap.data() as User;
}

export async function createUser(
  userId: string,
  displayName: string,
  lang: TargetLanguage = "en"
): Promise<void> {
  const now = FieldValue.serverTimestamp();
  const user: Record<string, unknown> = {
    lineUserId: userId,
    displayName,
    language: lang,
    plan: "free",
    englishLevel: "unset",
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    totalChats: 0,
    totalVoice: 0,
    dailyTextCount: 0,
    dailyVoiceCount: 0,
    lastCountDate: "",
    pushTime: "08:00",
    recentQuestions: [],
    achievedMilestones: [],
    isActive: true,
    healthScore: 0,
    onboardingStatus: {
      firstText: false,
      levelSet: false,
      pushTimeSet: false,
      firstVoice: false,
      streak3: false,
    },
    levelHistory: [],
    planHistory: [{ plan: "free", changedAt: now }],
    interventions: [],
    createdAt: now,
    updatedAt: now,
  };
  await usersRef(lang).doc(userId).set(user);
}

export async function updateUser(
  userId: string,
  updates: Partial<User>,
  lang: TargetLanguage = "en"
): Promise<void> {
  await usersRef(lang)
    .doc(userId)
    .update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function addChatLog(
  userId: string,
  log: Omit<ChatLog, "createdAt">,
  lang: TargetLanguage = "en"
): Promise<void> {
  await chatLogsRef(userId, lang).add({
    ...log,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getRecentChatLogs(
  userId: string,
  limit: number,
  lang: TargetLanguage = "en"
): Promise<ChatLog[]> {
  const snap = await chatLogsRef(userId, lang)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  const logs = snap.docs.map((doc) => doc.data() as ChatLog);
  return logs.reverse();
}

export async function getWeeklyChatLogs(
  userId: string,
  since: Timestamp,
  lang: TargetLanguage = "en"
): Promise<ChatLog[]> {
  const snap = await chatLogsRef(userId, lang)
    .where("createdAt", ">=", since)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => doc.data() as ChatLog);
}

export async function saveWeeklyReport(
  userId: string,
  weekId: string,
  report: Omit<WeeklyReport, "sentAt">,
  lang: TargetLanguage = "en"
): Promise<void> {
  await weeklyReportsRef(userId, lang).doc(weekId).set({
    ...report,
    sentAt: FieldValue.serverTimestamp(),
  });
}

export async function getActiveUsersByPushTime(
  hour: string,
  lang: TargetLanguage = "en"
): Promise<User[]> {
  const snap = await usersRef(lang)
    .where("isActive", "==", true)
    .where("pushTime", ">=", `${hour}:00`)
    .where("pushTime", "<=", `${hour}:59`)
    .get();
  return snap.docs.map((doc) => doc.data() as User);
}

export async function getAllActiveUsers(lang: TargetLanguage = "en"): Promise<User[]> {
  const snap = await usersRef(lang)
    .where("isActive", "==", true)
    .get();
  return snap.docs.map((doc) => doc.data() as User);
}

// ── Stats ──

function dailyStatsRef(date: string): FirebaseFirestore.DocumentReference {
  return db.collection("stats").doc("daily").collection("dates").doc(date);
}

export async function incrementDailyStat(
  date: string,
  field: string,
  lang: TargetLanguage,
  amount: number = 1
): Promise<void> {
  const ref = dailyStatsRef(date);
  await ref.set(
    { [field]: { [lang]: FieldValue.increment(amount) } },
    { mergeFields: [`${field}.${lang}`] }
  );
}

export async function getDailyStats(date: string): Promise<DailyStats | null> {
  const snap = await dailyStatsRef(date).get();
  if (!snap.exists) return null;
  return snap.data() as DailyStats;
}

export async function getDailyStatsRange(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; stats: DailyStats }>> {
  const snap = await db
    .collection("stats")
    .doc("daily")
    .collection("dates")
    .where("__name__", ">=", startDate)
    .where("__name__", "<=", endDate)
    .orderBy("__name__", "asc")
    .get();
  return snap.docs.map((doc) => ({
    date: doc.id,
    stats: doc.data() as DailyStats,
  }));
}

export async function setDailyStats(
  date: string,
  stats: Partial<DailyStats>
): Promise<void> {
  await dailyStatsRef(date).set(stats, { merge: true });
}

// ── Admin Actions (Audit Log) ──

export async function recordAdminAction(
  action: Omit<AdminAction, "createdAt">
): Promise<void> {
  await db.collection("adminActions").add({
    ...action,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getAdminActions(
  targetUserId?: string,
  limit: number = 50
): Promise<AdminAction[]> {
  let query: FirebaseFirestore.Query = db.collection("adminActions");
  if (targetUserId) {
    query = query.where("targetUserId", "==", targetUserId);
  }
  query = query.orderBy("createdAt", "desc").limit(limit);
  const snap = await query.get();
  return snap.docs.map((doc) => doc.data() as AdminAction);
}

// ── User Queries (Admin) ──

export async function getAllUsers(lang: TargetLanguage = "en"): Promise<User[]> {
  const snap = await usersRef(lang).get();
  return snap.docs.map((doc) => doc.data() as User);
}

export async function getUserChatLogs(
  userId: string,
  lang: TargetLanguage = "en",
  options?: {
    type?: "text" | "voice";
    limit?: number;
    startAfter?: Timestamp;
  }
): Promise<ChatLog[]> {
  let query: FirebaseFirestore.Query = chatLogsRef(userId, lang)
    .orderBy("createdAt", "desc");

  if (options?.type) {
    query = query.where("type", "==", options.type);
  }
  if (options?.startAfter) {
    query = query.startAfter(options.startAfter);
  }
  query = query.limit(options?.limit ?? 50);

  const snap = await query.get();
  return snap.docs.map((doc) => doc.data() as ChatLog);
}

export async function getUserWeeklyReports(
  userId: string,
  lang: TargetLanguage = "en",
  limit: number = 20
): Promise<WeeklyReport[]> {
  const snap = await weeklyReportsRef(userId, lang)
    .orderBy("sentAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => doc.data() as WeeklyReport);
}
