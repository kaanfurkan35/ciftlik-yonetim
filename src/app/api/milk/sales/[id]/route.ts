import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { milkSaleUpdateSchema } from "@/lib/validations/milk";

// ============================================================================
// GET /api/milk/sales/[id] - Tek süt satışı detayı
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

    const sale = await prisma.milkSale.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!sale) {
      return apiError("Süt satışı bulunamadı", 404);
    }

    return apiSuccess(sale);
  } catch (error) {
    console.error("Süt satışı detay hatası:", error);
    return apiError("Süt satışı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/milk/sales/[id] - Süt satışı güncelle
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

    const existing = await prisma.milkSale.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Süt satışı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = milkSaleUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz süt satışı bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Toplam tutarı yeniden hesapla (miktar veya fiyat değiştiyse)
    const quantity = data.quantity ?? Number(existing.quantity);
    const pricePerLiter = data.pricePerLiter ?? Number(existing.pricePerLiter);
    const totalAmount = data.totalAmount ?? quantity * pricePerLiter;

    const sale = await prisma.milkSale.update({
      where: { id },
      data: {
        ...data,
        totalAmount,
      },
    });

    return apiSuccess(sale);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Süt satışı güncelleme hatası:", error);
    return apiError("Süt satışı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/milk/sales/[id] - Süt satışı sil (soft delete)
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

    const existing = await prisma.milkSale.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Süt satışı bulunamadı", 404);
    }

    await prisma.milkSale.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Süt satışı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Süt satışı silme hatası:", error);
    return apiError("Süt satışı silinirken bir hata oluştu", 500);
  }
}
