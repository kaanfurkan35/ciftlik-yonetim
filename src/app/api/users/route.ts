import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import { passwordSchema } from "@/lib/validations/user";

// ============================================================================
// Kullanici olusturma schemasi
// ============================================================================

const userCreateSchema = z.object({
  name: z.string().trim().min(1, "İsim zorunludur"),
  email: z.string().email("Geçersiz e-posta adresi"),
  password: passwordSchema,
  phone: z.string().trim().optional(),
  role: z.enum(
    ["ADMIN", "MANAGER", "WORKER", "VIEWER"],
    "Geçersiz rol"
  ).default("VIEWER"),
});

// ============================================================================
// GET /api/users - Kullanici listesi
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "read", "users");

    const users = await prisma.user.findMany({
      where: {
        farmId: session.user.farmId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(users);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Kullanıcı listesi hatası:", error);
    return apiError("Kullanıcılar yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// POST /api/users - Yeni kullanici olustur (yalnizca admin)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "create", "users");

    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz kullanıcı bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // E-posta benzersizlik kontrolu
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return apiError("Bu e-posta adresi zaten kayıtlı", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: data.role,
        farmId: session.user.farmId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
    });

    return apiSuccess(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Kullanıcı oluşturma hatası:", error);
    return apiError("Kullanıcı oluşturulurken bir hata oluştu", 500);
  }
}
