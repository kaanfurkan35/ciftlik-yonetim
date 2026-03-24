import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { milkRecordSchema, milkRecordFilterSchema } from "@/lib/validations/milk";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/milk - Süt kayıtları listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "read", "milk");

    const { searchParams } = request.nextUrl;
    const parsed = milkRecordFilterSchema.safeParse({
      animalId: searchParams.get("animalId") || undefined,
      session: searchParams.get("session") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { animalId, session: milkSession, startDate, endDate, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.MilkRecordWhereInput = {
      animal: {
        farmId: session.user.farmId,
      },
      deletedAt: null,
    };

    if (animalId) {
      where.animalId = animalId;
    }

    if (milkSession) {
      where.session = milkSession;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const [records, total] = await Promise.all([
      prisma.milkRecord.findMany({
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
      prisma.milkRecord.count({ where }),
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
    console.error("Süt kayıtları listesi hatası:", error);
    return apiError("Süt kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/milk - Yeni süt kaydı oluştur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "milk");

    const body = await request.json();
    const parsed = milkRecordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz süt kaydı bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Hayvanın bu çiftliğe ait olduğunu kontrol et
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

    const record = await prisma.milkRecord.create({
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
    console.error("Süt kaydı oluşturma hatası:", error);
    return apiError("Süt kaydı oluşturulurken bir hata oluştu", 500);
  }
}
