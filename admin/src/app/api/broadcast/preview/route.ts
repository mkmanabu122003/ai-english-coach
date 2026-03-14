import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
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

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
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

export async function POST(request: NextRequest) {
  try {
    await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filters = {} } = body as { filters: BroadcastFilters };

    const lang = filters.lang || "en";
    const db = getAdminDb();
    const collectionName = getCollectionName(lang);

    const snapshot = await db.collection(collectionName).get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allUsers: any[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const matchingUsers = applyBroadcastFilters(allUsers, filters);

    return NextResponse.json({ count: matchingUsers.length });
  } catch (error) {
    console.error("Error previewing broadcast:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
