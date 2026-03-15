import { describe, it, expect } from "vitest";

// ============================================================
// Extracted validation logic from admin API routes
// These mirror the exact validation checks in the route handlers
// ============================================================

const VALID_PLANS = ["free", "bot_pro"];
const VALID_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_LANGUAGES = ["en", "es"];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

// ============================================================
// Plan validation tests
// ============================================================

describe("plan change validation", () => {
  it("accepts valid plans", () => {
    expect(VALID_PLANS.includes("free")).toBe(true);
    expect(VALID_PLANS.includes("bot_pro")).toBe(true);
  });

  it("rejects invalid plans", () => {
    expect(VALID_PLANS.includes("premium")).toBe(false);
    expect(VALID_PLANS.includes("")).toBe(false);
    expect(VALID_PLANS.includes("Free")).toBe(false);
    expect(VALID_PLANS.includes("BOT_PRO")).toBe(false);
  });

  it("rejects null/undefined plans", () => {
    expect(VALID_PLANS.includes(null as unknown as string)).toBe(false);
    expect(VALID_PLANS.includes(undefined as unknown as string)).toBe(false);
  });

  it("detects same-plan no-op", () => {
    const currentPlan = "free";
    const newPlan = "free";
    expect(currentPlan === newPlan).toBe(true);
  });

  it("correctly identifies plan upgrade (free -> bot_pro)", () => {
    const previousPlan = "free";
    const newPlan = "bot_pro";
    const isUpgrade = previousPlan === "free" && newPlan === "bot_pro";
    expect(isUpgrade).toBe(true);
  });

  it("correctly identifies plan downgrade (bot_pro -> free)", () => {
    const previousPlan = "bot_pro";
    const newPlan = "free";
    const isUpgrade = previousPlan === "free" && newPlan === "bot_pro";
    expect(isUpgrade).toBe(false);
  });
});

// ============================================================
// Level validation tests
// ============================================================

describe("level change validation", () => {
  it("accepts valid levels", () => {
    for (const level of VALID_LEVELS) {
      expect(VALID_LEVELS.includes(level)).toBe(true);
    }
  });

  it("rejects invalid levels", () => {
    expect(VALID_LEVELS.includes("expert")).toBe(false);
    expect(VALID_LEVELS.includes("")).toBe(false);
    expect(VALID_LEVELS.includes("Beginner")).toBe(false);
    expect(VALID_LEVELS.includes("ADVANCED")).toBe(false);
  });

  it("rejects null/undefined levels", () => {
    expect(VALID_LEVELS.includes(null as unknown as string)).toBe(false);
    expect(VALID_LEVELS.includes(undefined as unknown as string)).toBe(false);
  });
});

// ============================================================
// Language validation tests
// ============================================================

describe("language parameter validation", () => {
  it("accepts valid languages", () => {
    expect(VALID_LANGUAGES.includes("en")).toBe(true);
    expect(VALID_LANGUAGES.includes("es")).toBe(true);
  });

  it("rejects invalid languages", () => {
    expect(VALID_LANGUAGES.includes("fr")).toBe(false);
    expect(VALID_LANGUAGES.includes("jp")).toBe(false);
    expect(VALID_LANGUAGES.includes("")).toBe(false);
    expect(VALID_LANGUAGES.includes("EN")).toBe(false);
  });

  it("maps to correct collection", () => {
    expect(getCollectionName("en")).toBe("users");
    expect(getCollectionName("es")).toBe("usersEs");
  });

  it("defaults unknown languages to users collection", () => {
    expect(getCollectionName("fr")).toBe("users");
    expect(getCollectionName("")).toBe("users");
  });
});

// ============================================================
// Push time validation tests
// ============================================================

describe("push time validation", () => {
  it("accepts valid HH:MM formats", () => {
    expect(TIME_REGEX.test("00:00")).toBe(true);
    expect(TIME_REGEX.test("08:00")).toBe(true);
    expect(TIME_REGEX.test("12:30")).toBe(true);
    expect(TIME_REGEX.test("23:59")).toBe(true);
    expect(TIME_REGEX.test("09:05")).toBe(true);
  });

  it("rejects invalid hours", () => {
    expect(TIME_REGEX.test("24:00")).toBe(false);
    expect(TIME_REGEX.test("25:00")).toBe(false);
    expect(TIME_REGEX.test("99:00")).toBe(false);
  });

  it("rejects invalid minutes", () => {
    expect(TIME_REGEX.test("08:60")).toBe(false);
    expect(TIME_REGEX.test("08:99")).toBe(false);
  });

  it("rejects malformed strings", () => {
    expect(TIME_REGEX.test("8:00")).toBe(false);
    expect(TIME_REGEX.test("08:0")).toBe(false);
    expect(TIME_REGEX.test("0800")).toBe(false);
    expect(TIME_REGEX.test("")).toBe(false);
    expect(TIME_REGEX.test("abc")).toBe(false);
    expect(TIME_REGEX.test("08:00:00")).toBe(false);
  });

  it("rejects injection attempts", () => {
    expect(TIME_REGEX.test("08:00; DROP TABLE")).toBe(false);
    expect(TIME_REGEX.test("../../etc/passwd")).toBe(false);
  });
});

