-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'WORKER', 'VIEWER');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('ACTIVE', 'SOLD', 'DECEASED', 'DRY', 'LACTATING', 'PREGNANT', 'CALF');

-- CreateEnum
CREATE TYPE "AnimalSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AcquisitionType" AS ENUM ('BORN', 'PURCHASED');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('HERD', 'PEN', 'PASTURE_GROUP');

-- CreateEnum
CREATE TYPE "HealthRecordType" AS ENUM ('VET_VISIT', 'TREATMENT', 'SURGERY', 'DEWORMING', 'CHECKUP', 'OTHER');

-- CreateEnum
CREATE TYPE "HeatIntensity" AS ENUM ('WEAK', 'MODERATE', 'STRONG');

-- CreateEnum
CREATE TYPE "InseminationType" AS ENUM ('ARTIFICIAL', 'NATURAL');

-- CreateEnum
CREATE TYPE "PregnancyResult" AS ENUM ('POSITIVE', 'NEGATIVE', 'INCONCLUSIVE');

-- CreateEnum
CREATE TYPE "MilkSession" AS ENUM ('MORNING', 'EVENING', 'TOTAL');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('MILK_SALE', 'ANIMAL_SALE', 'SUBSIDY', 'FEED', 'VETERINARY', 'MEDICATION', 'EQUIPMENT', 'LABOR', 'FUEL', 'UTILITIES', 'OTHER');

