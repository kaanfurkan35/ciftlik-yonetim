import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { calvingRecordSchema } from "@/lib/validations/breeding";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/breeding/calving/[id] - Tek dogum kaydi
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

    const record = await prisma.calvingRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        calf: {
          select: { id: true, name: true, earTagNumber: true, sex: true },
        },
        assistedBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!record) {
      return apiError("Doğum kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Doğum kaydı getirme hatası:", error);
    return apiError("Doğum kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/breeding/calving/[id] - Dogum kaydi guncelle
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

    const existing = await prisma.calvingRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
    });

    if (!existing) {
      return apiError("Doğum kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = calvingRecordSchema.partial().safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz doğum bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    const record = await prisma.calvingRecord.update({
      where: { id },
      data: {
        ...(data.date !== undefined && { date: data.date }),
        ...(data.calfId !== undefined && { calfId: data.calfId }),
        ...(data.dystociaScore !== undefined && { dystociaScore: data.dystociaScore }),
        ...(data.complications !== undefined && { complications: data.complications }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        calf: {
          select: { id: true, name: true, earTagNumber: true, sex: true },
        },
        assistedBy: {
          select: { id: true, name: true },
        },
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "CalvingRecord",
      entityId: record.id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Doğum kaydı güncelleme hatası:", error);
    return apiError("Doğum kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/breeding/calving/[id] - Dogum kaydi sil (soft delete)
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

    const existing = await prisma.calvingRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
    });

    if (!existing) {
      return apiError("Doğum kaydı bulunamadı", 404);
    }

    await prisma.calvingRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "CalvingRecord",
      entityId: id,
    });

    return apiSuccess({ message: "Doğum kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Doğum kaydı silme hatası:", error);
    return apiError("Doğum kaydı silinirken bir hata oluştu", 500);
  }
}
