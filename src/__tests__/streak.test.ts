import { updateStreak } from "../utils/streak";
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
    lastCountDate: "",
    pushTime: "08:00",
    recentQuestions: [],
    achievedMilestones: [],
    isActive: true,
    healthScore: 0,
    onboardingStatus: { firstText: false, levelSet: false, pushTimeSet: false, firstVoice: false, streak3: false },
    levelHistory: [],
    planHistory: [],
    interventions: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

describe("updateStreak", () => {
  it("should start streak at 1 for first activity", () => {
    const user = makeUser();
    const result = updateStreak(user, "2026-03-14");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastActiveDate).toBe("2026-03-14");
  });

  it("should increment streak for consecutive days", () => {
    const user = makeUser({
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: "2026-03-13",
    });
    const result = updateStreak(user, "2026-03-14");
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(5); // stays at 5
  });

  it("should update longestStreak when current exceeds it", () => {
    const user = makeUser({
      currentStreak: 5,
      longestStreak: 5,
      lastActiveDate: "2026-03-13",
    });
    const result = updateStreak(user, "2026-03-14");
    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(6);
  });

  it("should reset streak if more than 1 day gap", () => {
    const user = makeUser({
      currentStreak: 10,
      longestStreak: 10,
      lastActiveDate: "2026-03-12",
    });
    const result = updateStreak(user, "2026-03-14");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10); // preserves longest
  });

  it("should not change streak for same day activity", () => {
    const user = makeUser({
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: "2026-03-14",
    });
    const result = updateStreak(user, "2026-03-14");
    expect(result.currentStreak).toBeUndefined();
    expect(result.lastActiveDate).toBe("2026-03-14");
  });
});
