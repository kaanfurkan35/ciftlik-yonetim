import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================================
// Yardimci fonksiyonlar
// ============================================================================

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDecimal(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

// ============================================================================
// Ana seed fonksiyonu
// ============================================================================

async function main() {
  console.log("Seed verileri olusturuluyor...");

  // Mevcut verileri temizle
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.backupRecord.deleteMany();
  await prisma.task.deleteMany();
  await prisma.grazingRecord.deleteMany();
  await prisma.pasture.deleteMany();
  await prisma.feedingRecord.deleteMany();
  await prisma.feedPurchase.deleteMany();
  await prisma.feedType.deleteMany();
  await prisma.milkSale.deleteMany();
  await prisma.milkRecord.deleteMany();
  await prisma.calvingRecord.deleteMany();
  await prisma.pregnancyCheck.deleteMany();
  await prisma.inseminationRecord.deleteMany();
  await prisma.heatRecord.deleteMany();
  await prisma.medicineInventory.deleteMany();
  await prisma.healthRecord.deleteMany();
  await prisma.vaccinationRecord.deleteMany();
  await prisma.vaccinationType.deleteMany();
  await prisma.weightRecord.deleteMany();
  await prisma.animalGroupMembership.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.animalGroup.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
  await prisma.farm.deleteMany();

  console.log("Eski veriler temizlendi.");

  // ============================================================================
  // 1. Ciftlik
  // ============================================================================

  const farm = await prisma.farm.create({
    data: {
      name: "Ümmet Ali Oğulları Çiftliği",
      address: "Bolu",
      phone: "+90 374 555 1234",
      email: "info@ummetaliciftlik.com",
      settings: {
        currency: "TRY",
        language: "tr",
        timezone: "Europe/Istanbul",
      },
    },
  });

  console.log("Ciftlik olusturuldu:", farm.name);

  // ============================================================================
  // 2. Kullanicilar
  // ============================================================================

  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const workerPasswordHash = await bcrypt.hash("calisan123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@ciftlik.com",
      passwordHash: adminPasswordHash,
      name: "Ahmet Yilmaz",
      phone: "+90 532 111 2233",
      role: "ADMIN",
      isActive: true,
      farmId: farm.id,
    },
  });

  const worker = await prisma.user.create({
    data: {
      email: "calisan@ciftlik.com",
      passwordHash: workerPasswordHash,
      name: "Mehmet Demir",
      phone: "+90 533 444 5566",
      role: "WORKER",
      isActive: true,
      farmId: farm.id,
    },
  });

  console.log("Kullanicilar olusturuldu:", admin.name, worker.name);

  // ============================================================================
  // 3. Hayvanlar
  // ============================================================================

  const breeds = ["Simental", "Holstein", "Montofon", "Jersey", "Angus", "Yerli Kara", "Boz Irk"];
  const colors = ["Siyah-Beyaz", "Kahverengi", "Kirmizi-Beyaz", "Siyah", "Beyaz", "Boz", "Sari"];

  // Oncelikle ana-baba olmadan boga ve inekleri olustur
  const animals: Awaited<ReturnType<typeof prisma.animal.create>>[] = [];

  // Bogalar (3 adet)
  const bullData = [
    { earTag: "TR-001", name: "Karabas", breed: "Simental", color: "Kahverengi", dob: new Date("2019-03-15"), status: "ACTIVE" as const },
    { earTag: "TR-002", name: "Yildiz", breed: "Holstein", color: "Siyah-Beyaz", dob: new Date("2020-06-10"), status: "ACTIVE" as const },
    { earTag: "TR-003", name: "Tosun", breed: "Angus", color: "Siyah", dob: new Date("2018-11-20"), status: "ACTIVE" as const },
  ];

  for (const b of bullData) {
    const bull = await prisma.animal.create({
      data: {
        earTagNumber: b.earTag,
        name: b.name,
        breed: b.breed,
        sex: "MALE",
        color: b.color,
        dateOfBirth: b.dob,
        status: b.status,
        acquisitionType: "PURCHASED",
        acquisitionDate: b.dob,
        farmId: farm.id,
        createdById: admin.id,
      },
    });
    animals.push(bull);
  }

  // Inekler (12 adet)
  const cowData = [
    { earTag: "TR-101", name: "Sari Kiz", breed: "Simental", color: "Sari", dob: new Date("2019-04-20"), status: "LACTATING" as const },
    { earTag: "TR-102", name: "Benekli", breed: "Holstein", color: "Siyah-Beyaz", dob: new Date("2020-01-15"), status: "LACTATING" as const },
    { earTag: "TR-103", name: "Pamuk", breed: "Jersey", color: "Kahverengi", dob: new Date("2019-08-10"), status: "PREGNANT" as const },
    { earTag: "TR-104", name: "Gonca", breed: "Simental", color: "Kirmizi-Beyaz", dob: new Date("2021-02-25"), status: "LACTATING" as const },
    { earTag: "TR-105", name: "Nazli", breed: "Holstein", color: "Siyah-Beyaz", dob: new Date("2020-07-18"), status: "DRY" as const },
    { earTag: "TR-106", name: "Ala", breed: "Montofon", color: "Kahverengi", dob: new Date("2018-12-05"), status: "LACTATING" as const },
    { earTag: "TR-107", name: "Ceylan", breed: "Simental", color: "Kirmizi-Beyaz", dob: new Date("2021-05-12"), status: "PREGNANT" as const },
    { earTag: "TR-108", name: "Duru", breed: "Holstein", color: "Siyah-Beyaz", dob: new Date("2022-03-08"), status: "ACTIVE" as const },
    { earTag: "TR-109", name: "Elif", breed: "Jersey", color: "Kahverengi", dob: new Date("2020-09-22"), status: "LACTATING" as const },
    { earTag: "TR-110", name: "Findik", breed: "Yerli Kara", color: "Siyah", dob: new Date("2019-06-14"), status: "LACTATING" as const },
    { earTag: "TR-111", name: "Gul", breed: "Boz Irk", color: "Boz", dob: new Date("2021-11-30"), status: "ACTIVE" as const },
    { earTag: "TR-112", name: "Hurma", breed: "Simental", color: "Kahverengi", dob: new Date("2022-01-17"), status: "ACTIVE" as const },
  ];

  for (const c of cowData) {
    const cow = await prisma.animal.create({
      data: {
        earTagNumber: c.earTag,
        name: c.name,
        breed: c.breed,
        sex: "FEMALE",
        color: c.color,
        dateOfBirth: c.dob,
        status: c.status,
        acquisitionType: "PURCHASED",
        acquisitionDate: c.dob,
        farmId: farm.id,
        createdById: admin.id,
      },
    });
    animals.push(cow);
  }

  // Buzagilar (ana-baba iliskileri ile, 5 adet)
  const calfData = [
    { earTag: "TR-201", name: "Minik", breed: "Simental", color: "Sari", dob: new Date("2024-08-10"), status: "CALF" as const, motherIdx: 3, fatherIdx: 0 },
    { earTag: "TR-202", name: "Boncuk", breed: "Holstein", color: "Siyah-Beyaz", dob: new Date("2024-10-22"), status: "CALF" as const, motherIdx: 4, fatherIdx: 1 },
    { earTag: "TR-203", name: "Fistik", breed: "Simental", color: "Kirmizi-Beyaz", dob: new Date("2025-01-05"), status: "CALF" as const, motherIdx: 6, fatherIdx: 0 },
    { earTag: "TR-204", name: "Tarcin", breed: "Jersey", color: "Kahverengi", dob: new Date("2025-02-14"), status: "CALF" as const, motherIdx: 5, fatherIdx: 2 },
    { earTag: "TR-205", name: "Bulut", breed: "Holstein", color: "Beyaz", dob: new Date("2025-03-01"), status: "CALF" as const, motherIdx: 11, fatherIdx: 1 },
  ];

  for (const cf of calfData) {
    const calf = await prisma.animal.create({
      data: {
        earTagNumber: cf.earTag,
        name: cf.name,
        breed: cf.breed,
        sex: randomItem(["MALE", "FEMALE"] as const),
        color: cf.color,
        dateOfBirth: cf.dob,
        status: cf.status,
        acquisitionType: "BORN",
        acquisitionDate: cf.dob,
        motherId: animals[cf.motherIdx].id,
        fatherId: animals[cf.fatherIdx].id,
        farmId: farm.id,
        createdById: admin.id,
      },
    });
    animals.push(calf);
  }

  console.log(`${animals.length} hayvan olusturuldu.`);

  // ============================================================================
  // 4. Asi turleri
  // ============================================================================

  const vaccinationTypesData = [
    { name: "Sap Asisi", description: "Sap hastaligi asisi, yilda 2 kez", intervalDays: 180 },
    { name: "Brusella Asisi", description: "Brusella hastaligi asisi", intervalDays: 365 },
    { name: "Tuberkulin Testi", description: "Tuberkuloz testi", intervalDays: 365 },
    { name: "Cicek Asisi", description: "Sigigr cicegi asisi", intervalDays: 365 },
    { name: "Antraks Asisi", description: "Sarbon (antraks) asisi", intervalDays: 365 },
  ];

  const vaccinationTypes: Awaited<ReturnType<typeof prisma.vaccinationType.create>>[] = [];

  for (const vt of vaccinationTypesData) {
    const vacType = await prisma.vaccinationType.create({
      data: {
        name: vt.name,
        description: vt.description,
        intervalDays: vt.intervalDays,
        farmId: farm.id,
        createdById: admin.id,
      },
    });
    vaccinationTypes.push(vacType);
  }

  console.log(`${vaccinationTypes.length} asi turu olusturuldu.`);

  // ============================================================================
  // 5. Asilama kayitlari
  // ============================================================================

  // Her hayvan icin rastgele 1-3 asi kaydi
  let vacRecordCount = 0;
  for (const animal of animals) {
    const numVaccinations = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numVaccinations; i++) {
      const vacType = randomItem(vaccinationTypes);
      const vacDate = randomDate(new Date("2024-01-01"), new Date("2025-12-01"));
      const nextDueDate = new Date(vacDate);
      nextDueDate.setDate(nextDueDate.getDate() + vacType.intervalDays);

      await prisma.vaccinationRecord.create({
        data: {
          animalId: animal.id,
          vaccinationTypeId: vacType.id,
          date: vacDate,
          nextDueDate,
          batchNumber: `BATCH-${Math.floor(Math.random() * 10000)}`,
          cost: randomDecimal(50, 200),
          notes: null,
          administeredById: randomItem([admin.id, worker.id]),
          createdById: admin.id,
        },
      });
      vacRecordCount++;
    }
  }

  console.log(`${vacRecordCount} asilama kaydi olusturuldu.`);

  // ============================================================================
  // 6. Saglik kayitlari
  // ============================================================================

  const healthTypes: Array<"VET_VISIT" | "TREATMENT" | "CHECKUP" | "DEWORMING"> = [
    "VET_VISIT",
    "TREATMENT",
    "CHECKUP",
    "DEWORMING",
  ];
  const diagnoses = [
    "Mastit",
    "Topallama",
    "Solunum enfeksiyonu",
    "Ishali",
    "Goz enfeksiyonu",
    "Genel kontrol",
    "Parazit",
  ];
  const treatments = [
    "Antibiyotik tedavisi",
    "Anti-enflamatuar tedavi",
    "Parazit ilaci uygulamasi",
    "Tirniak bakimi",
    "Goz merhemi uygulamasi",
    "Vitamin takviyesi",
  ];

  let healthRecordCount = 0;
  for (let i = 0; i < 15; i++) {
    const animal = randomItem(animals);
    const healthDate = randomDate(new Date("2024-06-01"), new Date("2025-12-01"));

    await prisma.healthRecord.create({
      data: {
        animalId: animal.id,
        type: randomItem(healthTypes),
        date: healthDate,
        diagnosis: randomItem(diagnoses),
        treatment: randomItem(treatments),
        medication: randomItem(["Penisilin", "Oksitetrasiklin", "Ivermektin", "Meloksikam", "Vitamin AD3E"]),
        dosage: `${Math.floor(Math.random() * 10) + 1} ml`,
        vetName: randomItem(["Dr. Ali Kaya", "Dr. Ayse Celik", "Dr. Hasan Ozturk"]),
        cost: randomDecimal(100, 500),
        notes: null,
        createdById: admin.id,
      },
    });
    healthRecordCount++;
  }

  console.log(`${healthRecordCount} saglik kaydi olusturuldu.`);

  // ============================================================================
  // 7. Sut kayitlari (sadece sagimlaklar icin)
  // ============================================================================

  const lactatingAnimals = animals.filter(
    (a) => a.status === "LACTATING"
  );

  let milkRecordCount = 0;
  for (const animal of lactatingAnimals) {
    // Son 60 gun icin gunluk kayitlar
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      date.setHours(6, 0, 0, 0);

      // Sabah sagimi
      await prisma.milkRecord.create({
        data: {
          animalId: animal.id,
          date,
          session: "MORNING",
          quantity: randomDecimal(8, 18),
          fatPercentage: randomDecimal(3.2, 4.8),
          proteinPercentage: randomDecimal(3.0, 3.8),
          somaticCellCount: Math.floor(Math.random() * 200000) + 50000,
          createdById: worker.id,
        },
      });

      // Aksam sagimi
      const eveningDate = new Date(date);
      eveningDate.setHours(17, 0, 0, 0);

      await prisma.milkRecord.create({
        data: {
          animalId: animal.id,
          date: eveningDate,
          session: "EVENING",
          quantity: randomDecimal(6, 14),
          fatPercentage: randomDecimal(3.4, 5.0),
          proteinPercentage: randomDecimal(3.1, 3.9),
          somaticCellCount: Math.floor(Math.random() * 200000) + 50000,
          createdById: worker.id,
        },
      });

      milkRecordCount += 2;
    }
  }

  console.log(`${milkRecordCount} sut kaydi olusturuldu.`);

  // ============================================================================
  // 8. Yem turleri
  // ============================================================================

  const feedTypesData = [
    { name: "Yonca", unit: "KG", currentStock: 5000, minimumStock: 500, costPerUnit: 8.5 },
    { name: "Arpa", unit: "KG", currentStock: 3000, minimumStock: 300, costPerUnit: 12.0 },
    { name: "Misir Silaji", unit: "TON", currentStock: 25, minimumStock: 5, costPerUnit: 3500.0 },
    { name: "Karma Yem", unit: "KG", currentStock: 2000, minimumStock: 200, costPerUnit: 18.0 },
    { name: "Saman", unit: "BALYA", currentStock: 150, minimumStock: 20, costPerUnit: 120.0 },
  ];

  const feedTypes: Awaited<ReturnType<typeof prisma.feedType.create>>[] = [];

  for (const ft of feedTypesData) {
    const feedType = await prisma.feedType.create({
      data: {
        name: ft.name,
        unit: ft.unit,
        currentStock: ft.currentStock,
        minimumStock: ft.minimumStock,
        costPerUnit: ft.costPerUnit,
        farmId: farm.id,
        createdById: admin.id,
      },
    });
    feedTypes.push(feedType);
  }

  console.log(`${feedTypes.length} yem turu olusturuldu.`);

  // ============================================================================
  // 9. Finansal islemler (gelir/gider)
  // ============================================================================

  const incomeData = [
    { category: "MILK_SALE" as const, amount: 45000, description: "Ocak ayi sut satisi", date: new Date("2025-01-31") },
    { category: "MILK_SALE" as const, amount: 48000, description: "Subat ayi sut satisi", date: new Date("2025-02-28") },
    { category: "MILK_SALE" as const, amount: 52000, description: "Mart ayi sut satisi", date: new Date("2025-03-31") },
    { category: "ANIMAL_SALE" as const, amount: 85000, description: "2 baslik dana satisi", date: new Date("2025-02-15") },
    { category: "SUBSIDY" as const, amount: 25000, description: "Tarim Bakanligi hayvancilik destegi", date: new Date("2025-01-10") },
    { category: "MILK_SALE" as const, amount: 50000, description: "Nisan ayi sut satisi", date: new Date("2025-04-30") },
  ];

  const expenseData = [
    { category: "FEED" as const, amount: 32000, description: "Aylik yem alimi", date: new Date("2025-01-15") },
    { category: "FEED" as const, amount: 35000, description: "Aylik yem alimi", date: new Date("2025-02-15") },
    { category: "FEED" as const, amount: 33000, description: "Aylik yem alimi", date: new Date("2025-03-15") },
    { category: "VETERINARY" as const, amount: 8500, description: "Veteriner muayene ve tedavi", date: new Date("2025-01-20") },
    { category: "MEDICATION" as const, amount: 4200, description: "Asi ve ilac alimi", date: new Date("2025-02-10") },
    { category: "EQUIPMENT" as const, amount: 15000, description: "Sagim makinesi bakim", date: new Date("2025-03-05") },
    { category: "LABOR" as const, amount: 18000, description: "Isci maasi", date: new Date("2025-01-31") },
    { category: "LABOR" as const, amount: 18000, description: "Isci maasi", date: new Date("2025-02-28") },
    { category: "FUEL" as const, amount: 5500, description: "Traktor yakit", date: new Date("2025-01-25") },
    { category: "UTILITIES" as const, amount: 3200, description: "Elektrik ve su faturasi", date: new Date("2025-02-05") },
  ];

  for (const inc of incomeData) {
    await prisma.transaction.create({
      data: {
        type: "INCOME",
        category: inc.category,
        amount: inc.amount,
        date: inc.date,
        description: inc.description,
        farmId: farm.id,
        createdById: admin.id,
      },
    });
  }

  for (const exp of expenseData) {
    await prisma.transaction.create({
      data: {
        type: "EXPENSE",
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        description: exp.description,
        farmId: farm.id,
        createdById: admin.id,
      },
    });
  }

  console.log(`${incomeData.length + expenseData.length} finansal islem olusturuldu.`);

  // ============================================================================
  // 10. Gorevler
  // ============================================================================

  const tasksData = [
    { title: "Sabah sagimi", description: "Tum sagimlak ineklerin sabah sagimi", status: "COMPLETED" as const, priority: "HIGH" as const, dueDate: new Date("2025-12-01") },
    { title: "Ahir temizligi", description: "Ana ahir ve buzagi bolumu temizligi", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, dueDate: new Date("2025-12-02") },
    { title: "Asi uygulamasi", description: "TR-101, TR-102 icin sap asisi", status: "PENDING" as const, priority: "HIGH" as const, dueDate: new Date("2025-12-05") },
    { title: "Yem siparisi", description: "Karma yem ve arpa siparisi ver", status: "PENDING" as const, priority: "URGENT" as const, dueDate: new Date("2025-12-03") },
    { title: "Veteriner randevusu", description: "Gebe ineklerin ultrason kontrolu", status: "PENDING" as const, priority: "HIGH" as const, dueDate: new Date("2025-12-10") },
    { title: "Cit tamiri", description: "Kuzey mera citi tamiri", status: "PENDING" as const, priority: "LOW" as const, dueDate: new Date("2025-12-15") },
    { title: "Sut numunesi gonder", description: "Laboratuvar analizi icin sut numunesi", status: "COMPLETED" as const, priority: "MEDIUM" as const, dueDate: new Date("2025-11-28"), completedAt: new Date("2025-11-28") },
  ];

  for (const task of tasksData) {
    await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        completedAt: task.completedAt || null,
        assignedToId: randomItem([admin.id, worker.id]),
        farmId: farm.id,
        createdById: admin.id,
      },
    });
  }

  console.log(`${tasksData.length} gorev olusturuldu.`);

  console.log("\n========================================");
  console.log("Seed verileri basariyla olusturuldu!");
  console.log("========================================");
  console.log(`Ciftlik: ${farm.name}`);
  console.log(`Admin: admin@ciftlik.com / admin123`);
  console.log(`Calisan: calisan@ciftlik.com / calisan123`);
  console.log(`Hayvan sayisi: ${animals.length}`);
  console.log(`Asi turu: ${vaccinationTypes.length}`);
  console.log(`Yem turu: ${feedTypes.length}`);
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("Seed hatasi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
