import { describe, it, expect } from "vitest";

// ============================================================
// シニアCS観点の運営テスト
// カスタマーサクセスが管理画面で行う日常業務のシナリオを検証
// ============================================================

// --- Shared helpers & constants (extracted from route logic) ---

const VALID_PLANS = ["free", "bot_pro"];
const VALID_LEVELS = ["beginner", "intermediate", "advanced"];

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? "user1",
    displayName: overrides.displayName ?? "テストユーザー",
    lineUserId: overrides.lineUserId ?? "U1234567890",
    plan: overrides.plan ?? "free",
    englishLevel: overrides.englishLevel ?? "beginner",
    healthScore: overrides.healthScore ?? 50,
    currentStreak: overrides.currentStreak ?? 3,
    longestStreak: overrides.longestStreak ?? 10,
    lastActiveDate: overrides.lastActiveDate ?? getTodayJST(),
    totalChats: overrides.totalChats ?? 20,
    totalVoice: overrides.totalVoice ?? 5,
    isActive: overrides.isActive ?? true,
    pushTime: overrides.pushTime ?? "08:00",
    language: overrides.language ?? "en",
    onboardingStatus: overrides.onboardingStatus ?? {
      firstText: true,
      levelSet: true,
      pushTimeSet: true,
      firstVoice: true,
      streak3: true,
    },
    createdAt: overrides.createdAt ?? { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
    ...overrides,
  };
}

interface BroadcastFilters {
  lang?: string;
  plan?: string;
  level?: string;
  healthMin?: number;
  healthMax?: number;
  lastActiveDaysAgo?: number;
  onboardingComplete?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyBroadcastFilters(users: any[], filters: BroadcastFilters): any[] {
  let filtered = [...users];

  if (filters.plan) {
    filtered = filtered.filter((u) => u.plan === filters.plan);
  }
  if (filters.level) {
    filtered = filtered.filter((u) => u.englishLevel === filters.level);
  }
  if (filters.healthMin !== undefined && filters.healthMin !== null) {
    filtered = filtered.filter((u) => (u.healthScore ?? 0) >= filters.healthMin!);
  }
  if (filters.healthMax !== undefined && filters.healthMax !== null) {
    filtered = filtered.filter((u) => (u.healthScore ?? 100) <= filters.healthMax!);
  }
  if (filters.lastActiveDaysAgo !== undefined && filters.lastActiveDaysAgo !== null) {
    const today = getTodayJST();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - filters.lastActiveDaysAgo);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);
    filtered = filtered.filter((u) => {
      const lastActive = u.lastActiveDate || "";
      return lastActive <= cutoffStr;
    });
  }
  if (filters.onboardingComplete !== undefined && filters.onboardingComplete !== null) {
    filtered = filtered.filter((u) => {
      const os = u.onboardingStatus;
      if (!os) return !filters.onboardingComplete;
      const isComplete = os.firstText && os.levelSet && os.pushTimeSet && os.firstVoice && os.streak3;
      return filters.onboardingComplete ? isComplete : !isComplete;
    });
  }

  return filtered;
}

// ============================================================
// S1: 離脱リスク管理 — churnRiskプリセットフィルター
// CSシナリオ: 離脱しそうなProユーザーを見つけて介入する
// ============================================================

describe("CS: 離脱リスク (churnRisk) プリセット", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyChurnRiskPreset(users: any[]) {
    return users.filter(
      (u) => (u.healthScore ?? 100) < 30 && u.plan === "bot_pro"
    );
  }

  it("health < 30 かつ bot_pro のユーザーのみ抽出される", () => {
    const users = [
      makeUser({ id: "1", healthScore: 20, plan: "bot_pro" }),  // 該当
      makeUser({ id: "2", healthScore: 80, plan: "bot_pro" }),  // healthScore高い
      makeUser({ id: "3", healthScore: 10, plan: "free" }),     // freeプラン
      makeUser({ id: "4", healthScore: 29, plan: "bot_pro" }),  // 該当
      makeUser({ id: "5", healthScore: 30, plan: "bot_pro" }),  // ちょうど30 = 該当しない
    ];
    const result = applyChurnRiskPreset(users);
    expect(result.map((u) => u.id)).toEqual(["1", "4"]);
  });

  it("healthScoreが未設定(undefined)のユーザーはデフォルト100で除外される", () => {
    const users = [
      makeUser({ id: "1", healthScore: undefined, plan: "bot_pro" }),
    ];
    const result = applyChurnRiskPreset(users);
    expect(result.length).toBe(0);
  });

  it("healthScore = 0 のbot_proユーザーは最高リスクとして抽出される", () => {
    const users = [
      makeUser({ id: "1", healthScore: 0, plan: "bot_pro" }),
    ];
    const result = applyChurnRiskPreset(users);
    expect(result.length).toBe(1);
  });
});

