import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { User, ChatLog, WeeklyReport } from "../types";
import { TargetLanguage, getLangStrings } from "../config/languages";

let db: FirebaseFirestore.Firestore;

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
