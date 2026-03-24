import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { taskUpdateSchema } from "@/lib/validations/task";

// ============================================================================
// GET /api/tasks/[id] - Tek gorev detayi
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

    const task = await prisma.task.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      return apiError("Görev bulunamadı", 404);
    }

    return apiSuccess(task);
  } catch (error) {
    console.error("Görev detay hatası:", error);
    return apiError("Görev bilgileri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/tasks/[id] - Gorev guncelle
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

    checkPermission(session.user.role, "update", "tasks");

    const { id } = await params;

    const existing = await prisma.task.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Görev bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = taskUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz görev bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Durum COMPLETED olarak degisiyorsa completedAt'i ayarla
    if (data.status === "COMPLETED" && existing.status !== "COMPLETED") {
      (data as Record<string, unknown>).completedAt = new Date();
    } else if (data.status && data.status !== "COMPLETED") {
      (data as Record<string, unknown>).completedAt = null;
    }

    // Atanan kullanici degistiyse kontrol et
    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: data.assignedToId,
          farmId: session.user.farmId,
          deletedAt: null,
        },
      });

      if (!assignedUser) {
        return apiError("Atanan kullanıcı bulunamadı", 404);
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: { id: true, name: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Görev güncelleme hatası:", error);
    return apiError("Görev güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/tasks/[id] - Gorev sil (soft delete)
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

    checkPermission(session.user.role, "delete", "tasks");

    const { id } = await params;

    const existing = await prisma.task.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Görev bulunamadı", 404);
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Görev başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Görev silme hatası:", error);
    return apiError("Görev silinirken bir hata oluştu", 500);
  }
}
