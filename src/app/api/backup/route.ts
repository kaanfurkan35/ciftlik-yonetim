import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";

// ============================================================================
// POST /api/backup - JSON yedekleme olustur
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum acmaniz gerekiyor", 401);
    }

    // Sadece admin erisebilir
    if (session.user.role !== "ADMIN") {
      return apiError("Bu islem icin yetkiniz bulunmuyor", 403);
    }

    const farmId = session.user.farmId;

    // Tum tablolari JSON olarak topla
    const [
      farm,
      users,
      animals,
      animalGroups,
      animalGroupMemberships,
      weightRecords,
      vaccinationTypes,
      vaccinationRecords,
      healthRecords,
      medicineInventories,
      heatRecords,
      inseminationRecords,
      pregnancyChecks,
      calvingRecords,
      milkRecords,
      milkSales,
      feedTypes,
      feedPurchases,
      feedingRecords,
      transactions,
      pastures,
      grazingRecords,
      notifications,
      tasks,
    ] = await Promise.all([
      prisma.farm.findUnique({ where: { id: farmId } }),
      prisma.user.findMany({ where: { farmId, deletedAt: null }, select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true } }),
      prisma.animal.findMany({ where: { farmId, deletedAt: null } }),
      prisma.animalGroup.findMany({ where: { farmId, deletedAt: null } }),
      prisma.animalGroupMembership.findMany({ where: { animal: { farmId }, deletedAt: null } }),
      prisma.weightRecord.findMany({ where: { animal: { farmId }, deletedAt: null } }),
      prisma.vaccinationType.findMany({ where: { farmId, deletedAt: null } }),
      prisma.vaccinationRecord.findMany({ where: { animal: { farmId }, deletedAt: null } }),
      prisma.healthRecord.findMany({ where: { animal: { farmId }, deletedAt: null } }),
      prisma.medicineInventory.findMany({ where: { farmId, deletedAt: null } }),
      prisma.heatRecord.findMany({ where: { animal: { farmId }, deletedAt: null } }),
      prisma.inseminationRecord.findMany({ where: { animal: { farmId }, deletedAt: null } }),
      prisma.pregnancyCheck.findMany({ where: { animal: { farmId }, deletedAt: null } }),
      prisma.calvingRecord.findMany({ where: { animal: { farmId }, deletedAt: null } }),
      prisma.milkRecord.findMany({ where: { animal: { farmId }, deletedAt: null } }),
      prisma.milkSale.findMany({ where: { farmId, deletedAt: null } }),
      prisma.feedType.findMany({ where: { farmId, deletedAt: null } }),
      prisma.feedPurchase.findMany({ where: { feedType: { farmId }, deletedAt: null } }),
      prisma.feedingRecord.findMany({ where: { deletedAt: null, OR: [{ animal: { farmId } }, { group: { farmId } }] } }),
      prisma.transaction.findMany({ where: { farmId, deletedAt: null } }),
      prisma.pasture.findMany({ where: { farmId, deletedAt: null } }),
      prisma.grazingRecord.findMany({ where: { pasture: { farmId }, deletedAt: null } }),
      prisma.notification.findMany({ where: { farmId, deletedAt: null } }),
      prisma.task.findMany({ where: { farmId, deletedAt: null } }),
    ]);

    const backupData = {
      meta: {
        version: "1.0",
        createdAt: new Date().toISOString(),
        createdBy: session.user.email,
        farmName: farm?.name || "",
      },
      data: {
        farm,
        users,
        animals,
        animalGroups,
        animalGroupMemberships,
        weightRecords,
        vaccinationTypes,
        vaccinationRecords,
        healthRecords,
        medicineInventories,
        heatRecords,
        inseminationRecords,
        pregnancyChecks,
        calvingRecords,
        milkRecords,
        milkSales,
        feedTypes,
        feedPurchases,
        feedingRecords,
        transactions,
        pastures,
        grazingRecords,
        notifications,
        tasks,
      },
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const sizeBytes = Buffer.byteLength(jsonString, "utf-8");
    const now = new Date();
    const filename = `yedek_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.json`;

    // Yedekleme kaydini olustur
    await prisma.backupRecord.create({
      data: {
        filename,
        sizeBytes: BigInt(sizeBytes),
        type: "MANUAL",
        status: "SUCCESS",
        farmId,
        createdById: session.user.id,
      },
    });

    createAuditLog({
      userId: session.user.id,
      farmId: session.user.farmId,
      action: "BACKUP",
      entityType: "BackupRecord",
      entityId: filename,
    });

    // JSON dosyasi olarak dondur
    return new Response(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(sizeBytes),
      },
    });
  } catch (error) {
    console.error("Yedekleme hatasi:", error);

    // Basarisiz yedekleme kaydini olustur
    try {
      const session = await auth();
      if (session?.user) {
        await prisma.backupRecord.create({
          data: {
            filename: "failed_backup.json",
            sizeBytes: BigInt(0),
            type: "MANUAL",
            status: "FAILED",
            farmId: session.user.farmId,
            createdById: session.user.id,
          },
        });
      }
    } catch {
      // Log kaydi olusturulamazsa sessizce gec
    }

    return apiError("Yedekleme olusturulurken bir hata olustu", 500);
  }
}

// ============================================================================
// GET /api/backup - Yedekleme kayitlarini listele
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum acmaniz gerekiyor", 401);
    }

    if (session.user.role !== "ADMIN") {
      return apiError("Bu islem icin yetkiniz bulunmuyor", 403);
    }

    const backupRecords = await prisma.backupRecord.findMany({
      where: {
        farmId: session.user.farmId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // BigInt serilestirilmesini duzelt
    const serialized = backupRecords.map((record) => ({
      ...record,
      sizeBytes: record.sizeBytes.toString(),
    }));

    return apiSuccess(serialized);
  } catch (error) {
    console.error("Yedekleme listesi hatasi:", error);
    return apiError("Yedekleme kayitlari yuklenirken bir hata olustu", 500);
  }
}
