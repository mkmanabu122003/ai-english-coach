import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrInstructor } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { recordAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "en";

    const db = getAdminDb();
    const snapshot = await db
      .collection("nudgeMessages")
      .where("language", "==", lang)
      .get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nudges: any[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(nudges);
  } catch (error) {
    console.error("Error fetching nudges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let sessionUser;
  try {
    sessionUser = await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, text, language } = body;

    if (!type || !text || !language) {
      return NextResponse.json(
        { error: "type, text, and language are required" },
        { status: 400 }
      );
    }

    const validTypes = ["gentle_nudge", "strong_nudge", "streak_boost"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = await db.collection("nudgeMessages").add({
      type,
      text,
      language,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await recordAuditLog({
      adminUserId: sessionUser.uid,
      action: "nudge_create",
      details: { nudgeId: docRef.id, type, language },
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating nudge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  let sessionUser;
  try {
    sessionUser = await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, type, text, language, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (type !== undefined) updateData.type = type;
    if (text !== undefined) updateData.text = text;
    if (language !== undefined) updateData.language = language;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.collection("nudgeMessages").doc(id).update(updateData);

    await recordAuditLog({
      adminUserId: sessionUser.uid,
      action: "nudge_update",
      details: { nudgeId: id, ...updateData },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating nudge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  let sessionUser;
  try {
    sessionUser = await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    // Soft delete: set isActive to false
    await db.collection("nudgeMessages").doc(id).update({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await recordAuditLog({
      adminUserId: sessionUser.uid,
      action: "nudge_delete",
      details: { nudgeId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting nudge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
