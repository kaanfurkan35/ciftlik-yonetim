import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { taskCreateSchema, taskFilterSchema } from "@/lib/validations/task";
import { createNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/tasks - Gorev listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = taskFilterSchema.safeParse({
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      assignedToId: searchParams.get("assignedToId") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { status, priority, assignedToId, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      farmId: session.user.farmId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: {
            select: { id: true, name: true, avatarUrl: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return apiSuccess(tasks, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Görev listesi hatası:", error);
    return apiError("Görevler yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/tasks - Yeni gorev olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "tasks");

    const body = await request.json();
    const parsed = taskCreateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz görev bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Atanan kullanicinin ayni ciftlikte oldugundan emin ol
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

    const task = await prisma.task.create({
      data: {
        ...data,
        farmId: session.user.farmId,
        createdById: session.user.id,
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

    // Görev atama bildirimi oluştur (fire-and-forget)
    if (data.assignedToId) {
      createNotification({
        farmId: session.user.farmId,
        userId: data.assignedToId,
        type: "TASK_ASSIGNED",
        title: "Yeni Görev",
        message: `Size yeni bir görev atandı: ${task.title}.`,
      });
    }

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "Task",
      entityId: task.id,
    });

    return apiSuccess(task);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Görev oluşturma hatası:", error);
    return apiError("Görev oluşturulurken bir hata oluştu", 500);
  }
}
