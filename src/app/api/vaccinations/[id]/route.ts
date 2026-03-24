import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { vaccinationRecordUpdateSchema } from "@/lib/validations/health";

// ============================================================================
// GET /api/vaccinations/[id] - Asilama kaydi detayi
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

    const record = await prisma.vaccinationRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: {
          farmId: session.user.farmId,
        },
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        vaccinationType: {
          select: { id: true, name: true, intervalDays: true, description: true },
        },
      },
    });

    if (!record) {
      return apiError("Aşı kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Asilama kaydi detay hatasi:", error);
    return apiError("Aşı kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/vaccinations/[id] - Asilama kaydi guncelle
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

    // Kaydin varligini ve ciftlik aidiyetini kontrol et
    const existing = await prisma.vaccinationRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: {
          farmId: session.user.farmId,
        },
      },
    });

    if (!existing) {
      return apiError("Aşı kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = vaccinationRecordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz aşı kaydı bilgileri: " + parsed.error.message, 400);
    }

    const record = await prisma.vaccinationRecord.update({
      where: { id },
      data: parsed.data,
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        vaccinationType: {
          select: { id: true, name: true, intervalDays: true },
        },
      },
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Asilama kaydi guncelleme hatasi:", error);
    return apiError("Aşı kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/vaccinations/[id] - Asilama kaydi sil (soft delete)
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

    // Kaydin varligini ve ciftlik aidiyetini kontrol et
    const existing = await prisma.vaccinationRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: {
          farmId: session.user.farmId,
        },
      },
    });

    if (!existing) {
      return apiError("Aşı kaydı bulunamadı", 404);
    }

    await prisma.vaccinationRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Aşı kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Asilama kaydi silme hatasi:", error);
    return apiError("Aşı kaydı silinirken bir hata oluştu", 500);
  }
}
