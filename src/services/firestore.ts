import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { User, ChatLog, WeeklyReport } from "../types";

let db: FirebaseFirestore.Firestore;

export function initializeFirestore(): void {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  db = admin.firestore();
}

function usersRef(): FirebaseFirestore.CollectionReference {
  return db.collection("users");
}

function chatLogsRef(userId: string): FirebaseFirestore.CollectionReference {
  return db.collection("users").doc(userId).collection("chatLogs");
}

function weeklyReportsRef(userId: string): FirebaseFirestore.CollectionReference {
  return db.collection("users").doc(userId).collection("weeklyReports");
}

export async function getUser(userId: string): Promise<User | null> {
  const snap = await usersRef().doc(userId).get();
  if (!snap.exists) {
    return null;
  }
  return snap.data() as User;
}

export async function createUser(
  userId: string,
  displayName: string
): Promise<void> {
  const now = FieldValue.serverTimestamp();
  const user: Record<string, unknown> = {
    lineUserId: userId,
    displayName,
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
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await usersRef().doc(userId).set(user);
}

export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  await usersRef()
    .doc(userId)
    .update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function addChatLog(
  userId: string,
  log: Omit<ChatLog, "createdAt">
): Promise<void> {
  await chatLogsRef(userId).add({
    ...log,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getRecentChatLogs(
  userId: string,
  limit: number
): Promise<ChatLog[]> {
  const snap = await chatLogsRef(userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  const logs = snap.docs.map((doc) => doc.data() as ChatLog);
  return logs.reverse();
}

export async function getWeeklyChatLogs(
  userId: string,
  since: Timestamp
): Promise<ChatLog[]> {
  const snap = await chatLogsRef(userId)
    .where("createdAt", ">=", since)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => doc.data() as ChatLog);
}

export async function saveWeeklyReport(
  userId: string,
  weekId: string,
  report: Omit<WeeklyReport, "sentAt">
): Promise<void> {
  await weeklyReportsRef(userId).doc(weekId).set({
    ...report,
    sentAt: FieldValue.serverTimestamp(),
  });
}

export async function getActiveUsersByPushTime(
  hour: string
): Promise<User[]> {
  const snap = await usersRef()
    .where("isActive", "==", true)
    .where("pushTime", ">=", `${hour}:00`)
    .where("pushTime", "<=", `${hour}:59`)
    .get();
  return snap.docs.map((doc) => doc.data() as User);
}

export async function getAllActiveUsers(): Promise<User[]> {
  const snap = await usersRef()
    .where("isActive", "==", true)
    .get();
  return snap.docs.map((doc) => doc.data() as User);
}
