import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { milkRecordUpdateSchema } from "@/lib/validations/milk";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/milk/[id] - Tek süt kaydı detayı
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

    const record = await prisma.milkRecord.findFirst({
      where: {
        id,
        animal: { farmId: session.user.farmId },
        deletedAt: null,
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
      },
    });

    if (!record) {
      return apiError("Süt kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Süt kaydı detay hatası:", error);
    return apiError("Süt kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/milk/[id] - Süt kaydı güncelle
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

    checkPermission(session.user.role, "update", "milk");

    const { id } = await params;

    const existing = await prisma.milkRecord.findFirst({
      where: {
        id,
        animal: { farmId: session.user.farmId },
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Süt kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = milkRecordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz süt kaydı bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Hayvan değiştiriliyorsa aynı çiftliğe ait olduğunu kontrol et
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

    const record = await prisma.milkRecord.update({
      where: { id },
      data,
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
      entityType: "MilkRecord",
      entityId: record.id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Süt kaydı güncelleme hatası:", error);
    return apiError("Süt kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/milk/[id] - Süt kaydı sil (soft delete)
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

    checkPermission(session.user.role, "delete", "milk");

    const { id } = await params;

    const existing = await prisma.milkRecord.findFirst({
      where: {
        id,
        animal: { farmId: session.user.farmId },
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Süt kaydı bulunamadı", 404);
    }

    await prisma.milkRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "MilkRecord",
      entityId: id,
    });

    return apiSuccess({ message: "Süt kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Süt kaydı silme hatası:", error);
    return apiError("Süt kaydı silinirken bir hata oluştu", 500);
  }
}
