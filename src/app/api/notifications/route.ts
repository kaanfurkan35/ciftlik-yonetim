import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/notifications - Bildirim listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || undefined;
    const isRead = searchParams.get("isRead");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId: session.user.id,
      farmId: session.user.farmId,
      deletedAt: null,
    };

    if (type) {
      where.type = type as Prisma.NotificationWhereInput["type"];
    }

    if (isRead === "true") {
      where.isRead = true;
    } else if (isRead === "false") {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isRead: "asc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          farmId: session.user.farmId,
          deletedAt: null,
          isRead: false,
        },
      }),
    ]);

    return apiSuccess(
      { notifications, unreadCount },
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    console.error("Bildirim listesi hatası:", error);
    return apiError("Bildirimler yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/notifications - Bildirimi okundu olarak isaretle
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          farmId: session.user.farmId,
          isRead: false,
          deletedAt: null,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return apiSuccess({ message: "Tüm bildirimler okundu olarak işaretlendi" });
    }

    if (!notificationId) {
      return apiError("Bildirim ID gereklidir", 400);
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!notification) {
      return apiError("Bildirim bulunamadı", 404);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Bildirim güncelleme hatası:", error);
    return apiError("Bildirim güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/notifications - Bildirim sil
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return apiError("Bildirim ID gereklidir", 400);
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!notification) {
      return apiError("Bildirim bulunamadı", 404);
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Bildirim başarıyla silindi" });
  } catch (error) {
    console.error("Bildirim silme hatası:", error);
    return apiError("Bildirim silinirken bir hata oluştu", 500);
  }
}
