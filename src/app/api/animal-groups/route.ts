import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { animalGroupCreateSchema, animalGroupFilterSchema } from "@/lib/validations/animal-group";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/animal-groups - Hayvan grubu listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const { searchParams } = request.nextUrl;
    const parsed = animalGroupFilterSchema.safeParse({
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

    const where: Prisma.AnimalGroupWhereInput = {
      farmId: session.user.farmId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [groups, total] = await Promise.all([
      prisma.animalGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { currentAnimals: true },
          },
        },
      }),
      prisma.animalGroup.count({ where }),
    ]);

    return apiSuccess(groups, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Hayvan grubu listesi hatasi:", error);
    return apiError("Hayvan grupları yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/animal-groups - Yeni hayvan grubu olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "animals");

    const body = await request.json();
    const parsed = animalGroupCreateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz grup bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    const group = await prisma.animalGroup.create({
      data: {
        ...data,
        farmId: session.user.farmId,
        createdById: session.user.id,
      },
    });

    return apiSuccess(group);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Hayvan grubu oluşturma hatasi:", error);
    return apiError("Hayvan grubu oluşturulurken bir hata oluştu", 500);
  }
}
