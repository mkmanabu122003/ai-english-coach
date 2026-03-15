import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { recordAuditLog } from "@/lib/audit";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

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
    const updatedUser = await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);

      if (!userDoc.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      const userData = userDoc.data()!;
      const previousPlan = userData.plan;

      if (previousPlan === plan) {
        throw new Error("ALREADY_ON_PLAN");
      }

      tx.update(userRef, {
        plan,
        planHistory: FieldValue.arrayUnion({
          plan,
          changedAt: Timestamp.now(),
          changedBy: admin.uid,
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // If free -> bot_pro, increment proConversions in daily stats
      if (previousPlan === "free" && plan === "bot_pro") {
        const today = getTodayJST();
        const statsRef = db.collection("stats").doc("daily").collection("dates").doc(today);
        const langField = lang === "es" ? "es" : "en";

        tx.set(
          statsRef,
          { proConversions: { [langField]: FieldValue.increment(1) } },
          { merge: true }
        );
      }

      return { previousPlan };
    });

    // Record audit log (outside transaction — non-critical)
    await recordAuditLog({
      adminUserId: admin.uid,
      action: "plan_change",
      targetUserId: userId,
      details: { from: updatedUser.previousPlan, to: plan, lang },
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
      if (error.message === "ALREADY_ON_PLAN") {
        return NextResponse.json({ error: "User is already on this plan" }, { status: 400 });
      }
    }
    console.error("Error updating user plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
