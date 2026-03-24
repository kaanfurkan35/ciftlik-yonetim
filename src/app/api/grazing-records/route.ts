import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { grazingRecordCreateSchema, grazingRecordFilterSchema } from "@/lib/validations/grazing-record";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/grazing-records - Otlatma kayitlari listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = grazingRecordFilterSchema.safeParse({
      pastureId: searchParams.get("pastureId") || undefined,
      groupId: searchParams.get("groupId") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { pastureId, groupId, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.GrazingRecordWhereInput = {
      deletedAt: null,
      pasture: {
        farmId: session.user.farmId,
        deletedAt: null,
      },
    };

    if (pastureId) {
      where.pastureId = pastureId;
    }

    if (groupId) {
      where.groupId = groupId;
    }

    const [records, total] = await Promise.all([
      prisma.grazingRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          pasture: {
            select: { id: true, name: true },
          },
          group: {
            select: { id: true, name: true, type: true },
          },
        },
      }),
      prisma.grazingRecord.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Otlatma kayıtları listesi hatasi:", error);
    return apiError("Otlatma kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/grazing-records - Yeni otlatma kaydi olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "pastures");

    const body = await request.json();
    const parsed = grazingRecordCreateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz otlatma bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    const [pasture, group] = await Promise.all([
      prisma.pasture.findFirst({
        where: { id: data.pastureId, farmId: session.user.farmId, deletedAt: null },
      }),
      prisma.animalGroup.findFirst({
        where: { id: data.groupId, farmId: session.user.farmId, deletedAt: null },
      }),
    ]);

    if (!pasture) {
      return apiError("Mera bulunamadı", 404);
    }

    if (!group) {
      return apiError("Hayvan grubu bulunamadı", 404);
    }

    const record = await prisma.grazingRecord.create({
      data: {
        ...data,
        createdById: session.user.id,
      },
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Otlatma kaydı oluşturma hatasi:", error);
    return apiError("Otlatma kaydı oluşturulurken bir hata oluştu", 500);
  }
}
