// Re-export shared types for admin dashboard
export type UserPlan = "free" | "bot_pro";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "unset";
export type TargetLanguage = "en" | "es";

export interface OnboardingStatus {
  firstText: boolean;
  levelSet: boolean;
  pushTimeSet: boolean;
  firstVoice: boolean;
  streak3: boolean;
}

export interface LevelHistoryEntry {
  level: string;
  changedAt: { _seconds: number; _nanoseconds: number };
}

export interface PlanHistoryEntry {
  plan: string;
  changedAt: { _seconds: number; _nanoseconds: number };
}

export interface InterventionEntry {
  type: "auto_nudge" | "admin_message" | "survey";
  content: string;
  sentAt: { _seconds: number; _nanoseconds: number };
  adminUserId?: string;
}

export interface User {
  lineUserId: string;
  displayName: string;
  language: TargetLanguage;
  plan: UserPlan;
  englishLevel: SkillLevel;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalChats: number;
  totalVoice: number;
  dailyTextCount: number;
  dailyVoiceCount: number;
  lastCountDate: string;
  pushTime: string;
  recentQuestions: string[];
  achievedMilestones: string[];
  isActive: boolean;
  healthScore: number;
  onboardingStatus: OnboardingStatus;
  levelHistory: LevelHistoryEntry[];
  planHistory: PlanHistoryEntry[];
  interventions: InterventionEntry[];
  createdAt: { _seconds: number; _nanoseconds: number };
  updatedAt: { _seconds: number; _nanoseconds: number };
}

export interface ChatLog {
  type: "text" | "voice";
  userMessage: string;
  aiResponse: string;
  tokenUsage: { promptTokens: number; completionTokens: number };
  createdAt: { _seconds: number; _nanoseconds: number };
}

export interface WeeklyReport {
  weekStart: string;
  textCount: number;
  voiceCount: number;
  activeDays: number;
  reportText: string;
  sentAt: { _seconds: number; _nanoseconds: number };
}

export interface LangSplit {
  en: number;
  es: number;
}

export interface DailyStats {
  totalUsers?: LangSplit;
  activeUsers?: LangSplit;
  freeUsers?: LangSplit;
  proUsers?: LangSplit;
  newFollows?: LangSplit;
  unfollows?: LangSplit;
  textChats?: LangSplit;
  voiceChats?: LangSplit;
  promptTokens?: LangSplit;
  completionTokens?: LangSplit;
  dau?: LangSplit;
  avgStreak?: LangSplit;
  avgHealthScore?: LangSplit;
  churnRiskCount?: LangSplit;
  firstChatUsers?: LangSplit;
  rateLimitHits?: LangSplit;
  proConversions?: LangSplit;
  generatedAt?: { _seconds: number; _nanoseconds: number };
}

export interface AdminAction {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  details: Record<string, unknown>;
  createdAt: { _seconds: number; _nanoseconds: number };
}

export interface Question {
  id: string;
  category: string;
  level: SkillLevel;
  question: string;
  language: TargetLanguage;
  isActive: boolean;
}
