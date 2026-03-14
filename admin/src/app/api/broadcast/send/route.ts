import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { recordAuditLog } from "@/lib/audit";

function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  // First check basic auth
  let sessionUser;
  try {
    sessionUser = await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filters = {} as BroadcastFilters, message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const lang = filters.lang || "en";
    const db = getAdminDb();
    const collectionName = getCollectionName(lang);

    // Fetch and filter users
    const snapshot = await db.collection(collectionName).get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allUsers: any[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const matchingUsers = applyBroadcastFilters(allUsers, filters);

    // Safety check: if >50 users, require admin role
    if (matchingUsers.length > 50) {
      try {
        await requireAdmin();
      } catch {
        return NextResponse.json(
          { error: "Admin role required for broadcasts to more than 50 users" },
          { status: 403 }
        );
      }
    }

    // Safety check: max 3 broadcasts per day
    const today = getTodayJST();
    const startOfDay = new Date(`${today}T00:00:00+09:00`);
    const endOfDay = new Date(`${today}T23:59:59+09:00`);

    const broadcastsToday = await db
      .collection("adminActions")
      .where("action", "==", "broadcast_send")
      .where("createdAt", ">=", startOfDay)
      .where("createdAt", "<=", endOfDay)
      .get();

    if (broadcastsToday.size >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 broadcasts per day exceeded" },
        { status: 429 }
      );
    }

    // Send messages via LINE Messaging API in batches
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!channelAccessToken) {
      return NextResponse.json(
        { error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" },
        { status: 500 }
      );
    }

    let sentCount = 0;
    const batchSize = 10;

    for (let i = 0; i < matchingUsers.length; i += batchSize) {
      const batch = matchingUsers.slice(i, i + batchSize);

      const sendPromises = batch.map(async (user) => {
        const lineUserId = user.lineUserId;
        if (!lineUserId) return false;

        try {
          const response = await fetch(
            "https://api.line.me/v2/bot/message/push",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${channelAccessToken}`,
              },
              body: JSON.stringify({
                to: lineUserId,
                messages: [
                  {
                    type: "text",
                    text: message.trim(),
                  },
                ],
              }),
            }
          );

          if (response.ok) {
            sentCount++;
            return true;
          } else {
            const errorBody = await response.text();
            console.error(
              `Failed to send to ${lineUserId}:`,
              response.status,
              errorBody
            );
            return false;
          }
        } catch (err) {
          console.error(`Error sending to ${lineUserId}:`, err);
          return false;
        }
      });

      await Promise.all(sendPromises);

      // Wait 200ms between batches
      if (i + batchSize < matchingUsers.length) {
        await sleep(200);
      }
    }

    // Record audit log
    await recordAuditLog({
      adminUserId: sessionUser.uid,
      action: "broadcast_send",
      details: {
        filters,
        message: message.trim(),
        targetCount: matchingUsers.length,
        sentCount,
        lang,
      },
    });

    return NextResponse.json({ sent: sentCount });
  } catch (error) {
    console.error("Error sending broadcast:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
