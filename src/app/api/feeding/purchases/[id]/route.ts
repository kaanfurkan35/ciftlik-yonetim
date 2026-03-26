import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { feedPurchaseUpdateSchema } from "@/lib/validations/feeding";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/feeding/purchases/[id] - Tek yem satin alma kaydi detayi
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

    const purchase = await prisma.feedPurchase.findFirst({
      where: {
        id,
        deletedAt: null,
        feedType: {
          farmId: session.user.farmId,
        },
      },
      include: {
        feedType: {
          select: { id: true, name: true, unit: true },
        },
      },
    });

    if (!purchase) {
      return apiError("Satın alma kaydı bulunamadı", 404);
    }

    return apiSuccess(purchase);
  } catch (error) {
    console.error("Yem satin alma detay hatasi:", error);
    return apiError("Satın alma kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/feeding/purchases/[id] - Yem satin alma kaydi guncelle
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

    checkPermission(session.user.role, "update", "feeding");

    const { id } = await params;

    const existing = await prisma.feedPurchase.findFirst({
      where: {
        id,
        deletedAt: null,
        feedType: {
          farmId: session.user.farmId,
        },
      },
    });

    if (!existing) {
      return apiError("Satın alma kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = feedPurchaseUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz satın alma bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Yem turu degisiyorsa yeni turun ayni ciftlige ait oldugunu kontrol et
    if (data.feedTypeId && data.feedTypeId !== existing.feedTypeId) {
      const feedType = await prisma.feedType.findFirst({
        where: {
          id: data.feedTypeId,
          farmId: session.user.farmId,
          deletedAt: null,
        },
      });

      if (!feedType) {
        return apiError("Yem türü bulunamadı", 404);
      }
    }

    const quantityChanged = data.quantity !== undefined && Number(data.quantity) !== Number(existing.quantity);
    const feedTypeChanged = data.feedTypeId !== undefined && data.feedTypeId !== existing.feedTypeId;

    // Miktar veya tur degistiyse transaction ile stok ayarla
    if (quantityChanged || feedTypeChanged) {
      const purchase = await prisma.$transaction(async (tx) => {
        // Eski yem turunun stogundan eski miktari cikar
        await tx.feedType.update({
          where: { id: existing.feedTypeId },
          data: {
            currentStock: { decrement: Number(existing.quantity) },
          },
        });

        // Yeni yem turune yeni miktari ekle
        const targetFeedTypeId = data.feedTypeId || existing.feedTypeId;
        const newQuantity = data.quantity !== undefined ? Number(data.quantity) : Number(existing.quantity);

        await tx.feedType.update({
          where: { id: targetFeedTypeId },
          data: {
            currentStock: { increment: newQuantity },
          },
        });

        return tx.feedPurchase.update({
          where: { id },
          data,
          include: {
            feedType: {
              select: { id: true, name: true, unit: true },
            },
          },
        });
      });

      createAuditLog({
        userId: session.user.id,
        farmId: session.user.farmId,
        action: "UPDATE",
        entityType: "FeedPurchase",
        entityId: purchase.id,
        changes: data as Record<string, unknown>,
      });

      return apiSuccess(purchase);
    }

    const purchase = await prisma.feedPurchase.update({
      where: { id },
      data,
      include: {
        feedType: {
          select: { id: true, name: true, unit: true },
        },
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "FeedPurchase",
      entityId: purchase.id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(purchase);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Yem satin alma guncelleme hatasi:", error);
    return apiError("Satın alma kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/feeding/purchases/[id] - Yem satin alma kaydi sil (soft delete)
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

    checkPermission(session.user.role, "delete", "feeding");

    const { id } = await params;

    const existing = await prisma.feedPurchase.findFirst({
      where: {
        id,
        deletedAt: null,
        feedType: {
          farmId: session.user.farmId,
        },
      },
    });

    if (!existing) {
      return apiError("Satın alma kaydı bulunamadı", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.feedPurchase.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.feedType.update({
        where: { id: existing.feedTypeId },
        data: {
          currentStock: { decrement: Number(existing.quantity) },
        },
      });
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "FeedPurchase",
      entityId: id,
    });

    return apiSuccess({ message: "Satın alma kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Yem satin alma silme hatasi:", error);
    return apiError("Satın alma kaydı silinirken bir hata oluştu", 500);
  }
}
