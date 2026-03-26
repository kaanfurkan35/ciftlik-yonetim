import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { inseminationRecordSchema } from "@/lib/validations/breeding";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/breeding/insemination/[id] - Tek tohumlama kaydi
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

    const record = await prisma.inseminationRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        bull: {
          select: { id: true, name: true, earTagNumber: true },
        },
        pregnancyChecks: {
          where: { deletedAt: null },
          orderBy: { checkDate: "desc" },
        },
      },
    });

    if (!record) {
      return apiError("Tohumlama kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Tohumlama kaydı getirme hatası:", error);
    return apiError("Tohumlama kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/breeding/insemination/[id] - Tohumlama kaydi guncelle
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

    // Kaydin var oldugundan ve bu ciftlige ait oldugundan emin ol
    const existing = await prisma.inseminationRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
    });

    if (!existing) {
      return apiError("Tohumlama kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = inseminationRecordSchema.partial().safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz tohumlama bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    const record = await prisma.inseminationRecord.update({
      where: { id },
      data: {
        ...(data.animalId !== undefined && { animalId: data.animalId }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.bullId !== undefined && { bullId: data.bullId }),
        ...(data.semenBatchNumber !== undefined && { semenBatchNumber: data.semenBatchNumber }),
        ...(data.technicianName !== undefined && { technicianName: data.technicianName }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        bull: {
          select: { id: true, name: true, earTagNumber: true },
        },
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "InseminationRecord",
      entityId: record.id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Tohumlama kaydı güncelleme hatası:", error);
    return apiError("Tohumlama kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/breeding/insemination/[id] - Tohumlama kaydi sil (soft delete)
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

    const existing = await prisma.inseminationRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
    });

    if (!existing) {
      return apiError("Tohumlama kaydı bulunamadı", 404);
    }

    await prisma.inseminationRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "InseminationRecord",
      entityId: id,
    });

    return apiSuccess({ message: "Tohumlama kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Tohumlama kaydı silme hatası:", error);
    return apiError("Tohumlama kaydı silinirken bir hata oluştu", 500);
  }
}
