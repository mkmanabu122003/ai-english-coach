import { getAdminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface AuditLogEntry {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  details?: Record<string, unknown>;
}

export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  const db = getAdminDb();
  await db.collection("auditLogs").add({
    ...entry,
    createdAt: FieldValue.serverTimestamp(),
  });
}
