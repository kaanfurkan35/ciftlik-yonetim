import { z } from "zod";

// ============================================================================
// Otlatma kaydi olusturma schemasi
// ============================================================================

export const grazingRecordCreateSchema = z.object({
  pastureId: z.string().uuid("Geçersiz mera ID"),
  groupId: z.string().uuid("Geçersiz grup ID"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
});

export type GrazingRecordCreateInput = z.infer<typeof grazingRecordCreateSchema>;

// ============================================================================
// Otlatma kaydi guncelleme schemasi (tum alanlar opsiyonel)
// ============================================================================

export const grazingRecordUpdateSchema = grazingRecordCreateSchema.partial();

export type GrazingRecordUpdateInput = z.infer<typeof grazingRecordUpdateSchema>;

// ============================================================================
// Otlatma kaydi filtreleme schemasi
// ============================================================================

export const grazingRecordFilterSchema = z.object({
  pastureId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "startDate", "endDate"]).default("startDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type GrazingRecordFilterInput = z.infer<typeof grazingRecordFilterSchema>;
