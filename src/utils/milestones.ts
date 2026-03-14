import { User } from "../types";

interface MilestoneDefinition {
  id: string;
  check: (user: User, context: MilestoneContext) => boolean;
  message: string;
}

export interface MilestoneContext {
  /** The chat type that just completed */
  chatType: "text" | "voice";
  /** Updated streak (after this interaction) */
  newStreak: number;
  /** Updated totalChats (after this interaction) */
  newTotalChats: number;
  /** Updated totalVoice (after this interaction) */
  newTotalVoice: number;
}

const MILESTONES: MilestoneDefinition[] = [
  {
    id: "first_chat",
    check: (_user, ctx) => ctx.newTotalChats + ctx.newTotalVoice === 1,
    message: "🎉 最初の一歩を踏み出しました！毎日少しずつ続けていきましょう！",
  },
  {
    id: "streak_3",
    check: (_user, ctx) => ctx.newStreak === 3,
    message: "🔥 3日連続達成！いい調子です！",
  },
  {
    id: "streak_7",
    check: (_user, ctx) => ctx.newStreak === 7,
    message: "⭐ 1週間連続達成！習慣化の第一歩です！",
  },
  {
    id: "streak_30",
    check: (_user, ctx) => ctx.newStreak === 30,
    message: "🏆 30日連続達成！素晴らしい継続力です！",
  },
  {
    id: "total_100",
    check: (_user, ctx) => ctx.newTotalChats + ctx.newTotalVoice === 100,
    message: "💯 チャット100回突破！確実に力がついています！",
  },
  {
    id: "first_voice",
    check: (_user, ctx) =>
      ctx.chatType === "voice" && ctx.newTotalVoice === 1,
    message: "🎤 初めての音声練習クリア！話す力が伸びます！",
  },
];

/**
 * Check for newly achieved milestones and return their messages.
 * Does not modify user — caller is responsible for updating achievedMilestones.
 */
export function checkMilestones(
  user: User,
  context: MilestoneContext
): { ids: string[]; messages: string[] } {
  const achieved = user.achievedMilestones ?? [];
  const newIds: string[] = [];
  const newMessages: string[] = [];

  for (const m of MILESTONES) {
    if (achieved.includes(m.id)) {
      continue;
    }
    if (m.check(user, context)) {
      newIds.push(m.id);
      newMessages.push(m.message);
    }
  }

  return { ids: newIds, messages: newMessages };
}
