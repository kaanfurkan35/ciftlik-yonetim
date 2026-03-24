import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { animalGroupUpdateSchema } from "@/lib/validations/animal-group";

// ============================================================================
// GET /api/animal-groups/[id] - Tek hayvan grubu detayi
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

    const group = await prisma.animalGroup.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
      include: {
        currentAnimals: {
          where: { deletedAt: null },
          select: { id: true, name: true, earTagNumber: true, status: true },
        },
        _count: {
          select: { currentAnimals: true, grazingRecords: true, feedingRecords: true },
        },
      },
    });

    if (!group) {
      return apiError("Hayvan grubu bulunamadı", 404);
    }

    return apiSuccess(group);
  } catch (error) {
    console.error("Hayvan grubu detay hatasi:", error);
    return apiError("Hayvan grubu bilgileri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/animal-groups/[id] - Hayvan grubu guncelle
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

    const existing = await prisma.animalGroup.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Hayvan grubu bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = animalGroupUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz grup bilgileri: " + parsed.error.message, 400);
    }

    const group = await prisma.animalGroup.update({
      where: { id },
      data: parsed.data,
    });

    return apiSuccess(group);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Hayvan grubu güncelleme hatasi:", error);
    return apiError("Hayvan grubu güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/animal-groups/[id] - Hayvan grubu sil (soft delete)
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

    const existing = await prisma.animalGroup.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Hayvan grubu bulunamadı", 404);
    }

    await prisma.animalGroup.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Hayvan grubu başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Hayvan grubu silme hatasi:", error);
    return apiError("Hayvan grubu silinirken bir hata oluştu", 500);
  }
}
