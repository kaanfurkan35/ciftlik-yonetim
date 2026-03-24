import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseSearchParams } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { animalCreateSchema, animalFilterSchema } from "@/lib/validations/animal";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/animals - Hayvan listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = animalFilterSchema.safeParse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      sex: searchParams.get("sex") || undefined,
      breed: searchParams.get("breed") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    });

    if (!parsed.success) {
      return apiError("Geçersiz filtre parametreleri", 400);
    }

    const { search, status, sex, breed, page, limit, sortBy, sortOrder } = parsed.data;
    const skip = (page - 1) * limit;

    // Filtre kosullarini olustur
    const where: Prisma.AnimalWhereInput = {
      farmId: session.user.farmId,
      deletedAt: null,
    };

    // Arama: kulak numarasi veya isim
    if (search) {
      where.OR = [
        { earTagNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (sex) {
      where.sex = sex;
    }

    if (breed) {
      where.breed = { contains: breed, mode: "insensitive" };
    }

    const [animals, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          mother: {
            select: { id: true, name: true, earTagNumber: true },
          },
          father: {
            select: { id: true, name: true, earTagNumber: true },
          },
        },
      }),
      prisma.animal.count({ where }),
    ]);

    return apiSuccess(animals, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Hayvan listesi hatasi:", error);
    return apiError("Hayvanlar yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/animals - Yeni hayvan olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "animals");

    const body = await request.json();
    const parsed = animalCreateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz hayvan bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Kulak numarasi benzersizlik kontrolu (ayni ciftlik icinde)
    const existing = await prisma.animal.findFirst({
      where: {
        earTagNumber: data.earTagNumber,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (existing) {
      return apiError("Bu kulak numarası zaten kayıtlı", 409);
    }

    const animal = await prisma.animal.create({
      data: {
        ...data,
        farmId: session.user.farmId,
        createdById: session.user.id,
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "Animal",
      entityId: animal.id,
    });

    return apiSuccess(animal);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Hayvan oluşturma hatasi:", error);
    return apiError("Hayvan oluşturulurken bir hata oluştu", 500);
  }
}
