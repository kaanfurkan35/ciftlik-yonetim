import { z } from "zod";

// ============================================================================
// Yem birimi enum
// ============================================================================

export const feedUnitEnum = z.enum(
  ["KG", "TON", "LITRE", "BALYА", "CUVAL"],
  "Geçerli bir birim seçiniz"
);

// ============================================================================
// Yem turu olusturma schemasi
// ============================================================================

export const feedTypeSchema = z.object({
  name: z.string().trim().min(1, "Yem adı zorunludur"),
  unit: z.string().trim().min(1, "Birim zorunludur"),
  currentStock: z.coerce.number().min(0, "Stok negatif olamaz").default(0),
  minimumStock: z.coerce.number().min(0, "Minimum stok negatif olamaz").default(0),
  costPerUnit: z.coerce.number().positive("Birim fiyat pozitif olmalıdır").optional(),
});

export type FeedTypeInput = z.infer<typeof feedTypeSchema>;

// ============================================================================
// Yem turu guncelleme schemasi
// ============================================================================

export const feedTypeUpdateSchema = feedTypeSchema.partial();

export type FeedTypeUpdateInput = z.infer<typeof feedTypeUpdateSchema>;

// ============================================================================
// Yem satin alma schemasi
// ============================================================================

export const feedPurchaseSchema = z.object({
  feedTypeId: z.string().uuid("Geçerli bir yem türü seçiniz"),
  quantity: z.coerce.number().positive("Miktar pozitif olmalıdır"),
  totalCost: z.coerce.number().positive("Toplam maliyet pozitif olmalıdır"),
  supplier: z.string().trim().optional(),
  date: z.coerce.date(),
  invoiceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type FeedPurchaseInput = z.infer<typeof feedPurchaseSchema>;

// ============================================================================
// Yemleme kaydi schemasi
// ============================================================================

export const feedingRecordSchema = z.object({
  groupId: z.string().uuid("Geçerli bir grup seçiniz").optional(),
  animalId: z.string().uuid("Geçerli bir hayvan seçiniz").optional(),
  feedTypeId: z.string().uuid("Geçerli bir yem türü seçiniz"),
  quantity: z.coerce.number().positive("Miktar pozitif olmalıdır"),
  date: z.coerce.date(),
  notes: z.string().trim().optional(),
});

export type FeedingRecordInput = z.infer<typeof feedingRecordSchema>;

export const feedPurchaseUpdateSchema = feedPurchaseSchema.partial();

export type FeedPurchaseUpdateInput = z.infer<typeof feedPurchaseUpdateSchema>;

// ============================================================================
// Filtre schemalari
// ============================================================================

export const feedTypeFilterSchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "name"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const feedPurchaseFilterSchema = z.object({
  feedTypeId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "date"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const feedingRecordFilterSchema = z.object({
  feedTypeId: z.string().uuid().optional(),
  animalId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "date", "name"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
