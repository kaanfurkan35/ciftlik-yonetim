import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { healthRecordSchema, healthRecordFilterSchema } from "@/lib/validations/health";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/health - Saglik kayitlari listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = healthRecordFilterSchema.safeParse({
      animalId: searchParams.get("animalId") || undefined,
      type: searchParams.get("type") || undefined,
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

    const { animalId, type, dateFrom, dateTo, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.HealthRecordWhereInput = {
      deletedAt: null,
      animal: {
        farmId: session.user.farmId,
      },
    };

    if (animalId) {
      where.animalId = animalId;
    }

    if (type) {
      where.type = type;
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
      prisma.healthRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
        },
      }),
      prisma.healthRecord.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Saglik kayitlari listesi hatasi:", error);
    return apiError("Sağlık kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/health - Yeni saglik kaydi olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "health");

    const body = await request.json();
    const parsed = healthRecordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz sağlık kaydı bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Hayvanin ayni ciftlige ait oldugundan emin ol
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

    const record = await prisma.healthRecord.create({
      data: {
        ...data,
        createdById: session.user.id,
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
      },
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Saglik kaydi olusturma hatasi:", error);
    return apiError("Sağlık kaydı oluşturulurken bir hata oluştu", 500);
  }
}
