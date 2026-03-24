import { z } from "zod";

// ============================================================================
// Tartim kaydi olusturma schemasi
// ============================================================================

export const weightRecordCreateSchema = z.object({
  animalId: z.string().uuid("Geçersiz hayvan ID"),
  weight: z.number().positive("Ağırlık pozitif olmalıdır"),
  date: z.coerce.date(),
  notes: z.string().trim().optional(),
});

export type WeightRecordCreateInput = z.infer<typeof weightRecordCreateSchema>;

// ============================================================================
// Tartim kaydi guncelleme schemasi (tum alanlar opsiyonel)
// ============================================================================

export const weightRecordUpdateSchema = weightRecordCreateSchema.partial();

export type WeightRecordUpdateInput = z.infer<typeof weightRecordUpdateSchema>;

// ============================================================================
// Tartim kaydi filtreleme schemasi
// ============================================================================

export const weightRecordFilterSchema = z.object({
  animalId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "date", "weight"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type WeightRecordFilterInput = z.infer<typeof weightRecordFilterSchema>;