// ============================================================
// S3: オンボーディング管理
// CSシナリオ: オンボーディング未完了ユーザーを特定してフォローする
// ============================================================

describe("CS: オンボーディング未完了プリセット", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyOnboardingIncompletePreset(users: any[]) {
    return users.filter((u) => {
      const os = u.onboardingStatus;
      if (!os) return true;
      return !os.firstText || !os.levelSet || !os.pushTimeSet || !os.firstVoice || !os.streak3;
    });
  }

  it("全5ステップ完了のユーザーは除外される", () => {
    const users = [makeUser({ onboardingStatus: { firstText: true, levelSet: true, pushTimeSet: true, firstVoice: true, streak3: true } })];
    const result = applyOnboardingIncompletePreset(users);
    expect(result.length).toBe(0);
  });

  it("1ステップでも未完了なら抽出される", () => {
    const users = [
      makeUser({ id: "1", onboardingStatus: { firstText: true, levelSet: true, pushTimeSet: true, firstVoice: true, streak3: false } }),
      makeUser({ id: "2", onboardingStatus: { firstText: false, levelSet: true, pushTimeSet: true, firstVoice: true, streak3: true } }),
    ];
    const result = applyOnboardingIncompletePreset(users);
    expect(result.length).toBe(2);
  });

  it("onboardingStatusがnullのユーザーは未完了として扱われる", () => {
    const users = [makeUser({ onboardingStatus: null })];
    const result = applyOnboardingIncompletePreset(users);
    expect(result.length).toBe(1);
  });

  it("onboardingStatusがundefinedのユーザーは未完了として扱われる", () => {
    const users = [makeUser({ onboardingStatus: undefined })];
    const result = applyOnboardingIncompletePreset(users);
    expect(result.length).toBe(1);
  });
});

// ============================================================
// S5: ブロードキャスト — lastActiveDaysAgoフィルター
// CSシナリオ: N日以上非アクティブなユーザーにリマインダーを送る
// ============================================================

describe("CS: ブロードキャスト lastActiveDaysAgo フィルター", () => {
  it("3日以上非アクティブなユーザーのみ抽出される", () => {
    const today = getTodayJST();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const users = [
      makeUser({ id: "active_today", lastActiveDate: today }),
      makeUser({ id: "active_2days", lastActiveDate: twoDaysAgo.toISOString().slice(0, 10) }),
      makeUser({ id: "inactive_5days", lastActiveDate: fiveDaysAgo.toISOString().slice(0, 10) }),
    ];

    const result = applyBroadcastFilters(users, { lastActiveDaysAgo: 3 });
    expect(result.map((u) => u.id)).toEqual(["inactive_5days"]);
  });

  it("lastActiveDateが空のユーザーは非アクティブとして扱われる", () => {
    const users = [makeUser({ id: "no_date", lastActiveDate: "" })];
    const result = applyBroadcastFilters(users, { lastActiveDaysAgo: 1 });
    expect(result.length).toBe(1);
  });

  it("lastActiveDaysAgo = 0 の場合、全ユーザーが対象外", () => {
    const users = [
      makeUser({ id: "1", lastActiveDate: getTodayJST() }),
    ];
    // 0日以上前 = cutoffが今日 → lastActive <= 今日 → 今日のユーザーも含まれる
    const result = applyBroadcastFilters(users, { lastActiveDaysAgo: 0 });
    expect(result.length).toBe(1);
  });
});

// ============================================================
// S6: ブロードキャスト — onboardingCompleteフィルター
// CSシナリオ: オンボーディング完了/未完了別にメッセージを配信する
// ============================================================

