import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { pregnancyCheckSchema, breedingFilterSchema } from "@/lib/validations/breeding";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/breeding/pregnancy - Gebelik kontrolu kayitlari listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = breedingFilterSchema.safeParse({
      animalId: searchParams.get("animalId") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { animalId, page, limit, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.PregnancyCheckWhereInput = {
      deletedAt: null,
      animal: { farmId: session.user.farmId },
    };

    if (animalId) {
      where.animalId = animalId;
    }

    const [records, total] = await Promise.all([
      prisma.pregnancyCheck.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkDate: sortOrder },
        include: {
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
          insemination: {
            select: { id: true, date: true, type: true },
          },
          checkedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.pregnancyCheck.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Gebelik kontrolü kayıtları listesi hatası:", error);
    return apiError("Gebelik kontrolü kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/breeding/pregnancy - Yeni gebelik kontrolu kaydi olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "breeding");

    const body = await request.json();
    const parsed = pregnancyCheckSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz gebelik kontrolü bilgileri: " + parsed.error.message, 400);
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

    // Tohumlama kaydi varsa kontrol et
    if (data.inseminationId) {
      const insemination = await prisma.inseminationRecord.findFirst({
        where: {
          id: data.inseminationId,
          animalId: data.animalId,
          deletedAt: null,
        },
      });

      if (!insemination) {
        return apiError("Tohumlama kaydı bulunamadı", 404);
      }
    }

    // Transaction ile gebelik kontrolu kaydi olustur ve durumu guncelle
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.pregnancyCheck.create({
        data: {
          animalId: data.animalId,
          inseminationId: data.inseminationId,
          checkDate: data.checkDate,
          result: data.result,
          method: data.method,
          expectedCalvingDate: data.expectedCalvingDate,
          notes: data.notes,
          checkedById: session.user.id,
          createdById: session.user.id,
        },
        include: {
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
        },
      });

      // Sonuc pozitifse hayvanin durumunu PREGNANT yap
      if (data.result === "POSITIVE") {
        await tx.animal.update({
          where: { id: data.animalId },
          data: { status: "PREGNANT" },
        });
      }

      return newRecord;
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "PregnancyCheck",
      entityId: record.id,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Gebelik kontrolü kaydı oluşturma hatası:", error);
    return apiError("Gebelik kontrolü kaydı oluşturulurken bir hata oluştu", 500);
  }
}
