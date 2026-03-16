import { Timestamp } from "firebase-admin/firestore";
import { TargetLanguage } from "../config/languages";

export type UserPlan = "free" | "bot_pro";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "unset";

// ── Onboarding & History ──

export interface OnboardingStatus {
  firstText: boolean;
  levelSet: boolean;
  pushTimeSet: boolean;
  firstVoice: boolean;
  streak3: boolean;
}

export interface LevelHistoryEntry {
  level: string;
  changedAt: Timestamp;
}

export interface PlanHistoryEntry {
  plan: string;
  changedAt: Timestamp;
}

export interface InterventionEntry {
  type: "auto_nudge" | "admin_message" | "survey";
  content: string;
  sentAt: Timestamp;
  adminUserId?: string;
}

export interface LastPushQuestion {
  questionText: string;
  sentAt: Timestamp;
  answered: boolean;
}

// ── Skill Scores ──

export interface SkillScores {
  vocabulary: number; // 0-100
  grammar: number; // 0-100
  consistency: number; // 0-100
  practical: number; // 0-100
  overall: number; // 0-100 (weighted average)
  cefrLabel: string; // "A1" | "A2" | "B1" | "B2" | "C1"
  calculatedAt: Timestamp;
}

// ── User ──

export interface User {
  lineUserId: string;
  displayName: string;
  language: TargetLanguage;
  plan: UserPlan;
  englishLevel: SkillLevel;
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
  healthScore: number; // 0-100, 日次バッチで算出
  onboardingStatus: OnboardingStatus;
  levelHistory: LevelHistoryEntry[];
  planHistory: PlanHistoryEntry[];
  interventions: InterventionEntry[];
  lastPushQuestion?: LastPushQuestion;
  skillScores?: SkillScores;
  previousSkillScores?: SkillScores;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ── Chat & Reports ──

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

// ── Stats ──

export interface LangSplit {
  en: number;
  es: number;
}

export interface DailyStats {
  totalUsers: LangSplit;
  activeUsers: LangSplit;
  freeUsers: LangSplit;
  proUsers: LangSplit;
  newFollows: LangSplit;
  unfollows: LangSplit;
  textChats: LangSplit;
  voiceChats: LangSplit;
  promptTokens: LangSplit;
  completionTokens: LangSplit;
  dau: LangSplit;
  avgStreak: LangSplit;
  avgHealthScore: LangSplit;
  churnRiskCount: LangSplit;
  firstChatUsers: LangSplit;
  rateLimitHits: LangSplit;
  proConversions: LangSplit;
  generatedAt: Timestamp;
}

export interface WeeklyStats {
  wau: LangSplit;
  newFollows: LangSplit;
  unfollows: LangSplit;
  proConversions: LangSplit;
  proCancellations: LangSplit;
  avgSessionChats: LangSplit;
  voiceAdoptionRate: LangSplit;
  generatedAt: Timestamp;
}

// ── Admin ──

export interface AdminAction {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  details: Record<string, unknown>;
  createdAt: Timestamp;
}

// ── Content (P1) ──

export interface Question {
  id: string;
  category: string;
  level: SkillLevel;
  question: string;
  language: TargetLanguage;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NudgeMessage {
  id: string;
  type: "gentle_nudge" | "strong_nudge" | "streak_boost" | "comeback";
  language: TargetLanguage;
  text: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
