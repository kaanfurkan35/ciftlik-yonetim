import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { milkSaleSchema, milkSaleFilterSchema } from "@/lib/validations/milk";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/milk/sales - Süt satışları listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = milkSaleFilterSchema.safeParse({
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      buyerName: searchParams.get("buyerName") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { startDate, endDate, buyerName, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.MilkSaleWhereInput = {
      farmId: session.user.farmId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    if (buyerName) {
      where.buyerName = { contains: buyerName, mode: "insensitive" };
    }

    const [sales, total] = await Promise.all([
      prisma.milkSale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.milkSale.count({ where }),
    ]);

    return apiSuccess(sales, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Süt satışları listesi hatası:", error);
    return apiError("Süt satışları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/milk/sales - Yeni süt satışı oluştur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "milk");

    const body = await request.json();
    const parsed = milkSaleSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz süt satışı bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Toplam tutarı otomatik hesapla
    const totalAmount = data.totalAmount ?? data.quantity * data.pricePerLiter;

    const sale = await prisma.milkSale.create({
      data: {
        date: data.date,
        quantity: data.quantity,
        pricePerLiter: data.pricePerLiter,
        totalAmount,
        buyerName: data.buyerName,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes,
        farmId: session.user.farmId,
        createdById: session.user.id,
      },
    });

    return apiSuccess(sale);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Süt satışı oluşturma hatası:", error);
    return apiError("Süt satışı oluşturulurken bir hata oluştu", 500);
  }
}
