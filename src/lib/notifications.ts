import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

/**
 * Bildirim oluşturma yardımcı fonksiyonu.
 * userId verilmezse, çiftlikteki tüm kullanıcılara bildirim gönderir.
 */
export async function createNotification(params: {
  farmId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
}): Promise<void> {
  try {
    const { farmId, userId, type, title, message, relatedEntityId } = params;

    if (userId) {
      await prisma.notification.create({
        data: { farmId, userId, type, title, message, relatedEntityId },
      });
    } else {
      const users = await prisma.user.findMany({
        where: { farmId, deletedAt: null },
        select: { id: true },
      });

      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map((user) => ({
            farmId,
            userId: user.id,
            type,
            title,
            message,
            relatedEntityId,
          })),
        });
      }
    }
  } catch (error) {
    console.error("Bildirim oluşturma hatası:", error);
  }
}

/**
 * Yaklaşan aşı tarihlerini kontrol eder (7 gün içinde).
 * Bildirim daha önce oluşturulmamışsa yeni bildirim oluşturur.
 */
export async function checkVaccinationDueAlerts(farmId: string): Promise<void> {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const records = await prisma.vaccinationRecord.findMany({
      where: {
        deletedAt: null,
        animal: { farmId, deletedAt: null },
        nextDueDate: {
          gte: now,
          lte: sevenDaysLater,
        },
      },
      include: {
        animal: { select: { name: true, earTagNumber: true } },
        vaccinationType: { select: { name: true } },
      },
    });

    if (records.length === 0) return;

    const existingNotifications = await prisma.notification.findMany({
      where: {
        farmId,
        type: "VACCINATION_DUE",
        relatedEntityId: { in: records.map((r) => r.id) },
        deletedAt: null,
      },
      select: { relatedEntityId: true },
    });
    const notifiedIds = new Set(existingNotifications.map((n) => n.relatedEntityId));

    for (const record of records) {
      if (notifiedIds.has(record.id)) continue;

      const animalName = record.animal.name || record.animal.earTagNumber;
      const formattedDate = record.nextDueDate!.toLocaleDateString("tr-TR");

      await createNotification({
        farmId,
        type: "VACCINATION_DUE",
        title: "Aşı Zamanı Yaklaşıyor",
        message: `${animalName} için ${record.vaccinationType.name} aşısı ${formattedDate} tarihinde yapılmalıdır.`,
        relatedEntityId: record.id,
      });
    }
  } catch (error) {
    console.error("Aşı bildirim kontrolü hatası:", error);
  }
}

/**
 * Düşük yem stoku uyarılarını kontrol eder.
 * currentStock <= minimumStock olan yem tiplerini bulur.
 */
export async function checkFeedStockAlerts(farmId: string): Promise<void> {
  try {
    const feedTypes = await prisma.feedType.findMany({
      where: {
        farmId,
        deletedAt: null,
      },
    });

    const lowStockFeeds = feedTypes.filter(
      (feed) => Number(feed.currentStock) <= Number(feed.minimumStock)
    );

    if (lowStockFeeds.length === 0) return;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingNotifications = await prisma.notification.findMany({
      where: {
        farmId,
        type: "FEED_LOW",
        relatedEntityId: { in: lowStockFeeds.map((f) => f.id) },
        deletedAt: null,
        createdAt: { gte: oneDayAgo },
      },
      select: { relatedEntityId: true },
    });
    const notifiedIds = new Set(existingNotifications.map((n) => n.relatedEntityId));

    for (const feed of lowStockFeeds) {
      if (notifiedIds.has(feed.id)) continue;

      await createNotification({
        farmId,
        type: "FEED_LOW",
        title: "Yem Stoku Düşük",
        message: `${feed.name} stoku kritik seviyede: ${feed.currentStock} ${feed.unit} (minimum: ${feed.minimumStock} ${feed.unit}).`,
        relatedEntityId: feed.id,
      });
    }
  } catch (error) {
    console.error("Yem stoku bildirim kontrolü hatası:", error);
  }
}

/**
 * Yaklaşan doğum tarihlerini kontrol eder (14 gün içinde).
 * Gebelik kontrolü pozitif olan ve beklenen doğum tarihi yaklaşan hayvanları bulur.
 */
export async function checkCalvingAlerts(farmId: string): Promise<void> {
  try {
    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const pregnancyChecks = await prisma.pregnancyCheck.findMany({
      where: {
        deletedAt: null,
        result: "POSITIVE",
        expectedCalvingDate: {
          gte: now,
          lte: fourteenDaysLater,
        },
        animal: { farmId, deletedAt: null },
      },
      include: {
        animal: { select: { name: true, earTagNumber: true } },
      },
    });

    if (pregnancyChecks.length === 0) return;

    const existingNotifications = await prisma.notification.findMany({
      where: {
        farmId,
        type: "CALVING_EXPECTED",
        relatedEntityId: { in: pregnancyChecks.map((c) => c.id) },
        deletedAt: null,
      },
      select: { relatedEntityId: true },
    });
    const notifiedIds = new Set(existingNotifications.map((n) => n.relatedEntityId));

    for (const check of pregnancyChecks) {
      if (notifiedIds.has(check.id)) continue;

      const animalName = check.animal.name || check.animal.earTagNumber;
      const formattedDate = check.expectedCalvingDate!.toLocaleDateString("tr-TR");

      await createNotification({
        farmId,
        type: "CALVING_EXPECTED",
        title: "Doğum Yaklaşıyor",
        message: `${animalName} için beklenen doğum tarihi: ${formattedDate}.`,
        relatedEntityId: check.id,
      });
    }
  } catch (error) {
    console.error("Doğum bildirim kontrolü hatası:", error);
  }
}
