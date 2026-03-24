import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { transactionSchema, transactionFilterSchema } from "@/lib/validations/finance";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/finance - Finansal islem listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = transactionFilterSchema.safeParse({
      type: searchParams.get("type") || undefined,
      category: searchParams.get("category") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { type, category, dateFrom, dateTo, search, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      farmId: session.user.farmId,
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = dateFrom;
      }
      if (dateTo) {
        where.date.lte = dateTo;
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return apiSuccess(transactions, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Finansal islem listesi hatasi:", error);
    return apiError("Finansal işlemler yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/finance - Yeni finansal islem olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "finance");

    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz işlem bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Hayvan ID verilmisse, ayni ciftlige ait oldugundan emin ol
    if (data.animalId) {
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
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        invoiceUrl: data.invoiceUrl || null,
        farmId: session.user.farmId,
        createdById: session.user.id,
      },
      include: {
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return apiSuccess(transaction);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Finansal islem olusturma hatasi:", error);
    return apiError("Finansal işlem oluşturulurken bir hata oluştu", 500);
  }
}
