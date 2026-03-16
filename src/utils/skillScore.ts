/**
 * Skill Score calculation — estimates user's current ability
 * across 4 dimensions based on existing learning data.
 *
 * Inspired by Santa/Riiid's real-time score prediction.
 */

import { Timestamp } from "firebase-admin/firestore";
import { User, ChatLog, SkillScores } from "../types";

// ── CEFR Label Mapping ──

function getCefrLabel(score: number): string {
  if (score >= 80) return "C1";
  if (score >= 60) return "B2";
  if (score >= 40) return "B1";
  if (score >= 20) return "A2";
  return "A1";
}

// ── Dimension Calculators ──

const LEVEL_BASE: Record<string, number> = {
  unset: 20,
  beginner: 25,
  intermediate: 50,
  advanced: 75,
};

/**
 * 📖 語彙・表現 (Vocabulary & Expression)
 * Base: level-dependent (25-75)
 * Bonus: logarithmic growth from total interactions (up to +25)
 */
function calcVocabulary(user: User): number {
  const base = LEVEL_BASE[user.englishLevel] ?? 20;
  const totalInteractions = user.totalChats + user.totalVoice;
  // Logarithmic curve: grows fast at first, plateaus around 200 interactions
  const interactionBonus = Math.min(Math.log10(totalInteractions + 1) / Math.log10(201), 1) * 25;
  return Math.min(Math.round(base + interactionBonus), 100);
}

/**
 * ✏️ 文法正確性 (Grammar Accuracy)
 * Based on correction rate in recent chat logs.
 * Lower correction rate = higher score.
 */
function calcGrammar(user: User, recentLogs: ChatLog[]): number {
  if (recentLogs.length === 0) {
    return LEVEL_BASE[user.englishLevel] ?? 20;
  }

  // Count chats with corrections (📝 marker in AI response)
  let correctedCount = 0;
  for (const log of recentLogs) {
    if (log.aiResponse.includes("📝")) {
      correctedCount++;
    }
  }

  // Accuracy rate: 1.0 = no corrections, 0.0 = all corrected
  const accuracyRate = 1 - correctedCount / recentLogs.length;

  // Scale: level base provides floor, accuracy lifts toward ceiling
  const levelFloor = Math.max((LEVEL_BASE[user.englishLevel] ?? 20) - 10, 10);
  const ceiling = 100;
  return Math.round(levelFloor + accuracyRate * (ceiling - levelFloor));
}

/**
 * 🔥 学習継続力 (Consistency)
 * Based on current streak and weekly frequency.
 */
function calcConsistency(user: User, recentLogs: ChatLog[]): number {
  // Streak component (0-50): caps at 14-day streak
  const streakScore = Math.min(user.currentStreak / 14, 1) * 50;

  // Weekly frequency component (0-50): count unique active days in recent logs
  const activeDates = new Set<string>();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const log of recentLogs) {
    if (log.createdAt && log.createdAt.toMillis() >= sevenDaysAgo) {
      const dateStr = log.createdAt.toDate().toISOString().slice(0, 10);
      activeDates.add(dateStr);
    }
  }
  const frequencyScore = Math.min(activeDates.size / 5, 1) * 50;

  return Math.round(streakScore + frequencyScore);
}

/**
 * 🎤 実践力 (Practical Skills)
 * Based on voice usage ratio and level.
 */
function calcPractical(user: User): number {
  const totalInteractions = user.totalChats + user.totalVoice;
  if (totalInteractions === 0) {
    return 10;
  }

  // Voice ratio component (0-40): ideal ratio ~30%+
  const voiceRatio = user.totalVoice / totalInteractions;
  const voiceScore = Math.min(voiceRatio / 0.3, 1) * 40;

  // Level component (0-60)
  const levelScore = (LEVEL_BASE[user.englishLevel] ?? 20) * 0.8;

  return Math.min(Math.round(voiceScore + levelScore), 100);
}

// ── Main Calculator ──

const MIN_CHATS_FOR_SCORE = 5;

/**
 * Calculate skill scores for a user.
 * Returns null if user has insufficient data (< 5 chats).
 */
export function calculateSkillScores(
  user: User,
  recentChatLogs: ChatLog[]
): SkillScores | null {
  const totalInteractions = user.totalChats + user.totalVoice;
  if (totalInteractions < MIN_CHATS_FOR_SCORE) {
    return null;
  }

  const vocabulary = calcVocabulary(user);
  const grammar = calcGrammar(user, recentChatLogs);
  const consistency = calcConsistency(user, recentChatLogs);
  const practical = calcPractical(user);

  // Weighted average: vocabulary 30%, grammar 30%, consistency 20%, practical 20%
  const overall = Math.round(
    vocabulary * 0.3 + grammar * 0.3 + consistency * 0.2 + practical * 0.2
  );

  return {
    vocabulary,
    grammar,
    consistency,
    practical,
    overall,
    cefrLabel: getCefrLabel(overall),
    calculatedAt: Timestamp.now(),
  };
}

/**
 * Format score delta string for display.
 * e.g. "↑+5", "↓-3", "→±0"
 */
export function formatScoreDelta(current: number, previous: number): string {
  const delta = current - previous;
  if (delta > 0) return `↑+${delta}`;
  if (delta < 0) return `↓${delta}`;
  return "→±0";
}
