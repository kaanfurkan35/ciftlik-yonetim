import { z } from "zod";

// ============================================================================
// Kizginlik / Heat kaydi schemasi
// ============================================================================

export const heatIntensityEnum = z.enum(
  ["WEAK", "MODERATE", "STRONG"],
  "Kızgınlık şiddeti seçiniz"
);

export const heatRecordSchema = z.object({
  animalId: z.string().uuid("Geçerli bir hayvan seçiniz"),
  date: z.coerce.date(),
  intensity: heatIntensityEnum,
  notes: z.string().trim().optional(),
});

export type HeatRecordInput = z.infer<typeof heatRecordSchema>;

// ============================================================================
// Tohumlama kaydi schemasi
// ============================================================================

export const inseminationTypeEnum = z.enum(
  ["ARTIFICIAL", "NATURAL"],
  "Tohumlama türü seçiniz"
);

export const inseminationRecordSchema = z.object({
  animalId: z.string().uuid("Geçerli bir hayvan seçiniz"),
  date: z.coerce.date(),
  type: inseminationTypeEnum,
  bullId: z.string().uuid().optional(),
  semenBatchNumber: z.string().trim().optional(),
  technicianName: z.string().trim().optional(),
  cost: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().optional(),
});

export type InseminationRecordInput = z.infer<typeof inseminationRecordSchema>;

// ============================================================================
// Gebelik kontrolu schemasi
// ============================================================================

export const pregnancyResultEnum = z.enum(
  ["POSITIVE", "NEGATIVE", "INCONCLUSIVE"],
  "Gebelik sonucu seçiniz"
);

export const pregnancyCheckSchema = z.object({
  animalId: z.string().uuid("Geçerli bir hayvan seçiniz"),
  inseminationId: z.string().uuid().optional(),
  checkDate: z.coerce.date(),
  result: pregnancyResultEnum,
  method: z.string().trim().optional(),
  expectedCalvingDate: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
});

export type PregnancyCheckInput = z.infer<typeof pregnancyCheckSchema>;

// ============================================================================
// Dogum kaydi schemasi
// ============================================================================

export const calvingRecordSchema = z.object({
  animalId: z.string().uuid("Geçerli bir hayvan seçiniz"),
  calfId: z.string().uuid().optional(),
  date: z.coerce.date(),
  dystociaScore: z.coerce.number().int().min(1).max(5).optional(),
  complications: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type CalvingRecordInput = z.infer<typeof calvingRecordSchema>;

// ============================================================================
// Filtre schemalari
// ============================================================================

export const breedingFilterSchema = z.object({
  animalId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type BreedingFilterInput = z.infer<typeof breedingFilterSchema>;
