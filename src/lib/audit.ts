import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Denetim kaydı oluşturur (fire-and-forget).
 * Ana işlemi asla bloke etmez.
 */
export function createAuditLog(params: {
  userId: string;
  farmId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT" | "BACKUP";
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
}): void {
  prisma.auditLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: params.changes as Prisma.InputJsonValue | undefined,
      },
    })
    .catch(console.error);
}
