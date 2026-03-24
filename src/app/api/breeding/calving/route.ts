import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { calvingRecordSchema, breedingFilterSchema } from "@/lib/validations/breeding";
import { createNotification } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/breeding/calving - Dogum kayitlari listesi
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

    const where: Prisma.CalvingRecordWhereInput = {
      deletedAt: null,
      animal: { farmId: session.user.farmId },
    };

    if (animalId) {
      where.animalId = animalId;
    }

    const [records, total] = await Promise.all([
      prisma.calvingRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: sortOrder },
        include: {
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
          calf: {
            select: { id: true, name: true, earTagNumber: true, sex: true },
          },
          assistedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.calvingRecord.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Doğum kayıtları listesi hatası:", error);
    return apiError("Doğum kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/breeding/calving - Yeni dogum kaydi olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "breeding");

    const body = await request.json();
    const parsed = calvingRecordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz doğum bilgileri: " + parsed.error.message, 400);
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

    // Buzagi varsa kontrol et
    if (data.calfId) {
      const calf = await prisma.animal.findFirst({
        where: {
          id: data.calfId,
          farmId: session.user.farmId,
          deletedAt: null,
        },
      });

      if (!calf) {
        return apiError("Buzağı bulunamadı", 404);
      }
    }

    const record = await prisma.calvingRecord.create({
      data: {
        animalId: data.animalId,
        calfId: data.calfId,
        date: data.date,
        dystociaScore: data.dystociaScore,
        complications: data.complications,
        notes: data.notes,
        assistedById: session.user.id,
        createdById: session.user.id,
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        calf: {
          select: { id: true, name: true, earTagNumber: true, sex: true },
        },
      },
    });

    // Annenin durumunu LACTATING yap (dogum sonrasi)
    await prisma.animal.update({
      where: { id: data.animalId },
      data: { status: "LACTATING" },
    });

    // Doğum bildirimi oluştur (fire-and-forget)
    const animalName = record.animal.name || record.animal.earTagNumber;
    createNotification({
      farmId: session.user.farmId,
      type: "CALVING_EXPECTED",
      title: "Doğum Gerçekleşti",
      message: `${animalName} için doğum kaydı oluşturuldu.`,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Doğum kaydı oluşturma hatası:", error);
    return apiError("Doğum kaydı oluşturulurken bir hata oluştu", 500);
  }
}
