import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

function getCollectionName(lang: string): string {
  return lang === "es" ? "usersEs" : "users";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "en";

    const db = getAdminDb();
    const collectionName = getCollectionName(lang);

    // Fetch user document
    const userDoc = await db.collection(collectionName).doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = { id: userDoc.id, ...userDoc.data() };

    // Fetch recent chat logs (last 20)
    const chatLogsSnapshot = await db
      .collection(collectionName)
      .doc(userId)
      .collection("chatLogs")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const chatLogs = chatLogsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch weekly reports (last 10)
    const weeklyReportsSnapshot = await db
      .collection(collectionName)
      .doc(userId)
      .collection("weeklyReports")
      .orderBy("sentAt", "desc")
      .limit(10)
      .get();

    const weeklyReports = weeklyReportsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch admin actions for this user
    const adminActionsSnapshot = await db
      .collection("adminActions")
      .where("targetUserId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const adminActions = adminActionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      user,
      chatLogs,
      weeklyReports,
      adminActions,
    });
  } catch (error) {
    console.error("Error fetching user detail:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