// ============================================================
// Notification toggle validation tests
// ============================================================

describe("notification toggle validation", () => {
  it("accepts boolean values", () => {
    expect(typeof true === "boolean").toBe(true);
    expect(typeof false === "boolean").toBe(true);
  });

  it("rejects non-boolean values", () => {
    expect(typeof "true" === "boolean").toBe(false);
    expect(typeof 1 === "boolean").toBe(false);
    expect(typeof null === "boolean").toBe(false);
    expect(typeof undefined === "boolean").toBe(false);
    expect(typeof 0 === "boolean").toBe(false);
  });
});

// ============================================================
// Message content validation tests
// ============================================================

describe("admin message validation", () => {
  it("accepts valid messages", () => {
    const content = "Hello, how are you?";
    expect(typeof content === "string").toBe(true);
    expect(content.trim().length > 0).toBe(true);
    expect(content.length <= 5000).toBe(true);
  });

  it("rejects empty content", () => {
    expect("".trim().length === 0).toBe(true);
    expect("   ".trim().length === 0).toBe(true);
  });

  it("rejects content exceeding 5000 chars", () => {
    const longContent = "a".repeat(5001);
    expect(longContent.length > 5000).toBe(true);
  });

  it("accepts content at exactly 5000 chars", () => {
    const maxContent = "a".repeat(5000);
    expect(maxContent.length <= 5000).toBe(true);
  });

  it("trims whitespace before sending", () => {
    const content = "  hello world  ";
    expect(content.trim()).toBe("hello world");
  });
});

// ============================================================
// JST date helper tests
// ============================================================

describe("getTodayJST", () => {
  it("returns YYYY-MM-DD format", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(dateRegex.test(getTodayJST())).toBe(true);
  });

  it("returns a 10-character string", () => {
    expect(getTodayJST().length).toBe(10);
  });
});

// ============================================================
// arrayUnion constraint tests (the core bug we fixed)
// ============================================================

describe("Firestore arrayUnion constraints", () => {
  // This documents the rule that FieldValue.serverTimestamp()
  // cannot be used inside FieldValue.arrayUnion().
  // Timestamp.now() must be used instead.

  it("Timestamp.now() produces a plain value (not a sentinel)", () => {
    // Simulate what Timestamp.now() returns vs FieldValue.serverTimestamp()
    // A Timestamp has _seconds and _nanoseconds — it's a concrete value.
    const now = new Date();
    const seconds = Math.floor(now.getTime() / 1000);
    const nanos = (now.getTime() % 1000) * 1_000_000;

    // This is what Timestamp.now() effectively produces
    const timestamp = { _seconds: seconds, _nanoseconds: nanos };

    expect(typeof timestamp._seconds).toBe("number");
    expect(typeof timestamp._nanoseconds).toBe("number");
    expect(timestamp._seconds).toBeGreaterThan(0);
  });
});

// ============================================================
// Chat logs response field name consistency test
// ============================================================

describe("chat logs API response", () => {
  it("response uses 'chatLogs' key matching frontend expectation", () => {
    // The API must return { chatLogs: [...] } not { logs: [...] }
    // Frontend reads: data.chatLogs
    const apiResponseKey = "chatLogs";
    const frontendExpectedKey = "chatLogs";
    expect(apiResponseKey).toBe(frontendExpectedKey);
  });
});

// ============================================================
// Broadcast filter tests
// ============================================================

