import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { feedTypeSchema, feedTypeFilterSchema } from "@/lib/validations/feeding";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/feeding/types - Yem turleri listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = feedTypeFilterSchema.safeParse({
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { search, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.FeedTypeWhereInput = {
      farmId: session.user.farmId,
      deletedAt: null,
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [feedTypes, total] = await Promise.all([
      prisma.feedType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              feedPurchases: true,
              feedingRecords: true,
            },
          },
        },
      }),
      prisma.feedType.count({ where }),
    ]);

    return apiSuccess(feedTypes, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Yem turleri listesi hatasi:", error);
    return apiError("Yem türleri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/feeding/types - Yeni yem turu olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "feeding");

    const body = await request.json();
    const parsed = feedTypeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz yem türü bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Ayni isimde yem turu var mi kontrol et
    const existing = await prisma.feedType.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" },
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (existing) {
      return apiError("Bu isimde bir yem türü zaten kayıtlı", 409);
    }

    const feedType = await prisma.feedType.create({
      data: {
        ...data,
        farmId: session.user.farmId,
        createdById: session.user.id,
      },
    });

    return apiSuccess(feedType);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Yem turu olusturma hatasi:", error);
    return apiError("Yem türü oluşturulurken bir hata oluştu", 500);
  }
}
