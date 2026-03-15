import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { recordAuditLog } from "@/lib/audit";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const body = await request.json();
    const { content, lang = "en" } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Message content must be 5000 characters or less" },
        { status: 400 }
      );
    }

    if (!["en", "es"].includes(lang)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const db = getAdminDb();
    const collectionName = getCollectionName(lang);
    const userRef = db.collection(collectionName).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const lineUserId = userData.lineUserId;

    if (!lineUserId) {
      return NextResponse.json(
        { error: "User does not have a LINE user ID" },
        { status: 400 }
      );
    }

    // Send message via LINE Messaging API
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!channelAccessToken) {
      return NextResponse.json(
        { error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" },
        { status: 500 }
      );
    }

    const lineResponse = await fetch(
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
              text: content.trim(),
            },
          ],
        }),
      }
    );

    if (!lineResponse.ok) {
      const errorBody = await lineResponse.text();
      console.error("LINE API error:", lineResponse.status, errorBody);
      return NextResponse.json(
        { error: "Failed to send LINE message" },
        { status: 502 }
      );
    }

    // Record in user's interventions array
    await userRef.update({
      interventions: FieldValue.arrayUnion({
        type: "admin_message",
        content: content.trim(),
        sentAt: Timestamp.now(),
        adminUserId: admin.uid,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Record audit log
    await recordAuditLog({
      adminUserId: admin.uid,
      action: "send_message",
      targetUserId: userId,
      details: { content: content.trim(), lang },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
