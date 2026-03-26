import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { heatRecordSchema } from "@/lib/validations/breeding";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/breeding/heat/[id] - Tek kizginlik kaydi
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { id } = await params;

    const record = await prisma.heatRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        observedBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!record) {
      return apiError("Kızgınlık kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Kızgınlık kaydı getirme hatası:", error);
    return apiError("Kızgınlık kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/breeding/heat/[id] - Kizginlik kaydi guncelle
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

    checkPermission(session.user.role, "update", "breeding");

    const { id } = await params;

    const existing = await prisma.heatRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
    });

    if (!existing) {
      return apiError("Kızgınlık kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = heatRecordSchema.partial().safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz kızgınlık bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    const record = await prisma.heatRecord.update({
      where: { id },
      data: {
        ...(data.date !== undefined && { date: data.date }),
        ...(data.intensity !== undefined && { intensity: data.intensity }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        observedBy: {
          select: { id: true, name: true },
        },
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "HeatRecord",
      entityId: record.id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Kızgınlık kaydı güncelleme hatası:", error);
    return apiError("Kızgınlık kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/breeding/heat/[id] - Kizginlik kaydi sil (soft delete)
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "delete", "breeding");

    const { id } = await params;

    const existing = await prisma.heatRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
    });

    if (!existing) {
      return apiError("Kızgınlık kaydı bulunamadı", 404);
    }

    await prisma.heatRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "HeatRecord",
      entityId: id,
    });

    return apiSuccess({ message: "Kızgınlık kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Kızgınlık kaydı silme hatası:", error);
    return apiError("Kızgınlık kaydı silinirken bir hata oluştu", 500);
  }
}
