import { z } from "zod";

// ============================================================================
// Saglik kaydi tur enum'u
// ============================================================================

export const healthRecordTypeEnum = z.enum(
  ["VET_VISIT", "TREATMENT", "SURGERY", "DEWORMING", "CHECKUP", "OTHER"],
  "Gecerli bir saglik kaydi turu seciniz"
);

// ============================================================================
// Saglik kaydi olusturma schemasi
// ============================================================================

export const healthRecordSchema = z.object({
  animalId: z.string().uuid(),
  type: healthRecordTypeEnum,
  date: z.coerce.date(),
  diagnosis: z.string().trim().optional(),
  treatment: z.string().trim().optional(),
  medication: z.string().trim().optional(),
  dosage: z.string().trim().optional(),
  withdrawalEndDate: z.coerce.date().optional(),
  vetName: z.string().trim().optional(),
  cost: z.number().positive().optional(),
  notes: z.string().trim().optional(),
});

export type HealthRecordInput = z.infer<typeof healthRecordSchema>;

// ============================================================================
// Saglik kaydi guncelleme schemasi (tum alanlar opsiyonel)
// ============================================================================

export const healthRecordUpdateSchema = healthRecordSchema.partial();

export type HealthRecordUpdateInput = z.infer<typeof healthRecordUpdateSchema>;

// ============================================================================
// Saglik kaydi filtreleme schemasi
// ============================================================================

export const healthRecordFilterSchema = z.object({
  animalId: z.string().uuid().optional(),
  type: healthRecordTypeEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "date", "type"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type HealthRecordFilterInput = z.infer<typeof healthRecordFilterSchema>;

// ============================================================================
// Asilama kaydi olusturma schemasi
// ============================================================================

export const vaccinationRecordSchema = z.object({
  animalId: z.string().uuid(),
  vaccinationTypeId: z.string().uuid(),
  date: z.coerce.date(),
  nextDueDate: z.coerce.date().optional(),
  batchNumber: z.string().trim().optional(),
  cost: z.number().positive().optional(),
  notes: z.string().trim().optional(),
});

export type VaccinationRecordInput = z.infer<typeof vaccinationRecordSchema>;

// ============================================================================
// Asilama kaydi guncelleme schemasi
// ============================================================================

export const vaccinationRecordUpdateSchema = vaccinationRecordSchema.partial();

export type VaccinationRecordUpdateInput = z.infer<typeof vaccinationRecordUpdateSchema>;

// ============================================================================
// Asilama kaydi filtreleme schemasi
// ============================================================================

export const vaccinationRecordFilterSchema = z.object({
  animalId: z.string().uuid().optional(),
  overdue: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "date"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type VaccinationRecordFilterInput = z.infer<typeof vaccinationRecordFilterSchema>;

// ============================================================================
// Asi turu olusturma schemasi
// ============================================================================

export const vaccinationTypeSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  intervalDays: z.number().int().positive(),
});

export type VaccinationTypeInput = z.infer<typeof vaccinationTypeSchema>;

// ============================================================================
// Asi turu guncelleme schemasi
// ============================================================================

export const vaccinationTypeUpdateSchema = vaccinationTypeSchema.partial();

export type VaccinationTypeUpdateInput = z.infer<typeof vaccinationTypeUpdateSchema>;

// ============================================================================
// Ilac envanteri schemasi
// ============================================================================

export const medicineInventorySchema = z.object({
  name: z.string().trim().min(1, "İlaç adı zorunludur"),
  type: z.string().trim().optional(),
  quantity: z.coerce.number().min(0, "Miktar negatif olamaz"),
  unit: z.string().trim().min(1, "Birim zorunludur"),
  expiryDate: z.coerce.date().optional(),
  batchNumber: z.string().trim().optional(),
  supplier: z.string().trim().optional(),
  cost: z.coerce.number().positive("Maliyet pozitif olmalıdır").optional(),
});

export type MedicineInventoryInput = z.infer<typeof medicineInventorySchema>;

export const medicineInventoryUpdateSchema = medicineInventorySchema.partial();

export type MedicineInventoryUpdateInput = z.infer<typeof medicineInventoryUpdateSchema>;

export const medicineInventoryFilterSchema = z.object({
  search: z.string().trim().optional(),
  type: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "name"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type MedicineInventoryFilterInput = z.infer<typeof medicineInventoryFilterSchema>;
