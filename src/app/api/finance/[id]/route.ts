import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { transactionUpdateSchema } from "@/lib/validations/finance";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/finance/[id] - Tek finansal islem detayi
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

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!transaction) {
      return apiError("Finansal işlem bulunamadı", 404);
    }

    return apiSuccess(transaction);
  } catch (error) {
    console.error("Finansal islem detay hatasi:", error);
    return apiError("Finansal işlem yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/finance/[id] - Finansal islem guncelle
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

    checkPermission(session.user.role, "update", "finance");

    const { id } = await params;

    // Islemin var oldugundan ve ayni ciftlige ait oldugundan emin ol
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Finansal işlem bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = transactionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz işlem bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Hayvan ID verilmisse, ayni ciftlige ait oldugundan emin ol
    if (data.animalId) {
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

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        invoiceUrl: data.invoiceUrl === "" ? null : data.invoiceUrl,
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "Transaction",
      entityId: transaction.id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(transaction);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Finansal islem guncelleme hatasi:", error);
    return apiError("Finansal işlem güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/finance/[id] - Finansal islem sil (soft delete)
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

    checkPermission(session.user.role, "delete", "finance");

    const { id } = await params;

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Finansal işlem bulunamadı", 404);
    }

    await prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "Transaction",
      entityId: id,
    });

    return apiSuccess({ message: "Finansal işlem başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Finansal islem silme hatasi:", error);
    return apiError("Finansal işlem silinirken bir hata oluştu", 500);
  }
}
