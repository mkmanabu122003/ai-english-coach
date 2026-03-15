import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { applyBroadcastFilters, getCollectionName, type BroadcastFilters } from "@/lib/broadcast-filters";

export async function POST(request: NextRequest) {
  try {
    await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filters = {} } = body as { filters: BroadcastFilters };

    const lang = filters.lang || "en";
    const db = getAdminDb();
    const collectionName = getCollectionName(lang);

    const snapshot = await db.collection(collectionName).get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allUsers: any[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const matchingUsers = applyBroadcastFilters(allUsers, filters);

    // lineUserIdがないユーザーは実際には送信できないため除外して正確な件数を返す
    const sendableUsers = matchingUsers.filter((u) => !!u.lineUserId);

    return NextResponse.json({
      count: sendableUsers.length,
      totalMatched: matchingUsers.length,
      noLineUserId: matchingUsers.length - sendableUsers.length,
    });
  } catch (error) {
    console.error("Error previewing broadcast:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
