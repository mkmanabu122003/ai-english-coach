import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { recordAuditLog } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";

function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
}

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
    const { level, lang = "en" } = body;

    if (!level || !["beginner", "intermediate", "advanced"].includes(level)) {
      return NextResponse.json(
        { error: "Invalid level. Must be 'beginner', 'intermediate', or 'advanced'" },
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

    const userData = userDoc.data()!;
    const previousLevel = userData.englishLevel;

    // Update user level and append to levelHistory
    await userRef.update({
      englishLevel: level,
      levelHistory: FieldValue.arrayUnion({
        level,
        changedAt: FieldValue.serverTimestamp(),
        changedBy: admin.uid,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Record audit log
    await recordAuditLog({
      adminUserId: admin.uid,
      action: "level_change",
      targetUserId: userId,
      details: { from: previousLevel, to: level, lang },
    });

    // Return updated user
    const updatedDoc = await userRef.get();
    return NextResponse.json({
      user: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error updating user level:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
