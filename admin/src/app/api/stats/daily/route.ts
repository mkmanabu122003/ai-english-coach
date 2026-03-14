import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayJST();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = db.collection("stats").doc("daily").collection("dates").doc(date);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ date, stats: null });
    }

    return NextResponse.json({ date, stats: doc.data() });
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
