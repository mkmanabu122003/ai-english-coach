import { User } from "../types";
import { RATE_LIMITS, FREE_PLAN_LIMITS } from "../config/constants";

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
  remaining?: number;
  resetNeeded?: boolean;
}

function getLimits(user: User): { textMax: number; voiceMax: number } {
  if (user.plan === "free") {
    return {
      textMax: FREE_PLAN_LIMITS.DAILY_TEXT_MAX,
      voiceMax: FREE_PLAN_LIMITS.DAILY_VOICE_MAX,
    };
  }
  return {
    textMax: RATE_LIMITS.DAILY_TEXT_MAX,
    voiceMax: RATE_LIMITS.DAILY_VOICE_MAX,
  };
}

export function checkRateLimit(
  user: User,
  type: "text" | "voice",
  todayJST: string
): RateLimitResult {
  const isNewDay = user.lastCountDate !== todayJST;
  const limits = getLimits(user);

  // Day has changed — counters should be reset by the caller
  const textCount = isNewDay ? 0 : user.dailyTextCount;
  const voiceCount = isNewDay ? 0 : user.dailyVoiceCount;

  if (type === "text") {
    if (textCount >= limits.textMax) {
      if (user.plan === "free") {
        return {
          allowed: false,
          message:
            `本日の無料プランのテキスト上限（${limits.textMax}回）に達しました。\n` +
            "Bot Proプランにアップグレードすると、1日20回まで利用できます。",
          resetNeeded: isNewDay,
        };
      }
      const voiceRemaining = limits.voiceMax - voiceCount;
      return {
        allowed: false,
        message:
          `本日のテキスト上限（${limits.textMax}回）に達しました。` +
          (voiceRemaining > 0
            ? `\nボイスチャットはあと${voiceRemaining}回使えます🎤`
            : "\nボイスチャットも上限に達しています。また明日お話ししましょう！"),
        resetNeeded: isNewDay,
      };
    }
    return {
      allowed: true,
      remaining: limits.textMax - textCount - 1,
      resetNeeded: isNewDay,
    };
  }

  // type === "voice"
  if (user.plan === "free") {
    return {
      allowed: false,
      message:
        "音声練習はBot Proプランで利用できます。\n" +
        "テキストで英文を送ると添削します📝",
      resetNeeded: isNewDay,
    };
  }

  if (voiceCount >= limits.voiceMax) {
    const textRemaining = limits.textMax - textCount;
    return {
      allowed: false,
      message:
        `本日のボイス上限（${limits.voiceMax}回）に達しました。` +
        (textRemaining > 0
          ? `\nテキストチャットはあと${textRemaining}回使えます💬`
          : "\nテキストチャットも上限に達しています。また明日お話ししましょう！"),
      resetNeeded: isNewDay,
    };
  }
  return {
    allowed: true,
    remaining: limits.voiceMax - voiceCount - 1,
    resetNeeded: isNewDay,
  };
}
