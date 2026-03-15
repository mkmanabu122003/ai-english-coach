import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { recordAuditLog } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";

function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function PUT(
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
    const { pushTime, lang = "en" } = body;

    if (!pushTime || !TIME_REGEX.test(pushTime)) {
      return NextResponse.json(
        { error: "Invalid pushTime. Must be in HH:MM format" },
        { status: 400 }
      );
    }

    if (!["en", "es"].includes(lang)) {
      return NextResponse.json(
        { error: "Invalid language" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const collectionName = getCollectionName(lang);
    const userRef = db.collection(collectionName).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousTime = userDoc.data()!.pushTime;

    await userRef.update({
      pushTime,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await recordAuditLog({
      adminUserId: admin.uid,
      action: "push_time_change",
      targetUserId: userId,
      details: { from: previousTime, to: pushTime, lang },
    });

    const updatedDoc = await userRef.get();
    return NextResponse.json({
      user: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error updating push time:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
