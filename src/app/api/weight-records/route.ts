import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { weightRecordCreateSchema, weightRecordFilterSchema } from "@/lib/validations/weight-record";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/weight-records - Tartim kayitlari listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = weightRecordFilterSchema.safeParse({
      animalId: searchParams.get("animalId") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { animalId, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.WeightRecordWhereInput = {
      deletedAt: null,
      animal: {
        farmId: session.user.farmId,
        deletedAt: null,
      },
    };

    if (animalId) {
      where.animalId = animalId;
    }

    const [records, total] = await Promise.all([
      prisma.weightRecord.findMany({
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
      prisma.weightRecord.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Tartım kayıtları listesi hatasi:", error);
    return apiError("Tartım kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/weight-records - Yeni tartim kaydi olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "animals");

    const body = await request.json();
    const parsed = weightRecordCreateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz tartım bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Hayvanin bu ciftlige ait oldugundan emin ol
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

    const record = await prisma.weightRecord.create({
      data: {
        ...data,
        createdById: session.user.id,
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "WeightRecord",
      entityId: record.id,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Tartım kaydı oluşturma hatasi:", error);
    return apiError("Tartım kaydı oluşturulurken bir hata oluştu", 500);
  }
}
