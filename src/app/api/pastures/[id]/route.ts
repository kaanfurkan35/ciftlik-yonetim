import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { pastureUpdateSchema } from "@/lib/validations/pasture";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/pastures/[id] - Tek mera detayi
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

    const pasture = await prisma.pasture.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        grazingRecords: {
          orderBy: { startDate: "desc" },
          take: 10,
          include: {
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!pasture) {
      return apiError("Mera bulunamadı", 404);
    }

    return apiSuccess(pasture);
  } catch (error) {
    console.error("Mera detay hatası:", error);
    return apiError("Mera bilgileri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/pastures/[id] - Mera guncelle
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

    checkPermission(session.user.role, "update", "pastures");

    const { id } = await params;

    const existing = await prisma.pasture.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Mera bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = pastureUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz mera bilgileri: " + parsed.error.message, 400);
    }

    const pasture = await prisma.pasture.update({
      where: { id },
      data: parsed.data,
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "Pasture",
      entityId: pasture.id,
      changes: parsed.data as Record<string, unknown>,
    });

    return apiSuccess(pasture);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Mera güncelleme hatası:", error);
    return apiError("Mera güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/pastures/[id] - Mera sil (soft delete)
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

    checkPermission(session.user.role, "delete", "pastures");

    const { id } = await params;

    const existing = await prisma.pasture.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Mera bulunamadı", 404);
    }

    await prisma.pasture.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "Pasture",
      entityId: id,
    });

    return apiSuccess({ message: "Mera başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Mera silme hatası:", error);
    return apiError("Mera silinirken bir hata oluştu", 500);
  }
}