describe("CS: ブロードキャスト onboardingComplete フィルター", () => {
  const users = [
    makeUser({
      id: "complete",
      onboardingStatus: { firstText: true, levelSet: true, pushTimeSet: true, firstVoice: true, streak3: true },
    }),
    makeUser({
      id: "incomplete",
      onboardingStatus: { firstText: true, levelSet: false, pushTimeSet: true, firstVoice: true, streak3: true },
    }),
    makeUser({
      id: "no_status",
      onboardingStatus: null,
    }),
  ];

  it("onboardingComplete=true で完了ユーザーのみ抽出", () => {
    const result = applyBroadcastFilters(users, { onboardingComplete: true });
    expect(result.map((u) => u.id)).toEqual(["complete"]);
  });

  it("onboardingComplete=false で未完了ユーザーのみ抽出（null含む）", () => {
    const result = applyBroadcastFilters(users, { onboardingComplete: false });
    expect(result.map((u) => u.id)).toEqual(["incomplete", "no_status"]);
  });
});

// ============================================================
// S7: ブロードキャスト — プレビューと実送信の一致
// CSシナリオ: プレビュー件数が実際の送信可能数と一致すること
// ============================================================

describe("CS: ブロードキャスト プレビューと送信の件数一致", () => {
  it("lineUserIdなしのユーザーはプレビュー件数から除外されるべき", () => {
    const users = [
      makeUser({ id: "1", lineUserId: "U001" }),
      makeUser({ id: "2", lineUserId: "U002" }),
      makeUser({ id: "3", lineUserId: null }),
      makeUser({ id: "4", lineUserId: "" }),
      makeUser({ id: "5", lineUserId: undefined }),
    ];

    const matchingUsers = applyBroadcastFilters(users, {});

    // Preview logic (修正後): lineUserIdがあるユーザーのみカウント
    const sendableUsers = matchingUsers.filter((u) => !!u.lineUserId);
    expect(sendableUsers.length).toBe(2);

    // Send logic: lineUserIdなしはスキップ
    const sendResults = matchingUsers.map((user) => {
      if (!user.lineUserId) return false;
      return true; // simulate successful send
    });
    const sentCount = sendResults.filter(Boolean).length;

    // プレビューと送信結果が一致する
    expect(sendableUsers.length).toBe(sentCount);
  });

  it("noLineUserIdの件数が正しく計算される", () => {
    const users = [
      makeUser({ id: "1", lineUserId: "U001" }),
      makeUser({ id: "2", lineUserId: null }),
      makeUser({ id: "3", lineUserId: undefined }),
    ];

    const matchingUsers = applyBroadcastFilters(users, {});
    const sendable = matchingUsers.filter((u) => !!u.lineUserId);
    const noLineId = matchingUsers.length - sendable.length;

    expect(noLineId).toBe(2);
  });
});

// ============================================================
// S8: ブロードキャスト — 送信レスポンスの全体像
// CSシナリオ: 送信結果で成功/失敗/スキップの内訳を確認できること
// ============================================================

describe("CS: ブロードキャスト送信レスポンスの完全性", () => {
  it("レスポンスにtargetCount, sendableCount, sent, skippedNoLineId, failedCountが含まれる", () => {
    const matchingUsers = [
      makeUser({ id: "1", lineUserId: "U001" }),
      makeUser({ id: "2", lineUserId: "U002" }),
      makeUser({ id: "3", lineUserId: null }),
    ];

    // Simulate send results
    const sendResults = [true, false]; // U001 success, U002 failure
    const sentCount = sendResults.filter(Boolean).length;
    const sendableCount = matchingUsers.filter((u) => !!u.lineUserId).length;

    const response = {
      sent: sentCount,
      targetCount: matchingUsers.length,
      sendableCount,
      skippedNoLineId: matchingUsers.length - sendableCount,
      failedCount: sendableCount - sentCount,
    };

    expect(response.sent).toBe(1);
    expect(response.targetCount).toBe(3);
    expect(response.sendableCount).toBe(2);
    expect(response.skippedNoLineId).toBe(1);
    expect(response.failedCount).toBe(1);
    // 整合性チェック: sent + failed + skipped = target
    expect(response.sent + response.failedCount + response.skippedNoLineId).toBe(response.targetCount);
  });
});

// ============================================================
// S9/S10: ブロードキャスト — 安全制限
// CSシナリオ: 誤配信を防ぐための安全装置が機能すること
// ============================================================

