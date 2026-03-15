import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { recordAuditLog } from "@/lib/audit";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

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

    if (!["en", "es"].includes(lang)) {
      return NextResponse.json(
        { error: "Invalid language" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const collectionName = getCollectionName(lang);
    const userRef = db.collection(collectionName).doc(userId);

    // Use transaction for atomic read-then-write
    const result = await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);

      if (!userDoc.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      const userData = userDoc.data()!;
      const previousLevel = userData.englishLevel;

      tx.update(userRef, {
        englishLevel: level,
        levelHistory: FieldValue.arrayUnion({
          level,
          changedAt: Timestamp.now(),
          changedBy: admin.uid,
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { previousLevel };
    });

    // Record audit log (outside transaction — non-critical)
    await recordAuditLog({
      adminUserId: admin.uid,
      action: "level_change",
      targetUserId: userId,
      details: { from: result.previousLevel, to: level, lang },
    });

    // Return updated user
    const updatedDoc = await userRef.get();
    return NextResponse.json({
      user: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }
    console.error("Error updating user level:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
