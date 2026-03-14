import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const allowedSortFields = ["createdAt", "displayName", "language", "plan", "englishLevel", "healthScore", "currentStreak", "lastActiveDate", "totalChats"];
    const sortParam = searchParams.get("sort") || "createdAt";
    const sort = allowedSortFields.includes(sortParam) ? sortParam : "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const plan = searchParams.get("plan");
    const level = searchParams.get("level");
    const healthMin = searchParams.get("healthMin") ? parseFloat(searchParams.get("healthMin")!) : null;
    const healthMax = searchParams.get("healthMax") ? parseFloat(searchParams.get("healthMax")!) : null;
    const search = searchParams.get("search");
    const onboarding = searchParams.get("onboarding");
    const preset = searchParams.get("preset");

    const db = getAdminDb();

    // Fetch users from collection(s)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let users: any[] = [];

    if (lang === "all") {
      // Fetch from both collections in parallel
      const [enSnapshot, esSnapshot] = await Promise.all([
        db.collection("users").get(),
        db.collection("usersEs").get(),
      ]);
      const enUsers = enSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const esUsers = esSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      users = [...enUsers, ...esUsers];
    } else {
      const collectionName = getCollectionName(lang);
      const snapshot = await db.collection(collectionName).get();
      users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    // Apply preset filters
    if (preset === "churnRisk") {
      users = users.filter(
        (u) => (u.healthScore ?? 100) < 30 && u.plan === "bot_pro"
      );
    } else if (preset === "onboardingIncomplete") {
      users = users.filter((u) => {
        const os = u.onboardingStatus;
        if (!os) return true;
        return !os.firstText || !os.levelSet || !os.pushTimeSet || !os.firstVoice || !os.streak3;
      });
    } else if (preset === "newUsers") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoMs = sevenDaysAgo.getTime() / 1000;
      users = users.filter((u) => {
        const createdAt = u.createdAt?._seconds || u.createdAt?.seconds || 0;
        return createdAt >= sevenDaysAgoMs;
      });
    }

    // Apply individual filters
    if (plan) {
      users = users.filter((u) => u.plan === plan);
    }

    if (level) {
      users = users.filter((u) => u.englishLevel === level);
    }

    if (healthMin !== null) {
      users = users.filter((u) => (u.healthScore ?? 0) >= healthMin);
    }

    if (healthMax !== null) {
      users = users.filter((u) => (u.healthScore ?? 100) <= healthMax);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(searchLower) ||
          u.lineUserId?.toLowerCase().includes(searchLower)
      );
    }

    if (onboarding === "complete") {
      users = users.filter((u) => {
        const os = u.onboardingStatus;
        if (!os) return false;
        return os.firstText && os.levelSet && os.pushTimeSet && os.firstVoice && os.streak3;
      });
    } else if (onboarding === "incomplete") {
      users = users.filter((u) => {
        const os = u.onboardingStatus;
        if (!os) return true;
        return !os.firstText || !os.levelSet || !os.pushTimeSet || !os.firstVoice || !os.streak3;
      });
    }

    const total = users.length;

    // Sort
    users.sort((a, b) => {
      let aVal = a[sort];
      let bVal = b[sort];

      // Handle Firestore timestamps
      if (aVal && typeof aVal === "object" && ("_seconds" in aVal || "seconds" in aVal)) {
        aVal = aVal._seconds || aVal.seconds || 0;
      }
      if (bVal && typeof bVal === "object" && ("_seconds" in bVal || "seconds" in bVal)) {
        bVal = bVal._seconds || bVal.seconds || 0;
      }

      // Handle null/undefined
      if (aVal == null) aVal = 0;
      if (bVal == null) bVal = 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return order === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return order === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Paginate
    const offset = (page - 1) * limit;
    const paginated = users.slice(offset, offset + limit);

    return NextResponse.json({
      users: paginated,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
