import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { feedingRecordSchema, feedingRecordFilterSchema } from "@/lib/validations/feeding";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/feeding/records - Yemleme kayitlari listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = feedingRecordFilterSchema.safeParse({
      feedTypeId: searchParams.get("feedTypeId") || undefined,
      animalId: searchParams.get("animalId") || undefined,
      groupId: searchParams.get("groupId") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { feedTypeId, animalId, groupId, dateFrom, dateTo, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.FeedingRecordWhereInput = {
      deletedAt: null,
      feedType: {
        farmId: session.user.farmId,
      },
    };

    if (feedTypeId) {
      where.feedTypeId = feedTypeId;
    }

    if (animalId) {
      where.animalId = animalId;
    }

    if (groupId) {
      where.groupId = groupId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = dateFrom;
      }
      if (dateTo) {
        where.date.lte = dateTo;
      }
    }

    const [records, total] = await Promise.all([
      prisma.feedingRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          feedType: {
            select: { id: true, name: true, unit: true },
          },
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
          group: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.feedingRecord.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Yemleme kayitlari listesi hatasi:", error);
    return apiError("Yemleme kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/feeding/records - Yeni yemleme kaydi (stok otomatik azalir)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "feeding");

    const body = await request.json();
    const parsed = feedingRecordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz yemleme kaydı bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Yem turunun ayni ciftlige ait oldugunu kontrol et
    const feedType = await prisma.feedType.findFirst({
      where: {
        id: data.feedTypeId,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!feedType) {
      return apiError("Yem türü bulunamadı", 404);
    }

    // Stok yeterli mi kontrol et
    if (Number(feedType.currentStock) < data.quantity) {
      return apiError(
        `Yetersiz stok. Mevcut stok: ${feedType.currentStock} ${feedType.unit}, İstenen: ${data.quantity} ${feedType.unit}`,
        400
      );
    }

    // Hayvan kontrolu (varsa)
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

    // Grup kontrolu (varsa)
    if (data.groupId) {
      const group = await prisma.animalGroup.findFirst({
        where: {
          id: data.groupId,
          farmId: session.user.farmId,
          deletedAt: null,
        },
      });

      if (!group) {
        return apiError("Grup bulunamadı", 404);
      }
    }

    // Transaction ile yemleme kaydi olustur ve stoku azalt
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.feedingRecord.create({
        data: {
          ...data,
          createdById: session.user.id,
        },
        include: {
          feedType: {
            select: { id: true, name: true, unit: true },
          },
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
          group: {
            select: { id: true, name: true },
          },
        },
      });

      // Stoku azalt
      await tx.feedType.update({
        where: { id: data.feedTypeId },
        data: {
          currentStock: {
            decrement: data.quantity,
          },
        },
      });

      return newRecord;
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "FeedingRecord",
      entityId: record.id,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Yemleme kaydi olusturma hatasi:", error);
    return apiError("Yemleme kaydı oluşturulurken bir hata oluştu", 500);
  }
}
