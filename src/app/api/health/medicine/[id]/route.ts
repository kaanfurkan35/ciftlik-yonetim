import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { medicineInventoryUpdateSchema } from "@/lib/validations/health";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/health/medicine/[id] - Tek ilac kaydi detayi
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

    const medicine = await prisma.medicineInventory.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!medicine) {
      return apiError("İlaç kaydı bulunamadı", 404);
    }

    return apiSuccess(medicine);
  } catch (error) {
    console.error("Ilac detay hatasi:", error);
    return apiError("İlaç kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/health/medicine/[id] - Ilac kaydi guncelle
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

    const existing = await prisma.medicineInventory.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("İlaç kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = medicineInventoryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz ilaç bilgileri: " + parsed.error.message, 400);
    }

    const medicine = await prisma.medicineInventory.update({
      where: { id },
      data: parsed.data,
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "MedicineInventory",
      entityId: medicine.id,
      changes: parsed.data as Record<string, unknown>,
    });

    return apiSuccess(medicine);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Ilac guncelleme hatasi:", error);
    return apiError("İlaç kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/health/medicine/[id] - Ilac kaydi sil (soft delete)
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

    const existing = await prisma.medicineInventory.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("İlaç kaydı bulunamadı", 404);
    }

    await prisma.medicineInventory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "MedicineInventory",
      entityId: id,
    });

    return apiSuccess({ message: "İlaç kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Ilac silme hatasi:", error);
    return apiError("İlaç kaydı silinirken bir hata oluştu", 500);
  }
}
