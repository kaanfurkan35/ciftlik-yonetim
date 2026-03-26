import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { weightRecordUpdateSchema } from "@/lib/validations/weight-record";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/weight-records/[id] - Tek tartim kaydi detayi
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

    const record = await prisma.weightRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: {
          farmId: session.user.farmId,
          deletedAt: null,
        },
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
      },
    });

    if (!record) {
      return apiError("Tartım kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Tartım kaydı detay hatasi:", error);
    return apiError("Tartım kaydı bilgileri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/weight-records/[id] - Tartim kaydi guncelle
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

    checkPermission(session.user.role, "update", "animals");

    const { id } = await params;

    const existing = await prisma.weightRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: {
          farmId: session.user.farmId,
          deletedAt: null,
        },
      },
    });

    if (!existing) {
      return apiError("Tartım kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = weightRecordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz tartım bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Eger animalId degistiyse, yeni hayvanin bu ciftlige ait oldugundan emin ol
    if (data.animalId && data.animalId !== existing.animalId) {
      const animal = await prisma.animal.findFirst({
        where: {
          id: data.animalId,
          farmId: session.user.farmId,
          deletedAt: null,
        },
      });

      if (!animal) {
        return apiError("Hayvan bulunamadı", 404);
      }
    }

    const record = await prisma.weightRecord.update({
      where: { id },
      data,
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "WeightRecord",
      entityId: record.id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Tartım kaydı güncelleme hatasi:", error);
    return apiError("Tartım kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/weight-records/[id] - Tartim kaydi sil (soft delete)
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

    checkPermission(session.user.role, "delete", "animals");

    const { id } = await params;

    const existing = await prisma.weightRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: {
          farmId: session.user.farmId,
          deletedAt: null,
        },
      },
    });

    if (!existing) {
      return apiError("Tartım kaydı bulunamadı", 404);
    }

    await prisma.weightRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "WeightRecord",
      entityId: id,
    });

    return apiSuccess({ message: "Tartım kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Tartım kaydı silme hatasi:", error);
    return apiError("Tartım kaydı silinirken bir hata oluştu", 500);
  }
}
