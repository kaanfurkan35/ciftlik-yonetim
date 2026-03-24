import { z } from "zod";

// ============================================================================
// Grup tipi enum
// ============================================================================

export const groupTypeEnum = z.enum(["HERD", "PEN", "PASTURE_GROUP"]);

// ============================================================================
// Hayvan grubu olusturma schemasi
// ============================================================================

export const animalGroupCreateSchema = z.object({
  name: z.string().trim().min(1, "Grup adı zorunludur"),
  description: z.string().trim().optional(),
  type: groupTypeEnum,
});

export type AnimalGroupCreateInput = z.infer<typeof animalGroupCreateSchema>;

// ============================================================================
// Hayvan grubu guncelleme schemasi (tum alanlar opsiyonel)
// ============================================================================

export const animalGroupUpdateSchema = animalGroupCreateSchema.partial();

export type AnimalGroupUpdateInput = z.infer<typeof animalGroupUpdateSchema>;

// ============================================================================
// Hayvan grubu filtreleme schemasi
// ============================================================================

export const animalGroupFilterSchema = z.object({
  search: z.string().trim().optional(),
  type: groupTypeEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "name", "type"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type AnimalGroupFilterInput = z.infer<typeof animalGroupFilterSchema>;
