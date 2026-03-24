import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { vaccinationRecordSchema, vaccinationRecordFilterSchema } from "@/lib/validations/health";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/vaccinations - Asilama kayitlari listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "read", "health");

    const { searchParams } = request.nextUrl;
    const parsed = vaccinationRecordFilterSchema.safeParse({
      animalId: searchParams.get("animalId") || undefined,
      overdue: searchParams.get("overdue") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { animalId, overdue, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.VaccinationRecordWhereInput = {
      deletedAt: null,
      animal: {
        farmId: session.user.farmId,
      },
    };

    if (animalId) {
      where.animalId = animalId;
    }

    if (overdue) {
      where.nextDueDate = {
        lt: new Date(),
      };
    }

    const [records, total] = await Promise.all([
      prisma.vaccinationRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
          vaccinationType: {
            select: { id: true, name: true, intervalDays: true },
          },
        },
      }),
      prisma.vaccinationRecord.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Asilama kayitlari listesi hatasi:", error);
    return apiError("Aşı kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/vaccinations - Yeni asilama kaydi olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "health");

    const body = await request.json();
    const parsed = vaccinationRecordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz aşı kaydı bilgileri: " + parsed.error.message, 400);
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

    // Asi turunu kontrol et
    const vaccinationType = await prisma.vaccinationType.findFirst({
      where: {
        id: data.vaccinationTypeId,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!vaccinationType) {
      return apiError("Aşı türü bulunamadı", 404);
    }

    // Sonraki asi tarihi otomatik hesapla (eger belirtilmemisse)
    const nextDueDate = data.nextDueDate
      ? data.nextDueDate
      : new Date(
          new Date(data.date).getTime() +
            vaccinationType.intervalDays * 24 * 60 * 60 * 1000
        );

    const record = await prisma.vaccinationRecord.create({
      data: {
        animalId: data.animalId,
        vaccinationTypeId: data.vaccinationTypeId,
        date: data.date,
        nextDueDate,
        batchNumber: data.batchNumber,
        cost: data.cost,
        notes: data.notes,
        administeredById: session.user.id,
        createdById: session.user.id,
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        vaccinationType: {
          select: { id: true, name: true, intervalDays: true },
        },
      },
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Asilama kaydi olusturma hatasi:", error);
    return apiError("Aşı kaydı oluşturulurken bir hata oluştu", 500);
  }
}
