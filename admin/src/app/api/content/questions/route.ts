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
    const category = searchParams.get("category");
    const level = searchParams.get("level");

    const db = getAdminDb();
    let query = db.collection("questions").where("language", "==", lang);

    if (category) {
      query = query.where("category", "==", category);
    }
    if (level) {
      query = query.where("level", "==", level);
    }

    const snapshot = await query.get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questions: any[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
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
    const { category, level, question, language } = body;

    if (!category || !level || !question || !language) {
      return NextResponse.json(
        { error: "category, level, question, and language are required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = await db.collection("questions").add({
      category,
      level,
      question,
      language,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await recordAuditLog({
      adminUserId: sessionUser.uid,
      action: "question_create",
      details: { questionId: docRef.id, category, level, language },
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
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
    const { id, category, level, question, language, isActive } = body;

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

    if (category !== undefined) updateData.category = category;
    if (level !== undefined) updateData.level = level;
    if (question !== undefined) updateData.question = question;
    if (language !== undefined) updateData.language = language;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.collection("questions").doc(id).update(updateData);

    await recordAuditLog({
      adminUserId: sessionUser.uid,
      action: "question_update",
      details: { questionId: id, ...updateData },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating question:", error);
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
    await db.collection("questions").doc(id).update({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await recordAuditLog({
      adminUserId: sessionUser.uid,
      action: "question_delete",
      details: { questionId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
