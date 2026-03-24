import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";

const jsonRecord = z.record(z.string(), z.unknown());
const recordArray = z.array(jsonRecord);

const backupSchema = z.object({
  meta: z.object({
    version: z.string(),
    createdAt: z.string(),
    createdBy: z.string().optional(),
    farmName: z.string().optional(),
  }),
  data: z.object({
    farm: jsonRecord.nullable(),
    users: recordArray,
    animals: recordArray,
    animalGroups: recordArray,
    animalGroupMemberships: recordArray,
    weightRecords: recordArray,
    vaccinationTypes: recordArray,
    vaccinationRecords: recordArray,
    healthRecords: recordArray,
    medicineInventories: recordArray,
    heatRecords: recordArray,
    inseminationRecords: recordArray,
    pregnancyChecks: recordArray,
    calvingRecords: recordArray,
    milkRecords: recordArray,
    milkSales: recordArray,
    feedTypes: recordArray,
    feedPurchases: recordArray,
    feedingRecords: recordArray,
    transactions: recordArray,
    pastures: recordArray,
    grazingRecords: recordArray,
    notifications: recordArray,
    tasks: recordArray,
  }),
});

const TABLE_KEYS = [
  "animals", "animalGroups", "animalGroupMemberships", "weightRecords",
  "vaccinationTypes", "vaccinationRecords", "healthRecords", "medicineInventories",
  "heatRecords", "inseminationRecords", "pregnancyChecks", "calvingRecords",
  "milkRecords", "milkSales", "feedTypes", "feedPurchases", "feedingRecords",
  "transactions", "pastures", "grazingRecords", "notifications", "tasks",
] as const;

// ============================================================================
// POST /api/backup/restore - Yedekten geri yukle
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "manage", "backup");

    const farmId = session.user.farmId;
    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Geçersiz yedek formatı", 400);
    }

    const parsed = backupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Geçersiz yedek formatı", 400);
    }

    const backup = parsed.data;

    if (backup.data.farm && (backup.data.farm as { id?: string }).id !== farmId) {
      return apiError("Bu yedek başka bir çiftliğe ait", 403);
    }

    const { data } = backup;

    const counts: Record<string, number> = {};
    for (const key of TABLE_KEYS) {
      counts[key] = data[key].length;
    }

    if (dryRun) {
      return apiSuccess({ message: "Yedek doğrulaması başarılı", counts, meta: backup.meta });
    }

    const backupSizeBytes = BigInt(JSON.stringify(backup).length);

    await prisma.$transaction(async (tx) => {
      // FK bagimliliklarina gore once bagimlilari sil
      await tx.grazingRecord.deleteMany({ where: { pasture: { farmId } } });
      await tx.feedingRecord.deleteMany({ where: { OR: [{ animal: { farmId } }, { group: { farmId } }] } });
      await tx.feedPurchase.deleteMany({ where: { feedType: { farmId } } });
      await tx.calvingRecord.deleteMany({ where: { animal: { farmId } } });
      await tx.pregnancyCheck.deleteMany({ where: { animal: { farmId } } });
      await tx.inseminationRecord.deleteMany({ where: { animal: { farmId } } });
      await tx.heatRecord.deleteMany({ where: { animal: { farmId } } });
      await tx.vaccinationRecord.deleteMany({ where: { animal: { farmId } } });
      await tx.healthRecord.deleteMany({ where: { animal: { farmId } } });
      await tx.weightRecord.deleteMany({ where: { animal: { farmId } } });
      await tx.animalGroupMembership.deleteMany({ where: { animal: { farmId } } });
      await tx.milkRecord.deleteMany({ where: { animal: { farmId } } });
      await tx.milkSale.deleteMany({ where: { farmId } });
      await tx.transaction.deleteMany({ where: { farmId } });
      await tx.notification.deleteMany({ where: { farmId } });
      await tx.task.deleteMany({ where: { farmId } });
      await tx.medicineInventory.deleteMany({ where: { farmId } });
      await tx.animal.deleteMany({ where: { farmId } });
      await tx.animalGroup.deleteMany({ where: { farmId } });
      await tx.vaccinationType.deleteMany({ where: { farmId } });
      await tx.feedType.deleteMany({ where: { farmId } });
      await tx.pasture.deleteMany({ where: { farmId } });

      const createAll = async (records: Record<string, unknown>[], createFn: (data: never) => Promise<unknown>) => {
        for (const record of records) {
          await createFn(record as never);
        }
      };

      await createAll(data.animalGroups, (d) => tx.animalGroup.create({ data: d }));
      await createAll(data.vaccinationTypes, (d) => tx.vaccinationType.create({ data: d }));
      await createAll(data.feedTypes, (d) => tx.feedType.create({ data: d }));
      await createAll(data.pastures, (d) => tx.pasture.create({ data: d }));
      await createAll(data.medicineInventories, (d) => tx.medicineInventory.create({ data: d }));

      // Self-referencing FK: hayvanlari once ebeveynleri olmadan, sonra ebeveynli olanlarla olustur
      const animalsWithoutParents = data.animals.filter(
        (a) => !a.motherId && !a.fatherId,
      );
      const animalsWithParents = data.animals.filter(
        (a) => a.motherId || a.fatherId,
      );
      await createAll(animalsWithoutParents, (d) => tx.animal.create({ data: d }));
      await createAll(animalsWithParents, (d) => tx.animal.create({ data: d }));

      await createAll(data.animalGroupMemberships, (d) => tx.animalGroupMembership.create({ data: d }));
      await createAll(data.weightRecords, (d) => tx.weightRecord.create({ data: d }));
      await createAll(data.vaccinationRecords, (d) => tx.vaccinationRecord.create({ data: d }));
      await createAll(data.healthRecords, (d) => tx.healthRecord.create({ data: d }));
      await createAll(data.heatRecords, (d) => tx.heatRecord.create({ data: d }));
      await createAll(data.inseminationRecords, (d) => tx.inseminationRecord.create({ data: d }));
      await createAll(data.pregnancyChecks, (d) => tx.pregnancyCheck.create({ data: d }));
      await createAll(data.calvingRecords, (d) => tx.calvingRecord.create({ data: d }));
      await createAll(data.milkRecords, (d) => tx.milkRecord.create({ data: d }));
      await createAll(data.milkSales, (d) => tx.milkSale.create({ data: d }));
      await createAll(data.feedPurchases, (d) => tx.feedPurchase.create({ data: d }));
      await createAll(data.feedingRecords, (d) => tx.feedingRecord.create({ data: d }));
      await createAll(data.transactions, (d) => tx.transaction.create({ data: d }));
      await createAll(data.grazingRecords, (d) => tx.grazingRecord.create({ data: d }));
      await createAll(data.notifications, (d) => tx.notification.create({ data: d }));
      await createAll(data.tasks, (d) => tx.task.create({ data: d }));

      await tx.backupRecord.create({
        data: {
          filename: `restore_${new Date().toISOString()}.json`,
          sizeBytes: backupSizeBytes,
          type: "MANUAL",
          status: "SUCCESS",
          farmId,
          createdById: session.user.id,
        },
      });
    });

    return apiSuccess({ message: "Yedek başarıyla geri yüklendi", counts });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Geri yükleme hatası:", error);
    return apiError("Geri yükleme sırasında bir hata oluştu", 500);
  }
}
