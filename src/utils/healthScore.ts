import { User, ChatLog } from "../types";

const LEVEL_POINTS: Record<string, number> = {
  unset: 0,
  beginner: 7,
  intermediate: 14,
  advanced: 20,
};

/**
 * Calculate health score (0-100) for a user.
 *
 * Components:
 * - Streak (30 pts): min(currentStreak / 7, 1) * 30
 * - Weekly frequency (30 pts): min(activeDays / 5, 1) * 30
 * - Voice usage (20 pts): any voice in last 7 days → 20
 * - Level progress (20 pts): unset=0, beginner=7, intermediate=14, advanced=20
 */
export function calculateHealthScore(
  user: User,
  recentChatLogs: ChatLog[]
): number {
  // Streak component
  const streakScore = Math.min(user.currentStreak / 7, 1) * 30;

  // Weekly frequency: count unique active days from chat logs
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

  // Voice usage
  const voiceScore = hasVoice ? 20 : 0;

  // Level progress
  const levelScore = LEVEL_POINTS[user.englishLevel] ?? 0;

  return Math.round(streakScore + frequencyScore + voiceScore + levelScore);
}
