import { checkRateLimit } from "../middleware/rateLimiter";
import { User } from "../types";
import { Timestamp } from "firebase-admin/firestore";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    lineUserId: "U001",
    displayName: "Test User",
    language: "en",
    plan: "bot_pro",
    englishLevel: "intermediate",
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    totalChats: 0,
    totalVoice: 0,
    dailyTextCount: 0,
    dailyVoiceCount: 0,
    lastCountDate: "2026-03-14",
    pushTime: "08:00",
    recentQuestions: [],
    achievedMilestones: [],
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

describe("checkRateLimit", () => {
  const today = "2026-03-14";

  describe("Bot Pro plan", () => {
    it("should allow text when under limit", () => {
      const user = makeUser({ dailyTextCount: 5, lastCountDate: today });
      const result = checkRateLimit(user, "text", today);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(14); // 20 - 5 - 1
    });

    it("should block text when at limit", () => {
      const user = makeUser({ dailyTextCount: 20, lastCountDate: today });
      const result = checkRateLimit(user, "text", today);
      expect(result.allowed).toBe(false);
      expect(result.message).toBeDefined();
    });

    it("should allow voice when under limit", () => {
      const user = makeUser({ dailyVoiceCount: 2, lastCountDate: today });
      const result = checkRateLimit(user, "voice", today);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5 - 2 - 1
    });

    it("should block voice when at limit", () => {
      const user = makeUser({ dailyVoiceCount: 5, lastCountDate: today });
      const result = checkRateLimit(user, "voice", today);
      expect(result.allowed).toBe(false);
    });

    it("should reset counters on new day", () => {
      const user = makeUser({
        dailyTextCount: 20,
        lastCountDate: "2026-03-13",
      });
      const result = checkRateLimit(user, "text", today);
      expect(result.allowed).toBe(true);
      expect(result.resetNeeded).toBe(true);
    });

    it("should mention voice remaining when text blocked", () => {
      const user = makeUser({
        dailyTextCount: 20,
        dailyVoiceCount: 2,
        lastCountDate: today,
      });
      const result = checkRateLimit(user, "text", today);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain("ボイスチャット");
    });
  });

  describe("Free plan", () => {
    it("should allow text when under free limit (3)", () => {
      const user = makeUser({ plan: "free", dailyTextCount: 1, lastCountDate: today });
      const result = checkRateLimit(user, "text", today);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1); // 3 - 1 - 1
    });

    it("should block text at free limit", () => {
      const user = makeUser({ plan: "free", dailyTextCount: 3, lastCountDate: today });
      const result = checkRateLimit(user, "text", today);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain("無料プラン");
      expect(result.message).toContain("Bot Pro");
    });

    it("should block voice for free plan", () => {
      const user = makeUser({ plan: "free", dailyVoiceCount: 0, lastCountDate: today });
      const result = checkRateLimit(user, "voice", today);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain("Bot Proプラン");
    });
  });
});
