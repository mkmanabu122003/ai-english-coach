import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

interface TokenEntry {
  date: string;
  promptTokens: { en: number; es: number };
  completionTokens: { en: number; es: number };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily";
    const start = searchParams.get("start");
    const end = searchParams.get("end") || getTodayJST();

    if (!start) {
      return NextResponse.json(
        { error: "start query parameter is required" },
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

    const dailyData: TokenEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        date: doc.id,
        promptTokens: {
          en: data.promptTokens?.en || 0,
          es: data.promptTokens?.es || 0,
        },
        completionTokens: {
          en: data.completionTokens?.en || 0,
          es: data.completionTokens?.es || 0,
        },
      };
    });

    if (period === "monthly") {
      const monthlyMap = new Map<
        string,
        {
          promptTokens: { en: number; es: number };
          completionTokens: { en: number; es: number };
        }
      >();

      for (const entry of dailyData) {
        const month = entry.date.slice(0, 7); // YYYY-MM
        const existing = monthlyMap.get(month) || {
          promptTokens: { en: 0, es: 0 },
          completionTokens: { en: 0, es: 0 },
        };

        existing.promptTokens.en += entry.promptTokens.en;
        existing.promptTokens.es += entry.promptTokens.es;
        existing.completionTokens.en += entry.completionTokens.en;
        existing.completionTokens.es += entry.completionTokens.es;

        monthlyMap.set(month, existing);
      }

      const monthlyData = Array.from(monthlyMap.entries()).map(
        ([month, tokens]) => ({
          month,
          ...tokens,
        })
      );

      return NextResponse.json(monthlyData);
    }

    return NextResponse.json(dailyData);
  } catch (error) {
    console.error("Error fetching token stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
