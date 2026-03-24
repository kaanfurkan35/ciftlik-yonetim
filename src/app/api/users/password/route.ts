import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { z } from "zod";

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre zorunludur"),
  newPassword: z
    .string()
    .min(8, "Yeni şifre en az 8 karakter olmalıdır")
    .regex(/[a-z]/, "Yeni şifre en az bir küçük harf içermelidir")
    .regex(/[A-Z]/, "Yeni şifre en az bir büyük harf içermelidir")
    .regex(/\d/, "Yeni şifre en az bir rakam içermelidir"),
});

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const body = await request.json();
    const parsed = passwordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Yeni şifre gereksinimleri karşılamıyor", 400);
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return apiError("Kullanıcı bulunamadı", 404);
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return apiError("Mevcut şifre hatalı", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return apiSuccess({ message: "Şifre başarıyla güncellendi" });
  } catch (error) {
    console.error("Şifre güncelleme hatası:", error);
    return apiError("Şifre güncellenirken bir hata oluştu", 500);
  }
}
