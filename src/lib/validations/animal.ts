import { z } from "zod";

// ============================================================================
// Hayvan durum ve cinsiyet enum'lari
// ============================================================================

export const animalStatusEnum = z.enum([
  "ACTIVE",
  "SOLD",
  "DECEASED",
  "DRY",
  "LACTATING",
  "PREGNANT",
  "CALF",
]);

export const animalSexEnum = z.enum(["MALE", "FEMALE"]);

export const acquisitionTypeEnum = z.enum(["BORN", "PURCHASED"]);

// ============================================================================
// Hayvan olusturma schemasi
// ============================================================================

export const animalCreateSchema = z.object({
  earTagNumber: z.string().trim(),
  name: z.string().trim().optional(),
  breed: z.string().trim(),
  sex: animalSexEnum,
  color: z.string().trim().optional(),
  dateOfBirth: z.coerce.date().optional(),
  status: animalStatusEnum.default("ACTIVE"),
  acquisitionType: acquisitionTypeEnum,
  acquisitionDate: z.coerce.date().optional(),
  acquisitionPrice: z.number().positive().optional(),
  motherId: z.string().uuid().optional(),
  fatherId: z.string().uuid().optional(),
  currentGroupId: z.string().uuid().optional(),
  notes: z.string().trim().optional(),
});

export type AnimalCreateInput = z.infer<typeof animalCreateSchema>;

// ============================================================================
// Hayvan guncelleme schemasi (tum alanlar opsiyonel)
// ============================================================================

export const animalUpdateSchema = animalCreateSchema.partial();

export type AnimalUpdateInput = z.infer<typeof animalUpdateSchema>;

// ============================================================================
// Hayvan filtreleme / sorgu parametreleri schemasi
// ============================================================================

export const animalFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: animalStatusEnum.optional(),
  sex: animalSexEnum.optional(),
  breed: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "earTagNumber", "name", "dateOfBirth", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type AnimalFilterInput = z.infer<typeof animalFilterSchema>;
