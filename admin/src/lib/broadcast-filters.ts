export interface BroadcastFilters {
  lang?: string;
  plan?: string;
  level?: string;
  healthMin?: number;
  healthMax?: number;
  lastActiveDaysAgo?: number;
  onboardingComplete?: boolean;
}

export function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyBroadcastFilters(users: any[], filters: BroadcastFilters): any[] {
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
