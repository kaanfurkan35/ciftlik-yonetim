import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { pastureCreateSchema, pastureFilterSchema } from "@/lib/validations/pasture";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/pastures - Mera listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = pastureFilterSchema.safeParse({
      condition: searchParams.get("condition") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { condition, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.PastureWhereInput = {
      farmId: session.user.farmId,
      deletedAt: null,
    };

    if (condition) {
      where.condition = condition;
    }

    const [pastures, total] = await Promise.all([
      prisma.pasture.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: { grazingRecords: true },
          },
        },
      }),
      prisma.pasture.count({ where }),
    ]);

    return apiSuccess(pastures, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Mera listesi hatası:", error);
    return apiError("Meralar yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/pastures - Yeni mera olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "pastures");

    const body = await request.json();
    const parsed = pastureCreateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz mera bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    const pasture = await prisma.pasture.create({
      data: {
        ...data,
        farmId: session.user.farmId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "Pasture",
      entityId: pasture.id,
    });

    return apiSuccess(pasture);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Mera oluşturma hatası:", error);
    return apiError("Mera oluşturulurken bir hata oluştu", 500);
  }
}
