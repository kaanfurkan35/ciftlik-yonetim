import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, "İsim boş olamaz").optional(),
  phone: z.string().trim().optional(),
  avatarUrl: z.string().url("Geçersiz URL").optional().nullable(),
});

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Geçersiz profil bilgileri: " + parsed.error.message,
        400
      );
    }

    const data = parsed.data;

    const user = await prisma.user.update({
      where: { id: session.user.id },
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

    return apiSuccess(user);
  } catch (error) {
    console.error("Profil güncelleme hatası:", error);
    return apiError("Profil güncellenirken bir hata oluştu", 500);
  }
}
