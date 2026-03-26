import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

// ============================================================================
// Kullanici guncelleme schemasi (sifre haric)
// ============================================================================

const userUpdateSchema = z.object({
  name: z.string().trim().min(1, "İsim zorunludur").optional(),
  phone: z.string().trim().optional(),
  role: z.enum(["ADMIN", "MANAGER", "WORKER", "VIEWER"], "Geçersiz rol").optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// GET /api/users/[id] - Tek kullanici detayi
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "read", "users");

    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: {
        id,
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
        updatedAt: true,
      },
    });

    if (!user) {
      return apiError("Kullanıcı bulunamadı", 404);
    }

    return apiSuccess(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Kullanıcı detay hatası:", error);
    return apiError("Kullanıcı bilgileri yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/users/[id] - Kullanici guncelle (sifre haric)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "update", "users");

    const { id } = await params;

    // Kullanicinin var olup olmadigini kontrol et
    const existing = await prisma.user.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Kullanıcı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz kullanıcı bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "User",
      entityId: id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Kullanıcı güncelleme hatası:", error);
    return apiError("Kullanıcı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/users/[id] - Kullanici sil (soft delete)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "delete", "users");

    const { id } = await params;

    // Kendini silmeye calismasin
    if (id === session.user.id) {
      return apiError("Kendi hesabınızı silemezsiniz", 400);
    }

    const existing = await prisma.user.findFirst({
      where: {
        id,
        farmId: session.user.farmId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return apiError("Kullanıcı bulunamadı", 404);
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "User",
      entityId: id,
    });

    return apiSuccess({ message: "Kullanıcı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Kullanıcı silme hatası:", error);
    return apiError("Kullanıcı silinirken bir hata oluştu", 500);
  }
}