-- CreateEnum
CREATE TYPE "PastureCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('VACCINATION_DUE', 'CALVING_EXPECTED', 'HEAT_PREDICTED', 'FEED_LOW', 'PAYMENT_DUE', 'TASK_ASSIGNED', 'GENERAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'BACKUP');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "settings" JSONB,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "farmId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "earTagNumber" TEXT NOT NULL,
    "name" TEXT,
    "breed" TEXT,
    "sex" "AnimalSex" NOT NULL,
    "color" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfDeath" TIMESTAMP(3),
    "deathCause" TEXT,
    "status" "AnimalStatus" NOT NULL DEFAULT 'ACTIVE',
    "acquisitionType" "AcquisitionType",
    "acquisitionDate" TIMESTAMP(3),
    "acquisitionPrice" DECIMAL(10,2),
    "photoUrls" TEXT[],
    "notes" TEXT,
    "motherId" TEXT,
    "fatherId" TEXT,
    "currentGroupId" TEXT,
    "farmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalGroup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GroupType" NOT NULL,
    "farmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "AnimalGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalGroupMembership" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "AnimalGroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "WeightRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccinationType" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "intervalDays" INTEGER NOT NULL,
    "farmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "VaccinationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccinationRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "vaccinationTypeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "batchNumber" TEXT,
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "administeredById" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "VaccinationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "type" "HealthRecordType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "medication" TEXT,
    "dosage" TEXT,
    "withdrawalEndDate" TIMESTAMP(3),
    "vetName" TEXT,
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineInventory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "type" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "batchNumber" TEXT,
    "supplier" TEXT,
    "cost" DECIMAL(10,2),
    "farmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "MedicineInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "intensity" "HeatIntensity" NOT NULL,
    "notes" TEXT,
    "observedById" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "HeatRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InseminationRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "InseminationType" NOT NULL,
    "semenBatchNumber" TEXT,
    "technicianName" TEXT,
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "bullId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "InseminationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PregnancyCheck" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "inseminationId" TEXT,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "result" "PregnancyResult" NOT NULL,
    "method" TEXT,
    "expectedCalvingDate" TIMESTAMP(3),
    "notes" TEXT,
    "checkedById" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "PregnancyCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalvingRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "calfId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "dystociaScore" INTEGER,
    "complications" TEXT,
    "notes" TEXT,
    "assistedById" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "CalvingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilkRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "animalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "session" "MilkSession" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "fatPercentage" DOUBLE PRECISION,
    "proteinPercentage" DOUBLE PRECISION,
    "somaticCellCount" INTEGER,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "MilkRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilkSale" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "pricePerLiter" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "buyerName" TEXT,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "farmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "MilkSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedType" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DECIMAL(10,2) NOT NULL,
    "minimumStock" DECIMAL(10,2) NOT NULL,
    "costPerUnit" DECIMAL(10,2),
    "farmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "FeedType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPurchase" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "feedTypeId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "FeedPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedingRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "groupId" TEXT,
    "animalId" TEXT,
    "feedTypeId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "FeedingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "invoiceNumber" TEXT,
    "invoiceUrl" TEXT,
    "animalId" TEXT,
    "farmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pasture" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "sizeDekar" DECIMAL(10,2) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "condition" "PastureCondition" NOT NULL,
    "hasWaterSource" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "farmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Pasture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrazingRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "pastureId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "GrazingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "farmId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedToId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "filename" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "type" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL,
    "farmId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_farmId_deletedAt_idx" ON "User"("farmId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_earTagNumber_key" ON "Animal"("earTagNumber");

-- CreateIndex
CREATE INDEX "Animal_farmId_deletedAt_idx" ON "Animal"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "Animal_status_idx" ON "Animal"("status");

-- CreateIndex
CREATE INDEX "Animal_earTagNumber_idx" ON "Animal"("earTagNumber");

-- CreateIndex
CREATE INDEX "Animal_motherId_idx" ON "Animal"("motherId");

-- CreateIndex
CREATE INDEX "Animal_fatherId_idx" ON "Animal"("fatherId");

-- CreateIndex
CREATE INDEX "AnimalGroup_farmId_deletedAt_idx" ON "AnimalGroup"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "AnimalGroupMembership_animalId_idx" ON "AnimalGroupMembership"("animalId");

-- CreateIndex
CREATE INDEX "AnimalGroupMembership_groupId_idx" ON "AnimalGroupMembership"("groupId");

-- CreateIndex
CREATE INDEX "WeightRecord_animalId_date_idx" ON "WeightRecord"("animalId", "date");

-- CreateIndex
CREATE INDEX "VaccinationType_farmId_deletedAt_idx" ON "VaccinationType"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "VaccinationRecord_animalId_date_idx" ON "VaccinationRecord"("animalId", "date");

-- CreateIndex
CREATE INDEX "VaccinationRecord_nextDueDate_idx" ON "VaccinationRecord"("nextDueDate");

-- CreateIndex
CREATE INDEX "HealthRecord_animalId_date_idx" ON "HealthRecord"("animalId", "date");

-- CreateIndex
CREATE INDEX "MedicineInventory_farmId_deletedAt_idx" ON "MedicineInventory"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "MedicineInventory_expiryDate_idx" ON "MedicineInventory"("expiryDate");

-- CreateIndex
CREATE INDEX "HeatRecord_animalId_date_idx" ON "HeatRecord"("animalId", "date");

-- CreateIndex
CREATE INDEX "InseminationRecord_animalId_date_idx" ON "InseminationRecord"("animalId", "date");

-- CreateIndex
CREATE INDEX "PregnancyCheck_animalId_checkDate_idx" ON "PregnancyCheck"("animalId", "checkDate");

-- CreateIndex
CREATE INDEX "PregnancyCheck_expectedCalvingDate_idx" ON "PregnancyCheck"("expectedCalvingDate");

-- CreateIndex
CREATE INDEX "CalvingRecord_animalId_date_idx" ON "CalvingRecord"("animalId", "date");

-- CreateIndex
CREATE INDEX "MilkRecord_animalId_date_idx" ON "MilkRecord"("animalId", "date");

-- CreateIndex
CREATE INDEX "MilkRecord_date_idx" ON "MilkRecord"("date");

-- CreateIndex
CREATE INDEX "MilkSale_farmId_deletedAt_idx" ON "MilkSale"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "MilkSale_date_idx" ON "MilkSale"("date");

-- CreateIndex
CREATE INDEX "FeedType_farmId_deletedAt_idx" ON "FeedType"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "FeedPurchase_feedTypeId_date_idx" ON "FeedPurchase"("feedTypeId", "date");

-- CreateIndex
CREATE INDEX "FeedingRecord_date_idx" ON "FeedingRecord"("date");

-- CreateIndex
CREATE INDEX "FeedingRecord_animalId_idx" ON "FeedingRecord"("animalId");

-- CreateIndex
CREATE INDEX "FeedingRecord_groupId_idx" ON "FeedingRecord"("groupId");

-- CreateIndex
CREATE INDEX "Transaction_farmId_deletedAt_idx" ON "Transaction"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Transaction_type_category_idx" ON "Transaction"("type", "category");

-- CreateIndex
CREATE INDEX "Pasture_farmId_deletedAt_idx" ON "Pasture"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "GrazingRecord_pastureId_idx" ON "GrazingRecord"("pastureId");

-- CreateIndex
CREATE INDEX "GrazingRecord_groupId_idx" ON "GrazingRecord"("groupId");

-- CreateIndex
CREATE INDEX "GrazingRecord_startDate_idx" ON "GrazingRecord"("startDate");

-- CreateIndex
CREATE INDEX "Notification_farmId_deletedAt_idx" ON "Notification"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Task_farmId_deletedAt_idx" ON "Task"("farmId", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "BackupRecord_farmId_deletedAt_idx" ON "BackupRecord"("farmId", "deletedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_currentGroupId_fkey" FOREIGN KEY ("currentGroupId") REFERENCES "AnimalGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalGroup" ADD CONSTRAINT "AnimalGroup_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalGroup" ADD CONSTRAINT "AnimalGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalGroupMembership" ADD CONSTRAINT "AnimalGroupMembership_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalGroupMembership" ADD CONSTRAINT "AnimalGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AnimalGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightRecord" ADD CONSTRAINT "WeightRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightRecord" ADD CONSTRAINT "WeightRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationType" ADD CONSTRAINT "VaccinationType_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationType" ADD CONSTRAINT "VaccinationType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_vaccinationTypeId_fkey" FOREIGN KEY ("vaccinationTypeId") REFERENCES "VaccinationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_administeredById_fkey" FOREIGN KEY ("administeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineInventory" ADD CONSTRAINT "MedicineInventory_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineInventory" ADD CONSTRAINT "MedicineInventory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatRecord" ADD CONSTRAINT "HeatRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatRecord" ADD CONSTRAINT "HeatRecord_observedById_fkey" FOREIGN KEY ("observedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatRecord" ADD CONSTRAINT "HeatRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InseminationRecord" ADD CONSTRAINT "InseminationRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InseminationRecord" ADD CONSTRAINT "InseminationRecord_bullId_fkey" FOREIGN KEY ("bullId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InseminationRecord" ADD CONSTRAINT "InseminationRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PregnancyCheck" ADD CONSTRAINT "PregnancyCheck_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PregnancyCheck" ADD CONSTRAINT "PregnancyCheck_inseminationId_fkey" FOREIGN KEY ("inseminationId") REFERENCES "InseminationRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PregnancyCheck" ADD CONSTRAINT "PregnancyCheck_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PregnancyCheck" ADD CONSTRAINT "PregnancyCheck_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalvingRecord" ADD CONSTRAINT "CalvingRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalvingRecord" ADD CONSTRAINT "CalvingRecord_calfId_fkey" FOREIGN KEY ("calfId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalvingRecord" ADD CONSTRAINT "CalvingRecord_assistedById_fkey" FOREIGN KEY ("assistedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalvingRecord" ADD CONSTRAINT "CalvingRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRecord" ADD CONSTRAINT "MilkRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRecord" ADD CONSTRAINT "MilkRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkSale" ADD CONSTRAINT "MilkSale_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkSale" ADD CONSTRAINT "MilkSale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedType" ADD CONSTRAINT "FeedType_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedType" ADD CONSTRAINT "FeedType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPurchase" ADD CONSTRAINT "FeedPurchase_feedTypeId_fkey" FOREIGN KEY ("feedTypeId") REFERENCES "FeedType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPurchase" ADD CONSTRAINT "FeedPurchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingRecord" ADD CONSTRAINT "FeedingRecord_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AnimalGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingRecord" ADD CONSTRAINT "FeedingRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingRecord" ADD CONSTRAINT "FeedingRecord_feedTypeId_fkey" FOREIGN KEY ("feedTypeId") REFERENCES "FeedType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingRecord" ADD CONSTRAINT "FeedingRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasture" ADD CONSTRAINT "Pasture_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasture" ADD CONSTRAINT "Pasture_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrazingRecord" ADD CONSTRAINT "GrazingRecord_pastureId_fkey" FOREIGN KEY ("pastureId") REFERENCES "Pasture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrazingRecord" ADD CONSTRAINT "GrazingRecord_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AnimalGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrazingRecord" ADD CONSTRAINT "GrazingRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
