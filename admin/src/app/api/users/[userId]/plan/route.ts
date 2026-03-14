import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { recordAuditLog } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";

function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
}

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
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
    const { plan, lang = "en" } = body;

    if (!plan || !["free", "bot_pro"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'free' or 'bot_pro'" },
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
    const previousPlan = userData.plan;

    if (previousPlan === plan) {
      return NextResponse.json(
        { error: "User is already on this plan" },
        { status: 400 }
      );
    }

    // Update user plan and append to planHistory
    await userRef.update({
      plan,
      planHistory: FieldValue.arrayUnion({
        plan,
        changedAt: FieldValue.serverTimestamp(),
        changedBy: admin.uid,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Record audit log
    await recordAuditLog({
      adminUserId: admin.uid,
      action: "plan_change",
      targetUserId: userId,
      details: { from: previousPlan, to: plan, lang },
    });

    // If free -> bot_pro, increment proConversions in daily stats
    if (previousPlan === "free" && plan === "bot_pro") {
      const today = getTodayJST();
      const statsRef = db.collection("stats").doc("daily").collection("dates").doc(today);
      const langField = lang === "es" ? "es" : "en";

      await statsRef.set(
        { proConversions: { [langField]: FieldValue.increment(1) } },
        { merge: true }
      );
    }

    // Return updated user
    const updatedDoc = await userRef.get();
    return NextResponse.json({
      user: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
