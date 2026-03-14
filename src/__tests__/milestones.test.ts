import { checkMilestones, MilestoneContext } from "../utils/milestones";
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

describe("checkMilestones", () => {
  it("should detect first_chat milestone", () => {
    const user = makeUser();
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 1,
      newTotalChats: 1,
      newTotalVoice: 0,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("first_chat");
    expect(result.messages.length).toBeGreaterThan(0);
  });

  it("should not re-trigger already achieved milestones", () => {
    const user = makeUser({ achievedMilestones: ["first_chat"] });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 1,
      newTotalChats: 1,
      newTotalVoice: 0,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).not.toContain("first_chat");
  });

  it("should detect streak_3 milestone", () => {
    const user = makeUser({ achievedMilestones: ["first_chat"] });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 3,
      newTotalChats: 10,
      newTotalVoice: 0,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("streak_3");
  });

  it("should detect streak_7 milestone", () => {
    const user = makeUser({ achievedMilestones: ["first_chat", "streak_3"] });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 7,
      newTotalChats: 20,
      newTotalVoice: 0,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("streak_7");
  });

  it("should detect streak_30 milestone", () => {
    const user = makeUser({ achievedMilestones: ["first_chat", "streak_3", "streak_7"] });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 30,
      newTotalChats: 50,
      newTotalVoice: 0,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("streak_30");
  });

  it("should detect total_100 milestone", () => {
    const user = makeUser({
      achievedMilestones: ["first_chat", "streak_3", "streak_7"],
    });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 5,
      newTotalChats: 90,
      newTotalVoice: 10,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("total_100");
  });

  it("should detect first_voice milestone", () => {
    const user = makeUser({ achievedMilestones: ["first_chat"] });
    const ctx: MilestoneContext = {
      chatType: "voice",
      newStreak: 2,
      newTotalChats: 5,
      newTotalVoice: 1,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("first_voice");
  });

  it("should not trigger first_voice on text chat", () => {
    const user = makeUser();
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 1,
      newTotalChats: 1,
      newTotalVoice: 0,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).not.toContain("first_voice");
  });

  it("should detect streak_14 milestone", () => {
    const user = makeUser({ achievedMilestones: ["first_chat", "streak_3", "streak_7"] });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 14,
      newTotalChats: 30,
      newTotalVoice: 0,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("streak_14");
  });

  it("should detect total_10 milestone", () => {
    const user = makeUser({ achievedMilestones: ["first_chat"] });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 3,
      newTotalChats: 8,
      newTotalVoice: 2,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("total_10");
  });

  it("should detect total_30 milestone", () => {
    const user = makeUser({ achievedMilestones: ["first_chat", "total_10"] });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 5,
      newTotalChats: 25,
      newTotalVoice: 5,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("total_30");
  });

  it("should detect total_50 milestone", () => {
    const user = makeUser({ achievedMilestones: ["first_chat", "total_10", "total_30"] });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 10,
      newTotalChats: 40,
      newTotalVoice: 10,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("total_50");
  });

  it("should return empty when no new milestones", () => {
    const user = makeUser({
      achievedMilestones: [
        "first_chat", "streak_3", "streak_7", "streak_14", "streak_30",
        "total_10", "total_30", "total_50", "total_100", "first_voice",
      ],
    });
    const ctx: MilestoneContext = {
      chatType: "text",
      newStreak: 50,
      newTotalChats: 200,
      newTotalVoice: 50,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toHaveLength(0);
    expect(result.messages).toHaveLength(0);
  });

  it("should detect multiple milestones at once", () => {
    const user = makeUser();
    const ctx: MilestoneContext = {
      chatType: "voice",
      newStreak: 1,
      newTotalChats: 0,
      newTotalVoice: 1,
    };
    const result = checkMilestones(user, ctx);
    expect(result.ids).toContain("first_chat");
    expect(result.ids).toContain("first_voice");
  });
});
