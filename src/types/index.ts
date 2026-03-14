import { Timestamp } from "firebase-admin/firestore";

export type UserPlan = "free" | "bot_pro";

export interface User {
  lineUserId: string;
  displayName: string;
  plan: UserPlan;
  englishLevel: "beginner" | "intermediate" | "advanced" | "unset";
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // "YYYY-MM-DD" JST
  totalChats: number;
  totalVoice: number;
  dailyTextCount: number;
  dailyVoiceCount: number;
  lastCountDate: string; // "YYYY-MM-DD" JST
  pushTime: string; // "HH:mm"
  recentQuestions: string[]; // 最大7件
  achievedMilestones: string[]; // 達成済みマイルストーンID
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatLog {
  type: "text" | "voice";
  userMessage: string;
  aiResponse: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
  };
  createdAt: Timestamp;
}

export interface WeeklyReport {
  weekStart: string;
  textCount: number;
  voiceCount: number;
  activeDays: number;
  reportText: string;
  sentAt: Timestamp;
}
