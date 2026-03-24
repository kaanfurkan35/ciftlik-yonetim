import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { feedTypeUpdateSchema } from "@/lib/validations/feeding";

// ============================================================================
// GET /api/feeding/types/[id] - Tek yem turu detayi
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

    const feedType = await prisma.feedType.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
      include: {
        feedPurchases: {
          where: { deletedAt: null },
          orderBy: { date: "desc" },
          take: 10,
        },
        feedingRecords: {
          where: { deletedAt: null },
          orderBy: { date: "desc" },
          take: 10,
          include: {
            animal: { select: { id: true, name: true, earTagNumber: true } },
            group: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!feedType) {
      return apiError("Yem türü bulunamadı", 404);
    }

    return apiSuccess(feedType);
  } catch (error) {
    console.error("Yem turu detay hatasi:", error);
    return apiError("Yem türü bilgileri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/feeding/types/[id] - Yem turu guncelle
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

    const existing = await prisma.feedType.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Yem türü bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = feedTypeUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz yem türü bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Isim degistiyse benzersizlik kontrolu
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.feedType.findFirst({
        where: {
          name: { equals: data.name, mode: "insensitive" },
          farmId: session.user.farmId,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicate) {
        return apiError("Bu isimde bir yem türü zaten kayıtlı", 409);
      }
    }

    const feedType = await prisma.feedType.update({
      where: { id },
      data,
    });

    return apiSuccess(feedType);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Yem turu guncelleme hatasi:", error);
    return apiError("Yem türü güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/feeding/types/[id] - Yem turu sil (soft delete)
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

    const existing = await prisma.feedType.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Yem türü bulunamadı", 404);
    }

    await prisma.feedType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Yem türü başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Yem turu silme hatasi:", error);
    return apiError("Yem türü silinirken bir hata oluştu", 500);
  }
}
