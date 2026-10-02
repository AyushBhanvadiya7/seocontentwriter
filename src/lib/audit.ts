import { db } from "@/db";
import { auditLogs } from "@/db/schema";

// Write one row to the admin audit log. Never throws:
// audit must not break the action it records.
export async function logAudit(entry: {
  adminId: number | null;
  adminEmail: string;
  action: string;
  targetType?: string | null;
  targetId?: number | null;
  details?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogs).values({
      adminId: entry.adminId,
      adminEmail: entry.adminEmail,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      details: entry.details ?? {},
    });
  } catch (error) {
    console.error("[audit:failed]", entry.action, error);
  }
}
