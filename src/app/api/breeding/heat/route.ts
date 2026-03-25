import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { heatRecordSchema, breedingFilterSchema } from "@/lib/validations/breeding";
import { createNotification } from "@/lib/notifications";
import { HEAT_INTENSITY_LABELS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/breeding/heat - Kizginlik kayitlari listesi
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

    const where: Prisma.HeatRecordWhereInput = {
      deletedAt: null,
      animal: { farmId: session.user.farmId },
    };

    if (animalId) {
      where.animalId = animalId;
    }

    const [records, total] = await Promise.all([
      prisma.heatRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: sortOrder },
        include: {
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
          observedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.heatRecord.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Kızgınlık kayıtları listesi hatası:", error);
    return apiError("Kızgınlık kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/breeding/heat - Yeni kizginlik kaydi olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "breeding");

    const body = await request.json();
    const parsed = heatRecordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz kızgınlık bilgileri: " + parsed.error.message, 400);
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

    const record = await prisma.heatRecord.create({
      data: {
        animalId: data.animalId,
        date: data.date,
        intensity: data.intensity,
        notes: data.notes,
        observedById: session.user.id,
        createdById: session.user.id,
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
      },
    });

    // Kızgınlık tespit bildirimi (fire-and-forget)
    const animalName = record.animal.name || record.animal.earTagNumber;
    const intensityLabel = HEAT_INTENSITY_LABELS[data.intensity] || data.intensity;
    createNotification({
      farmId: session.user.farmId,
      type: "HEAT_PREDICTED",
      title: "Kızgınlık Tespit Edildi",
      message: `${animalName} için ${intensityLabel} şiddetinde kızgınlık tespit edildi.`,
      relatedEntityId: record.id,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Kızgınlık kaydı oluşturma hatası:", error);
    return apiError("Kızgınlık kaydı oluşturulurken bir hata oluştu", 500);
  }
}
