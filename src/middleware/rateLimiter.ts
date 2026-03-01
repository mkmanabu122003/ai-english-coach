import { User } from "../types";
import { RATE_LIMITS } from "../config/constants";

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
  remaining?: number;
  resetNeeded?: boolean;
}

export function checkRateLimit(
  user: User,
  type: "text" | "voice",
  todayJST: string
): RateLimitResult {
  const isNewDay = user.lastCountDate !== todayJST;

  // Day has changed — counters should be reset by the caller
  const textCount = isNewDay ? 0 : user.dailyTextCount;
  const voiceCount = isNewDay ? 0 : user.dailyVoiceCount;

  if (type === "text") {
    if (textCount >= RATE_LIMITS.DAILY_TEXT_MAX) {
      const voiceRemaining = RATE_LIMITS.DAILY_VOICE_MAX - voiceCount;
      return {
        allowed: false,
        message:
          `本日のテキスト上限（${RATE_LIMITS.DAILY_TEXT_MAX}回）に達しました。` +
          (voiceRemaining > 0
            ? `\nボイスチャットはあと${voiceRemaining}回使えます🎤`
            : "\nボイスチャットも上限に達しています。また明日お話ししましょう！"),
        resetNeeded: isNewDay,
      };
    }
    return {
      allowed: true,
      remaining: RATE_LIMITS.DAILY_TEXT_MAX - textCount - 1,
      resetNeeded: isNewDay,
    };
  }

  // type === "voice"
  if (voiceCount >= RATE_LIMITS.DAILY_VOICE_MAX) {
    const textRemaining = RATE_LIMITS.DAILY_TEXT_MAX - textCount;
    return {
      allowed: false,
      message:
        `本日のボイス上限（${RATE_LIMITS.DAILY_VOICE_MAX}回）に達しました。` +
        (textRemaining > 0
          ? `\nテキストチャットはあと${textRemaining}回使えます💬`
          : "\nテキストチャットも上限に達しています。また明日お話ししましょう！"),
      resetNeeded: isNewDay,
    };
  }
  return {
    allowed: true,
    remaining: RATE_LIMITS.DAILY_VOICE_MAX - voiceCount - 1,
    resetNeeded: isNewDay,
  };
}
