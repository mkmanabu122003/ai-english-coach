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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const type = searchParams.get("type"); // "text" | "voice" | null

    const db = getAdminDb();
    const collectionName = getCollectionName(lang);

    // Build query
    const chatLogsRef = db
      .collection(collectionName)
      .doc(userId)
      .collection("chatLogs");

    // Get total count
    let countQuery: FirebaseFirestore.Query = chatLogsRef;
    if (type) {
      countQuery = countQuery.where("type", "==", type);
    }
    const countSnapshot = await countQuery.count().get();
    const total = countSnapshot.data().count;

    // Get paginated results
    let query: FirebaseFirestore.Query = chatLogsRef.orderBy("createdAt", "desc");
    if (type) {
      query = query.where("type", "==", type);
    }

    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    const snapshot = await query.get();
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching chat logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
