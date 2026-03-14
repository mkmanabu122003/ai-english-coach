import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end query parameters are required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const snapshot = await db
      .collection("stats")
      .doc("daily")
      .collection("dates")
      .where("__name__", ">=", start)
      .where("__name__", "<=", end)
      .orderBy("__name__", "asc")
      .get();

    const results = snapshot.docs.map((doc) => ({
      date: doc.id,
      stats: doc.data(),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching stats range:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