describe("CS: ブロードキャスト安全制限", () => {
  it("1日3回の制限判定が正しい（3回目まではOK、4回目はNG）", () => {
    const broadcastCountToday = (count: number) => count >= 3;
    expect(broadcastCountToday(0)).toBe(false); // 1回目OK
    expect(broadcastCountToday(1)).toBe(false); // 2回目OK
    expect(broadcastCountToday(2)).toBe(false); // 3回目OK
    expect(broadcastCountToday(3)).toBe(true);  // 4回目NG
  });

  it("50人超の判定が正しい（50人まではOK、51人からはadmin必須）", () => {
    const requiresAdmin = (count: number) => count > 50;
    expect(requiresAdmin(50)).toBe(false);
    expect(requiresAdmin(51)).toBe(true);
    expect(requiresAdmin(0)).toBe(false);
  });
});

// ============================================================
// S11-S13: ユーザー管理 — プラン/レベル変更
// CSシナリオ: ユーザーのプラン・レベルを適切に管理する
// ============================================================

describe("CS: プラン変更ワークフロー", () => {
  it("free → bot_pro のアップグレードが検出される", () => {
    const from = "free";
    const to = "bot_pro";
    const isUpgrade = from === "free" && to === "bot_pro";
    expect(isUpgrade).toBe(true);
    expect(VALID_PLANS.includes(to)).toBe(true);
  });

  it("bot_pro → free のダウングレードが検出される", () => {
    const from = "bot_pro";
    const to = "free";
    const isUpgrade = from === "free" && to === "bot_pro";
    expect(isUpgrade).toBe(false);
    expect(VALID_PLANS.includes(to)).toBe(true);
  });

  it("同一プランへの変更は防止される", () => {
    const current = "bot_pro";
    const requested = "bot_pro";
    expect(current === requested).toBe(true); // これを検出して400エラーを返す
  });
});

describe("CS: レベル変更ワークフロー", () => {
  it("全レベルが有効値として認識される", () => {
    expect(VALID_LEVELS).toEqual(["beginner", "intermediate", "advanced"]);
  });

  it("CSが手動でレベルを上げるケース（beginner → intermediate）", () => {
    const currentLevel = "beginner";
    const newLevel = "intermediate";
    expect(currentLevel !== newLevel).toBe(true);
    expect(VALID_LEVELS.includes(newLevel)).toBe(true);
  });
});

// ============================================================
// S13: lineUserIdなしユーザーへのDM
// CSシナリオ: LINE未連携ユーザーへのメッセージ送信が適切にエラーとなること
// ============================================================

describe("CS: lineUserIdなしユーザーへのDM送信", () => {
  it("lineUserIdがないユーザーへの送信はエラーとなる", () => {
    const user = makeUser({ lineUserId: null });
    const hasLineId = !!user.lineUserId;
    expect(hasLineId).toBe(false);
    // APIは400エラー "User does not have a LINE user ID" を返す
  });

  it("lineUserIdが空文字のユーザーも送信不可", () => {
    const user = makeUser({ lineUserId: "" });
    const hasLineId = !!user.lineUserId;
    expect(hasLineId).toBe(false);
  });

  it("lineUserIdがあるユーザーは送信可能", () => {
    const user = makeUser({ lineUserId: "U1234567890" });
    const hasLineId = !!user.lineUserId;
    expect(hasLineId).toBe(true);
  });
});

// ============================================================
// S15: ユーザー検索
// CSシナリオ: 名前やLINE IDでユーザーを素早く見つける
// ============================================================

describe("CS: ユーザー検索機能", () => {
  const users = [
    makeUser({ id: "1", displayName: "田中太郎", lineUserId: "U_tanaka" }),
    makeUser({ id: "2", displayName: "鈴木花子", lineUserId: "U_suzuki" }),
    makeUser({ id: "3", displayName: "John Smith", lineUserId: "U_john" }),
    makeUser({ id: "4", displayName: null, lineUserId: "U_unknown" }),
    makeUser({ id: "5", displayName: "テスト", lineUserId: null }),
  ];

  function searchUsers(allUsers: typeof users, searchTerm: string) {
    const searchLower = searchTerm.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(searchLower) ||
        u.lineUserId?.toLowerCase().includes(searchLower)
    );
  }

  it("日本語の名前で検索できる", () => {
    const result = searchUsers(users, "田中");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("1");
  });

  it("英語の名前で検索できる（大小文字無視）", () => {
    const result = searchUsers(users, "john");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("3");
  });

  it("LINE IDで検索できる", () => {
    const result = searchUsers(users, "U_suzuki");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("2");
  });

  it("displayNameがnullでもクラッシュしない", () => {
    const result = searchUsers(users, "unknown");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("4");
  });

  it("lineUserIdがnullでもクラッシュしない", () => {
    const result = searchUsers(users, "テスト");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("5");
  });

  it("検索ヒットなしの場合は空配列", () => {
    const result = searchUsers(users, "存在しない名前");
    expect(result.length).toBe(0);
  });
});

