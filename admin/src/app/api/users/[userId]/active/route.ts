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
    const { isActive, lang = "en" } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid isActive value. Must be a boolean" },
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

    await userRef.update({
      isActive,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await recordAuditLog({
      adminUserId: admin.uid,
      action: "toggle_active",
      targetUserId: userId,
      details: { isActive, lang },
    });

    const updatedDoc = await userRef.get();
    return NextResponse.json({
      user: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error updating user active status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
