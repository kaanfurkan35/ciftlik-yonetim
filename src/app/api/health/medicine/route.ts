import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { medicineInventorySchema, medicineInventoryFilterSchema } from "@/lib/validations/health";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/health/medicine - Ilac envanteri listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = medicineInventoryFilterSchema.safeParse({
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { search, type, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicineInventoryWhereInput = {
      deletedAt: null,
      farmId: session.user.farmId,
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (type) {
      where.type = type;
    }

    const [medicines, total] = await Promise.all([
      prisma.medicineInventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.medicineInventory.count({ where }),
    ]);

    return apiSuccess(medicines, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Ilac envanteri listesi hatasi:", error);
    return apiError("İlaç envanteri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/health/medicine - Yeni ilac kaydi olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "health");

    const body = await request.json();
    const parsed = medicineInventorySchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz ilaç bilgileri: " + parsed.error.message, 400);
    }

    const medicine = await prisma.medicineInventory.create({
      data: {
        ...parsed.data,
        farmId: session.user.farmId,
        createdById: session.user.id,
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "MedicineInventory",
      entityId: medicine.id,
    });

    return apiSuccess(medicine);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Ilac kaydi olusturma hatasi:", error);
    return apiError("İlaç kaydı oluşturulurken bir hata oluştu", 500);
  }
}
