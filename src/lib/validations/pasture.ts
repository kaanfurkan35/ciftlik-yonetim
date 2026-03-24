import { z } from "zod";

// ============================================================================
// Mera durumu enum'i
// ============================================================================

export const pastureConditionEnum = z.enum(
  ["EXCELLENT", "GOOD", "FAIR", "POOR"],
  "Geçersiz mera durumu"
);

// ============================================================================
// Mera olusturma schemasi
// ============================================================================

export const pastureCreateSchema = z.object({
  name: z.string().trim().min(1, "Mera adı zorunludur"),
  sizeDekar: z.coerce.number().positive("Büyüklük pozitif olmalıdır"),
  capacity: z.coerce.number().int().positive("Kapasite pozitif olmalıdır"),
  condition: pastureConditionEnum.default("GOOD"),
  hasWaterSource: z.boolean().default(false),
  notes: z.string().trim().optional(),
});

export type PastureCreateInput = z.infer<typeof pastureCreateSchema>;

// ============================================================================
// Mera guncelleme schemasi (tum alanlar opsiyonel)
// ============================================================================

export const pastureUpdateSchema = pastureCreateSchema.partial();

export type PastureUpdateInput = z.infer<typeof pastureUpdateSchema>;

// ============================================================================
// Mera filtreleme schemasi
// ============================================================================

export const pastureFilterSchema = z.object({
  condition: pastureConditionEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "name", "sizeDekar", "capacity"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PastureFilterInput = z.infer<typeof pastureFilterSchema>;
