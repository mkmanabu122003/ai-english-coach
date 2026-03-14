import { User } from "../types";
import { TargetLanguage, getLangStrings } from "../config/languages";

interface MilestoneDefinition {
  id: string;
  check: (user: User, context: MilestoneContext) => boolean;
  messageKey: keyof ReturnType<typeof getLangStrings>["milestones"];
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
    messageKey: "firstChat",
  },
  {
    id: "streak_3",
    check: (_user, ctx) => ctx.newStreak === 3,
    messageKey: "streak3",
  },
  {
    id: "streak_7",
    check: (_user, ctx) => ctx.newStreak === 7,
    messageKey: "streak7",
  },
  {
    id: "streak_30",
    check: (_user, ctx) => ctx.newStreak === 30,
    messageKey: "streak30",
  },
  {
    id: "total_100",
    check: (_user, ctx) => ctx.newTotalChats + ctx.newTotalVoice === 100,
    messageKey: "total100",
  },
  {
    id: "first_voice",
    check: (_user, ctx) =>
      ctx.chatType === "voice" && ctx.newTotalVoice === 1,
    messageKey: "firstVoice",
  },
];

/**
 * Check for newly achieved milestones and return their messages.
 * Does not modify user — caller is responsible for updating achievedMilestones.
 */
export function checkMilestones(
  user: User,
  context: MilestoneContext,
  lang: TargetLanguage = "en"
): { ids: string[]; messages: string[] } {
  const achieved = user.achievedMilestones ?? [];
  const strings = getLangStrings(lang);
  const newIds: string[] = [];
  const newMessages: string[] = [];

  for (const m of MILESTONES) {
    if (achieved.includes(m.id)) {
      continue;
    }
    if (m.check(user, context)) {
      newIds.push(m.id);
      newMessages.push(strings.milestones[m.messageKey]);
    }
  }

  return { ids: newIds, messages: newMessages };
}
