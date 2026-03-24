import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { pregnancyCheckSchema } from "@/lib/validations/breeding";

// ============================================================================
// GET /api/breeding/pregnancy/[id] - Tek gebelik kontrolu kaydi
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

    const record = await prisma.pregnancyCheck.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        insemination: {
          select: { id: true, date: true, type: true },
        },
        checkedBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!record) {
      return apiError("Gebelik kontrolü kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Gebelik kontrolü kaydı getirme hatası:", error);
    return apiError("Gebelik kontrolü kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/breeding/pregnancy/[id] - Gebelik kontrolu kaydi guncelle
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

    const existing = await prisma.pregnancyCheck.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
    });

    if (!existing) {
      return apiError("Gebelik kontrolü kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = pregnancyCheckSchema.partial().safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz gebelik kontrolü bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    const record = await prisma.pregnancyCheck.update({
      where: { id },
      data: {
        ...(data.checkDate !== undefined && { checkDate: data.checkDate }),
        ...(data.result !== undefined && { result: data.result }),
        ...(data.method !== undefined && { method: data.method }),
        ...(data.expectedCalvingDate !== undefined && { expectedCalvingDate: data.expectedCalvingDate }),
        ...(data.inseminationId !== undefined && { inseminationId: data.inseminationId }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        insemination: {
          select: { id: true, date: true, type: true },
        },
        checkedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Gebelik kontrolü kaydı güncelleme hatası:", error);
    return apiError("Gebelik kontrolü kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/breeding/pregnancy/[id] - Gebelik kontrolu kaydi sil (soft delete)
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

    const existing = await prisma.pregnancyCheck.findFirst({
      where: {
        id,
        deletedAt: null,
        animal: { farmId: session.user.farmId },
      },
    });

    if (!existing) {
      return apiError("Gebelik kontrolü kaydı bulunamadı", 404);
    }

    await prisma.pregnancyCheck.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Gebelik kontrolü kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Gebelik kontrolü kaydı silme hatası:", error);
    return apiError("Gebelik kontrolü kaydı silinirken bir hata oluştu", 500);
  }
}
