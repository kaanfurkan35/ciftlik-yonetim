import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { inseminationRecordSchema, breedingFilterSchema } from "@/lib/validations/breeding";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/breeding/insemination - Tohumlama kayitlari listesi
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

    const where: Prisma.InseminationRecordWhereInput = {
      deletedAt: null,
      animal: { farmId: session.user.farmId },
    };

    if (animalId) {
      where.animalId = animalId;
    }

    const [records, total] = await Promise.all([
      prisma.inseminationRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: sortOrder },
        include: {
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
          bull: {
            select: { id: true, name: true, earTagNumber: true },
          },
        },
      }),
      prisma.inseminationRecord.count({ where }),
    ]);

    return apiSuccess(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Tohumlama kayıtları listesi hatası:", error);
    return apiError("Tohumlama kayıtları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/breeding/insemination - Yeni tohumlama kaydi olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "breeding");

    const body = await request.json();
    const parsed = inseminationRecordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz tohumlama bilgileri: " + parsed.error.message, 400);
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

    // Boga varsa kontrol et
    if (data.bullId) {
      const bull = await prisma.animal.findFirst({
        where: {
          id: data.bullId,
          farmId: session.user.farmId,
          deletedAt: null,
        },
      });

      if (!bull) {
        return apiError("Boğa bulunamadı", 404);
      }
    }

    const record = await prisma.inseminationRecord.create({
      data: {
        animalId: data.animalId,
        date: data.date,
        type: data.type,
        bullId: data.bullId,
        semenBatchNumber: data.semenBatchNumber,
        technicianName: data.technicianName,
        cost: data.cost,
        notes: data.notes,
        createdById: session.user.id,
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        bull: {
          select: { id: true, name: true, earTagNumber: true },
        },
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "InseminationRecord",
      entityId: record.id,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Tohumlama kaydı oluşturma hatası:", error);
    return apiError("Tohumlama kaydı oluşturulurken bir hata oluştu", 500);
  }
}
