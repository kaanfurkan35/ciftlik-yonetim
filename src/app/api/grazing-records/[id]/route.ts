import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { grazingRecordUpdateSchema } from "@/lib/validations/grazing-record";

// ============================================================================
// GET /api/grazing-records/[id] - Tek otlatma kaydi detayi
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

    const record = await prisma.grazingRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        pasture: {
          farmId: session.user.farmId,
          deletedAt: null,
        },
      },
      include: {
        pasture: {
          select: { id: true, name: true, sizeDekar: true, capacity: true },
        },
        group: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!record) {
      return apiError("Otlatma kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Otlatma kaydı detay hatasi:", error);
    return apiError("Otlatma kaydı bilgileri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/grazing-records/[id] - Otlatma kaydi guncelle
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

    const existing = await prisma.grazingRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        pasture: {
          farmId: session.user.farmId,
          deletedAt: null,
        },
      },
    });

    if (!existing) {
      return apiError("Otlatma kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = grazingRecordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz otlatma bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    const checks: Promise<unknown>[] = [];
    const pastureChanged = data.pastureId && data.pastureId !== existing.pastureId;
    const groupChanged = data.groupId && data.groupId !== existing.groupId;

    if (pastureChanged) {
      checks.push(
        prisma.pasture.findFirst({
          where: { id: data.pastureId, farmId: session.user.farmId, deletedAt: null },
        })
      );
    }
    if (groupChanged) {
      checks.push(
        prisma.animalGroup.findFirst({
          where: { id: data.groupId, farmId: session.user.farmId, deletedAt: null },
        })
      );
    }

    if (checks.length > 0) {
      const results = await Promise.all(checks);
      let idx = 0;
      if (pastureChanged && !results[idx++]) {
        return apiError("Mera bulunamadı", 404);
      }
      if (groupChanged && !results[idx]) {
        return apiError("Hayvan grubu bulunamadı", 404);
      }
    }

    const record = await prisma.grazingRecord.update({
      where: { id },
      data,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Otlatma kaydı güncelleme hatasi:", error);
    return apiError("Otlatma kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/grazing-records/[id] - Otlatma kaydi sil (soft delete)
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

    const existing = await prisma.grazingRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        pasture: {
          farmId: session.user.farmId,
          deletedAt: null,
        },
      },
    });

    if (!existing) {
      return apiError("Otlatma kaydı bulunamadı", 404);
    }

    await prisma.grazingRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Otlatma kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Otlatma kaydı silme hatasi:", error);
    return apiError("Otlatma kaydı silinirken bir hata oluştu", 500);
  }
}
