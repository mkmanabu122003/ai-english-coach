import { User } from "../types";
import { RATE_LIMITS, FREE_PLAN_LIMITS } from "../config/constants";
import { TargetLanguage, getLangStrings } from "../config/languages";

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
  todayJST: string,
  lang: TargetLanguage = "en",
  tryAgainExempt: boolean = false
): RateLimitResult {
  const isNewDay = user.lastCountDate !== todayJST;
  const limits = getLimits(user);
  const strings = getLangStrings(lang);

  // Day has changed — counters should be reset by the caller
  const textCount = isNewDay ? 0 : user.dailyTextCount;
  const voiceCount = isNewDay ? 0 : user.dailyVoiceCount;

  if (type === "text") {
    // 施策6: Try again免除 — Freeプランで直前のAIがTry againを含み60秒以内なら通す
    if (tryAgainExempt && textCount >= limits.textMax) {
      return {
        allowed: true,
        remaining: 0,
        resetNeeded: isNewDay,
      };
    }
    if (textCount >= limits.textMax) {
      if (user.plan === "free") {
        return {
          allowed: false,
          message: strings.rateLimitFreeText(limits.textMax),
          resetNeeded: isNewDay,
        };
      }
      const voiceRemaining = limits.voiceMax - voiceCount;
      return {
        allowed: false,
        message: strings.rateLimitProText(limits.textMax, voiceRemaining),
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
      message: strings.rateLimitFreeVoice,
      resetNeeded: isNewDay,
    };
  }

  if (voiceCount >= limits.voiceMax) {
    const textRemaining = limits.textMax - textCount;
    return {
      allowed: false,
      message: strings.rateLimitProVoice(limits.voiceMax, textRemaining),
      resetNeeded: isNewDay,
    };
  }
  return {
    allowed: true,
    remaining: limits.voiceMax - voiceCount - 1,
    resetNeeded: isNewDay,
  };
}
