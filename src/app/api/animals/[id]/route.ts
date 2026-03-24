import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { animalUpdateSchema } from "@/lib/validations/animal";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// GET /api/animals/[id] - Tek hayvan detayi
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

    const animal = await prisma.animal.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
      include: {
        mother: {
          select: { id: true, name: true, earTagNumber: true },
        },
        father: {
          select: { id: true, name: true, earTagNumber: true },
        },
        currentGroup: {
          select: { id: true, name: true, type: true },
        },
        weightRecords: {
          orderBy: { date: "desc" },
          take: 10,
        },
        healthRecords: {
          orderBy: { date: "desc" },
          take: 5,
        },
        milkRecords: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!animal) {
      return apiError("Hayvan bulunamadı", 404);
    }

    return apiSuccess(animal);
  } catch (error) {
    console.error("Hayvan detay hatasi:", error);
    return apiError("Hayvan bilgileri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/animals/[id] - Hayvan guncelle
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

    checkPermission(session.user.role, "update", "animals");

    const { id } = await params;

    // Hayvanin var olup olmadigini kontrol et
    const existing = await prisma.animal.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Hayvan bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = animalUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz hayvan bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Kulak numarasi degistiyse benzersizlik kontrolu
    if (data.earTagNumber && data.earTagNumber !== existing.earTagNumber) {
      const duplicate = await prisma.animal.findFirst({
        where: {
          earTagNumber: data.earTagNumber,
          farmId: session.user.farmId,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicate) {
        return apiError("Bu kulak numarası zaten kayıtlı", 409);
      }
    }

    const animal = await prisma.animal.update({
      where: { id },
      data,
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "Animal",
      entityId: id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(animal);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Hayvan güncelleme hatasi:", error);
    return apiError("Hayvan güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/animals/[id] - Hayvan sil (soft delete)
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

    checkPermission(session.user.role, "delete", "animals");

    const { id } = await params;

    const existing = await prisma.animal.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Hayvan bulunamadı", 404);
    }

    await prisma.animal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "Animal",
      entityId: id,
    });

    return apiSuccess({ message: "Hayvan başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Hayvan silme hatasi:", error);
    return apiError("Hayvan silinirken bir hata oluştu", 500);
  }
}