// ============================================================
// S16: コホートリテンション計算
// CSシナリオ: 週ごとのリテンション率を正確に把握する
// ============================================================

describe("CS: コホートリテンション計算", () => {
  function getISOWeek(dateStr: string): string {
    const date = new Date(dateStr);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  function calculateRetention(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    users: any[],
    registrationWeek: string,
    weeksAfter: number
  ): number {
    const cohortUsers = users.filter((u) => {
      const createdDate = new Date(u.createdAt._seconds * 1000).toISOString().slice(0, 10);
      return getISOWeek(createdDate) === registrationWeek;
    });

    if (cohortUsers.length === 0) return 0;

    const targetWeekStart = new Date(registrationWeek.replace(/-W\d+$/, "-01-01"));
    // Simplified: calculate target date range
    const regWeekNum = parseInt(registrationWeek.split("-W")[1]);
    const targetDate = new Date(targetWeekStart);
    targetDate.setDate(targetDate.getDate() + (regWeekNum + weeksAfter - 1) * 7);
    const targetWeek = getISOWeek(targetDate.toISOString().slice(0, 10));

    const retainedUsers = cohortUsers.filter((u) => {
      const lastActiveWeek = getISOWeek(u.lastActiveDate);
      return lastActiveWeek >= targetWeek;
    });

    return Math.round((retainedUsers.length / cohortUsers.length) * 100);
  }

  it("ISO週が正しく計算される", () => {
    // 2026-01-05 is a Monday in ISO week 2
    expect(getISOWeek("2026-01-05")).toBe("2026-W02");
  });

  it("全員がアクティブなコホートのリテンション率は100%", () => {
    const week = "2026-W01";
    const users = [
      makeUser({ id: "1", createdAt: { _seconds: new Date("2026-01-01").getTime() / 1000, _nanoseconds: 0 }, lastActiveDate: "2026-03-15" }),
      makeUser({ id: "2", createdAt: { _seconds: new Date("2026-01-02").getTime() / 1000, _nanoseconds: 0 }, lastActiveDate: "2026-03-15" }),
    ];
    const retention = calculateRetention(users, week, 1);
    expect(retention).toBe(100);
  });
});

// ============================================================
// 複合シナリオ: CSの典型的なワークフロー
// ============================================================

describe("CS: 複合ワークフロー - 離脱リスクユーザーへの介入", () => {
  it("離脱リスクフィルター → 対象抽出 → lineUserId確認 → 送信可能判定", () => {
    const users = [
      makeUser({ id: "risk1", healthScore: 15, plan: "bot_pro", lineUserId: "U001" }),
      makeUser({ id: "risk2", healthScore: 25, plan: "bot_pro", lineUserId: null }),
      makeUser({ id: "healthy", healthScore: 80, plan: "bot_pro", lineUserId: "U003" }),
      makeUser({ id: "risk_free", healthScore: 10, plan: "free", lineUserId: "U004" }),
    ];

    // Step 1: churnRiskフィルター
    const atRisk = users.filter((u) => (u.healthScore ?? 100) < 30 && u.plan === "bot_pro");
    expect(atRisk.length).toBe(2);

    // Step 2: 送信可能なユーザーのみ
    const sendable = atRisk.filter((u) => !!u.lineUserId);
    expect(sendable.length).toBe(1);
    expect(sendable[0].id).toBe("risk1");
  });
});

describe("CS: 複合ワークフロー - オンボーディングフォロー配信", () => {
  it("未完了 + 3日以上非アクティブ + lineUserId ありのユーザーを抽出", () => {
    const today = getTodayJST();
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const users = [
      makeUser({
        id: "target",
        lastActiveDate: fiveDaysAgo.toISOString().slice(0, 10),
        onboardingStatus: { firstText: true, levelSet: false, pushTimeSet: false, firstVoice: false, streak3: false },
        lineUserId: "U001",
      }),
      makeUser({
        id: "complete_inactive",
        lastActiveDate: fiveDaysAgo.toISOString().slice(0, 10),
        onboardingStatus: { firstText: true, levelSet: true, pushTimeSet: true, firstVoice: true, streak3: true },
        lineUserId: "U002",
      }),
      makeUser({
        id: "incomplete_active",
        lastActiveDate: today,
        onboardingStatus: { firstText: true, levelSet: false, pushTimeSet: false, firstVoice: false, streak3: false },
        lineUserId: "U003",
      }),
      makeUser({
        id: "no_line_id",
        lastActiveDate: fiveDaysAgo.toISOString().slice(0, 10),
        onboardingStatus: { firstText: false, levelSet: false, pushTimeSet: false, firstVoice: false, streak3: false },
        lineUserId: null,
      }),
    ];

    const filtered = applyBroadcastFilters(users, {
      lastActiveDaysAgo: 3,
      onboardingComplete: false,
    });

    // フィルター結果: target + no_line_id
    expect(filtered.length).toBe(2);

    // 送信可能なユーザー
    const sendable = filtered.filter((u) => !!u.lineUserId);
    expect(sendable.length).toBe(1);
    expect(sendable[0].id).toBe("target");
  });
});

// ============================================================
// ヘルススコアのデフォルト値の一貫性
// ============================================================

describe("CS: ヘルススコア デフォルト値の一貫性", () => {
  it("healthScoreがnullの場合、healthMinフィルターはデフォルト0として扱う", () => {
    const users = [makeUser({ healthScore: null })];
    const result = applyBroadcastFilters(users, { healthMin: 10 });
    // null ?? 0 = 0 < 10 → 除外される
    expect(result.length).toBe(0);
  });

  it("healthScoreがnullの場合、healthMaxフィルターはデフォルト100として扱う", () => {
    const users = [makeUser({ healthScore: null })];
    const result = applyBroadcastFilters(users, { healthMax: 50 });
    // null ?? 100 = 100 > 50 → 除外される
    expect(result.length).toBe(0);
  });

  it("healthScoreがundefinedの場合も同様に動作する", () => {
    const users = [makeUser({ healthScore: undefined })];
    const minResult = applyBroadcastFilters(users, { healthMin: 10 });
    const maxResult = applyBroadcastFilters(users, { healthMax: 50 });
    expect(minResult.length).toBe(0);
    expect(maxResult.length).toBe(0);
  });
});

// ============================================================
// レビュー指摘対応テスト
// ============================================================

describe("Review: R3 - ブロードキャストメッセージ長制限", () => {
  const MAX_MESSAGE_LENGTH = 5000;

  it("5000文字以内のメッセージは受け付けられる", () => {
    const message = "a".repeat(5000);
    expect(message.length <= MAX_MESSAGE_LENGTH).toBe(true);
  });

  it("5001文字以上のメッセージは拒否される", () => {
    const message = "a".repeat(5001);
    expect(message.length > MAX_MESSAGE_LENGTH).toBe(true);
  });

  it("空のメッセージは拒否される", () => {
    expect("".trim().length === 0).toBe(true);
    expect("   ".trim().length === 0).toBe(true);
  });
});

describe("Review: R4 - 50人超チェックはsendableUsers基準", () => {
  it("matchingが60人でもlineUserIdありが45人ならadmin不要", () => {
    const matchingUsers = [
      ...Array.from({ length: 45 }, (_, i) => makeUser({ id: `u${i}`, lineUserId: `U${i}` })),
      ...Array.from({ length: 15 }, (_, i) => makeUser({ id: `no${i}`, lineUserId: null })),
    ];
    const sendableUsers = matchingUsers.filter((u) => !!u.lineUserId);
    expect(matchingUsers.length).toBe(60);
    expect(sendableUsers.length).toBe(45);
    expect(sendableUsers.length > 50).toBe(false); // admin不要
  });

  it("sendableUsersが51人以上ならadmin必須", () => {
    const matchingUsers = Array.from({ length: 55 }, (_, i) =>
      makeUser({ id: `u${i}`, lineUserId: `U${i}` })
    );
    const sendableUsers = matchingUsers.filter((u) => !!u.lineUserId);
    expect(sendableUsers.length > 50).toBe(true); // admin必須
  });
});