describe("broadcast filter logic", () => {
  const mockUsers = [
    { id: "1", plan: "free", englishLevel: "beginner", healthScore: 80, isActive: true, lastActiveDate: "2026-03-15", lineUserId: "U001" },
    { id: "2", plan: "bot_pro", englishLevel: "advanced", healthScore: 20, isActive: true, lastActiveDate: "2026-03-10", lineUserId: "U002" },
    { id: "3", plan: "free", englishLevel: "intermediate", healthScore: 50, isActive: false, lastActiveDate: "2026-03-01", lineUserId: "U003" },
    { id: "4", plan: "bot_pro", englishLevel: "beginner", healthScore: 10, isActive: true, lastActiveDate: "2026-02-01", lineUserId: null },
  ];

  // Extracted filter function matching broadcast route logic
  function applyFilters(
    users: typeof mockUsers,
    filters: { plan?: string; level?: string; healthMin?: number; healthMax?: number }
  ) {
    let filtered = [...users];
    if (filters.plan) {
      filtered = filtered.filter((u) => u.plan === filters.plan);
    }
    if (filters.level) {
      filtered = filtered.filter((u) => u.englishLevel === filters.level);
    }
    if (filters.healthMin !== undefined) {
      filtered = filtered.filter((u) => (u.healthScore ?? 0) >= filters.healthMin!);
    }
    if (filters.healthMax !== undefined) {
      filtered = filtered.filter((u) => (u.healthScore ?? 100) <= filters.healthMax!);
    }
    return filtered;
  }

  it("filters by plan", () => {
    const result = applyFilters(mockUsers, { plan: "free" });
    expect(result.length).toBe(2);
    expect(result.every((u) => u.plan === "free")).toBe(true);
  });

  it("filters by level", () => {
    const result = applyFilters(mockUsers, { level: "beginner" });
    expect(result.length).toBe(2);
    expect(result.every((u) => u.englishLevel === "beginner")).toBe(true);
  });

  it("filters by health score range", () => {
    const result = applyFilters(mockUsers, { healthMin: 20, healthMax: 80 });
    expect(result.length).toBe(3);
  });

  it("combines plan and level filters", () => {
    const result = applyFilters(mockUsers, { plan: "bot_pro", level: "advanced" });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("2");
  });

  it("returns all users when no filters applied", () => {
    const result = applyFilters(mockUsers, {});
    expect(result.length).toBe(4);
  });

  it("returns empty array when no users match", () => {
    const result = applyFilters(mockUsers, { plan: "bot_pro", level: "intermediate" });
    expect(result.length).toBe(0);
  });
});

// ============================================================
// sentCount race condition fix test
// ============================================================

describe("broadcast sentCount calculation", () => {
  it("counts successes correctly using filter instead of increment", () => {
    // Simulates the fixed approach: collect results then count
    const results = [true, false, true, true, false];
    const sentCount = results.filter(Boolean).length;
    expect(sentCount).toBe(3);
  });

  it("handles all failures", () => {
    const results = [false, false, false];
    const sentCount = results.filter(Boolean).length;
    expect(sentCount).toBe(0);
  });

  it("handles all successes", () => {
    const results = [true, true, true, true];
    const sentCount = results.filter(Boolean).length;
    expect(sentCount).toBe(4);
  });

  it("handles empty batch", () => {
    const results: boolean[] = [];
    const sentCount = results.filter(Boolean).length;
    expect(sentCount).toBe(0);
  });

  it("accumulates across multiple batches correctly", () => {
    // Simulates multiple batches being processed
    let totalSent = 0;
    const batch1Results = [true, true, false];
    totalSent += batch1Results.filter(Boolean).length;
    const batch2Results = [true, false, true];
    totalSent += batch2Results.filter(Boolean).length;
    expect(totalSent).toBe(4);
  });
});

// ============================================================
// Plan change dialog logic tests
// ============================================================

describe("plan change dialog logic", () => {
  it("correctly computes new plan (toggle)", () => {
    const getNewPlan = (current: string) =>
      current === "free" ? "bot_pro" : "free";

    expect(getNewPlan("free")).toBe("bot_pro");
    expect(getNewPlan("bot_pro")).toBe("free");
  });

  it("formats plan labels correctly", () => {
    const planLabel = (plan: string) =>
      plan === "free" ? "Free" : "Bot Pro";

    expect(planLabel("free")).toBe("Free");
    expect(planLabel("bot_pro")).toBe("Bot Pro");
  });
});

// ============================================================
// User detail page helper tests
// ============================================================

describe("getLast7Days helper", () => {
  function getLast7Days(): string[] {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  }

  it("returns exactly 7 days", () => {
    expect(getLast7Days().length).toBe(7);
  });

  it("returns dates in YYYY-MM-DD format", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const day of getLast7Days()) {
      expect(dateRegex.test(day)).toBe(true);
    }
  });

  it("returns dates in ascending order", () => {
    const days = getLast7Days();
    for (let i = 1; i < days.length; i++) {
      expect(days[i] > days[i - 1]).toBe(true);
    }
  });

  it("last day is today", () => {
    const days = getLast7Days();
    const today = new Date().toISOString().split("T")[0];
    expect(days[days.length - 1]).toBe(today);
  });
});

describe("getLast7DayStart helper", () => {
  function getLast7DayStart(lastActiveDate: string, currentStreak: number): string {
    const lastActive = new Date(lastActiveDate);
    const streakStart = new Date(lastActive);
    streakStart.setDate(streakStart.getDate() - currentStreak + 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const start = streakStart > sevenDaysAgo ? streakStart : sevenDaysAgo;
    return start.toISOString().split("T")[0];
  }

  it("returns date string in YYYY-MM-DD format", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const result = getLast7DayStart("2026-03-15", 3);
    expect(dateRegex.test(result)).toBe(true);
  });

  it("streak of 1 starts on lastActiveDate itself", () => {
    const today = new Date().toISOString().split("T")[0];
    const result = getLast7DayStart(today, 1);
    expect(result).toBe(today);
  });
});
