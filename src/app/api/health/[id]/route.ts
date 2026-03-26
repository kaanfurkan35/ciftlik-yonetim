import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { healthRecordUpdateSchema } from "@/lib/validations/health";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/health/[id] - Saglik kaydi detayi
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { id } = await params;

    const record = await prisma.healthRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: {
          farmId: session.user.farmId,
        },
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
      },
    });

    if (!record) {
      return apiError("Sağlık kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Saglik kaydi detay hatasi:", error);
    return apiError("Sağlık kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/health/[id] - Saglik kaydi guncelle
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "update", "health");

    const { id } = await params;

    // Kaydin varligini ve ciftlik aidiyetini kontrol et
    const existing = await prisma.healthRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: {
          farmId: session.user.farmId,
        },
      },
    });

    if (!existing) {
      return apiError("Sağlık kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = healthRecordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz sağlık kaydı bilgileri: " + parsed.error.message, 400);
    }

    const record = await prisma.healthRecord.update({
      where: { id },
      data: parsed.data,
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "HealthRecord",
      entityId: record.id,
      changes: parsed.data as Record<string, unknown>,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Saglik kaydi guncelleme hatasi:", error);
    return apiError("Sağlık kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/health/[id] - Saglik kaydi sil (soft delete)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "delete", "health");

    const { id } = await params;

    // Kaydin varligini ve ciftlik aidiyetini kontrol et
    const existing = await prisma.healthRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: {
          farmId: session.user.farmId,
        },
      },
    });

    if (!existing) {
      return apiError("Sağlık kaydı bulunamadı", 404);
    }

    await prisma.healthRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "HealthRecord",
      entityId: id,
    });

    return apiSuccess({ message: "Sağlık kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Saglik kaydi silme hatasi:", error);
    return apiError("Sağlık kaydı silinirken bir hata oluştu", 500);
  }
}
