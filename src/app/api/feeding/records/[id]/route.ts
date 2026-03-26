import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { feedingRecordSchema } from "@/lib/validations/feeding";
import { createAuditLog } from "@/lib/audit";

const feedingRecordUpdateSchema = feedingRecordSchema.partial();

// ============================================================================
// GET /api/feeding/records/[id] - Tek yemleme kaydi detayi
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

    const { id } = await params;

    const record = await prisma.feedingRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        feedType: {
          farmId: session.user.farmId,
        },
      },
      include: {
        feedType: {
          select: { id: true, name: true, unit: true },
        },
        animal: {
          select: { id: true, name: true, earTagNumber: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    });

    if (!record) {
      return apiError("Yemleme kaydı bulunamadı", 404);
    }

    return apiSuccess(record);
  } catch (error) {
    console.error("Yemleme kaydi detay hatasi:", error);
    return apiError("Yemleme kaydı yüklenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// PUT /api/feeding/records/[id] - Yemleme kaydi guncelle
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

    checkPermission(session.user.role, "update", "feeding");

    const { id } = await params;

    // Kaydin var olup olmadigini kontrol et
    const existing = await prisma.feedingRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        feedType: {
          farmId: session.user.farmId,
        },
      },
      include: {
        feedType: true,
      },
    });

    if (!existing) {
      return apiError("Yemleme kaydı bulunamadı", 404);
    }

    const body = await request.json();
    const parsed = feedingRecordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Geçersiz yemleme kaydı bilgileri: " + parsed.error.message, 400);
    }

    const data = parsed.data;

    // Yem turu degistiyse yeni yem turunu kontrol et
    if (data.feedTypeId && data.feedTypeId !== existing.feedTypeId) {
      const newFeedType = await prisma.feedType.findFirst({
        where: {
          id: data.feedTypeId,
          farmId: session.user.farmId,
          deletedAt: null,
        },
      });

      if (!newFeedType) {
        return apiError("Yem türü bulunamadı", 404);
      }
    }

    // Hayvan kontrolu (varsa)
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

    // Grup kontrolu (varsa)
    if (data.groupId) {
      const group = await prisma.animalGroup.findFirst({
        where: {
          id: data.groupId,
          farmId: session.user.farmId,
          deletedAt: null,
        },
      });

      if (!group) {
        return apiError("Grup bulunamadı", 404);
      }
    }

    // Transaction ile guncelle ve stok ayarla
    const record = await prisma.$transaction(async (tx) => {
      // Miktar degistiyse stoku ayarla
      const newQuantity = data.quantity ?? Number(existing.quantity);
      const oldQuantity = Number(existing.quantity);
      const quantityDiff = newQuantity - oldQuantity;
      const targetFeedTypeId = data.feedTypeId ?? existing.feedTypeId;

      // Yem turu degistiyse eski stogu geri ekle, yeni stoktan dusur
      if (data.feedTypeId && data.feedTypeId !== existing.feedTypeId) {
        // Eski yem turune stogu geri ekle
        await tx.feedType.update({
          where: { id: existing.feedTypeId },
          data: {
            currentStock: {
              increment: oldQuantity,
            },
          },
        });

        // Yeni yem turunun stogunu kontrol et
        const newFeedType = await tx.feedType.findUniqueOrThrow({
          where: { id: data.feedTypeId },
        });

        if (Number(newFeedType.currentStock) < newQuantity) {
          throw new Error(
            `Yetersiz stok. Mevcut stok: ${newFeedType.currentStock} ${newFeedType.unit}, İstenen: ${newQuantity} ${newFeedType.unit}`
          );
        }

        // Yeni yem turundan stok dusur
        await tx.feedType.update({
          where: { id: data.feedTypeId },
          data: {
            currentStock: {
              decrement: newQuantity,
            },
          },
        });
      } else if (quantityDiff !== 0) {
        // Ayni yem turu, miktar degisti - fark kadar stok ayarla
        if (quantityDiff > 0) {
          // Daha fazla yem kullanildi, stoktan dusur
          const feedType = await tx.feedType.findUniqueOrThrow({
            where: { id: targetFeedTypeId },
          });

          if (Number(feedType.currentStock) < quantityDiff) {
            throw new Error(
              `Yetersiz stok. Mevcut stok: ${feedType.currentStock} ${feedType.unit}, Ek ihtiyaç: ${quantityDiff} ${feedType.unit}`
            );
          }

          await tx.feedType.update({
            where: { id: targetFeedTypeId },
            data: {
              currentStock: {
                decrement: quantityDiff,
              },
            },
          });
        } else {
          // Daha az yem kullanildi, stoga geri ekle
          await tx.feedType.update({
            where: { id: targetFeedTypeId },
            data: {
              currentStock: {
                increment: Math.abs(quantityDiff),
              },
            },
          });
        }
      }

      const updatedRecord = await tx.feedingRecord.update({
        where: { id },
        data,
        include: {
          feedType: {
            select: { id: true, name: true, unit: true },
          },
          animal: {
            select: { id: true, name: true, earTagNumber: true },
          },
          group: {
            select: { id: true, name: true },
          },
        },
      });

      return updatedRecord;
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "UPDATE",
      entityType: "FeedingRecord",
      entityId: id,
      changes: data as Record<string, unknown>,
    });

    return apiSuccess(record);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    if (error instanceof Error && error.message.startsWith("Yetersiz stok")) {
      return apiError(error.message, 400);
    }
    console.error("Yemleme kaydi güncelleme hatasi:", error);
    return apiError("Yemleme kaydı güncellenirken bir hata oluştu", 500);
  }
}

// ============================================================================
// DELETE /api/feeding/records/[id] - Yemleme kaydi sil (soft delete + stok iade)
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

    checkPermission(session.user.role, "delete", "feeding");

    const { id } = await params;

    const existing = await prisma.feedingRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        feedType: {
          farmId: session.user.farmId,
        },
      },
    });

    if (!existing) {
      return apiError("Yemleme kaydı bulunamadı", 404);
    }

    // Transaction ile soft delete ve stogu geri ekle
    await prisma.$transaction(async (tx) => {
      await tx.feedingRecord.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Stogu geri ekle
      await tx.feedType.update({
        where: { id: existing.feedTypeId },
        data: {
          currentStock: {
            increment: Number(existing.quantity),
          },
        },
      });
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "DELETE",
      entityType: "FeedingRecord",
      entityId: id,
    });

    return apiSuccess({ message: "Yemleme kaydı başarıyla silindi" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Yemleme kaydi silme hatasi:", error);
    return apiError("Yemleme kaydı silinirken bir hata oluştu", 500);
  }
}
