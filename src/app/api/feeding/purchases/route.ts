import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { feedPurchaseSchema, feedPurchaseFilterSchema } from "@/lib/validations/feeding";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/feeding/purchases - Yem satin alma kayitlari listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = feedPurchaseFilterSchema.safeParse({
      feedTypeId: searchParams.get("feedTypeId") || undefined,
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

    const { feedTypeId, dateFrom, dateTo, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.FeedPurchaseWhereInput = {
      deletedAt: null,
      feedType: {
        farmId: session.user.farmId,
      },
    };

    if (feedTypeId) {
      where.feedTypeId = feedTypeId;
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

    const [purchases, total] = await Promise.all([
      prisma.feedPurchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          feedType: {
            select: { id: true, name: true, unit: true },
          },
        },
      }),
      prisma.feedPurchase.count({ where }),
    ]);

    return apiSuccess(purchases, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Yem satin alma listesi hatasi:", error);
    return apiError("Satın alma kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/feeding/purchases - Yeni yem satin alma kaydi (stok otomatik artar)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "feeding");

    const body = await request.json();
    const parsed = feedPurchaseSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz satın alma bilgileri: " + parsed.error.message, 400);
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

    // Transaction ile satin alma kaydi olustur ve stoku guncelle
    const purchase = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.feedPurchase.create({
        data: {
          ...data,
          createdById: session.user.id,
        },
        include: {
          feedType: {
            select: { id: true, name: true, unit: true },
          },
        },
      });

      // Stoku artir
      await tx.feedType.update({
        where: { id: data.feedTypeId },
        data: {
          currentStock: {
            increment: data.quantity,
          },
        },
      });

      return newPurchase;
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "FeedPurchase",
      entityId: purchase.id,
    });

    return apiSuccess(purchase);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Yem satin alma olusturma hatasi:", error);
    return apiError("Satın alma kaydı oluşturulurken bir hata oluştu", 500);
  }
}
