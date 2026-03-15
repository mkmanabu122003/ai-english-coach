import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { recordAuditLog } from "@/lib/audit";
import { applyBroadcastFilters, getCollectionName, getTodayJST, type BroadcastFilters } from "@/lib/broadcast-filters";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_MESSAGE_LENGTH = 5000;

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

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` },
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

    // 実際に送信可能なユーザー（lineUserIdあり）のみ対象
    const sendableUsers = matchingUsers.filter((u) => !!u.lineUserId);

    // Safety check: if >50 sendable users, require admin role
    if (sendableUsers.length > 50) {
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

    for (let i = 0; i < sendableUsers.length; i += batchSize) {
      const batch = sendableUsers.slice(i, i + batchSize);

      const sendPromises = batch.map(async (user) => {
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
                to: user.lineUserId,
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
            return true;
          } else {
            const errorBody = await response.text();
            console.error(
              `Failed to send to ${user.lineUserId}:`,
              response.status,
              errorBody
            );
            return false;
          }
        } catch (err) {
          console.error(`Error sending to ${user.lineUserId}:`, err);
          return false;
        }
      });

      const results = await Promise.all(sendPromises);
      sentCount += results.filter(Boolean).length;

      // Wait 200ms between batches
      if (i + batchSize < sendableUsers.length) {
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
        sendableCount: sendableUsers.length,
        sentCount,
        lang,
      },
    });

    return NextResponse.json({
      sent: sentCount,
      targetCount: matchingUsers.length,
      sendableCount: sendableUsers.length,
      skippedNoLineId: matchingUsers.length - sendableUsers.length,
      failedCount: sendableUsers.length - sentCount,
    });
  } catch (error) {
    console.error("Error sending broadcast:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
