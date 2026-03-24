import { z } from "zod";

// ============================================================================
// Süt sağım oturumu enum
// ============================================================================

export const milkSessionEnum = z.enum(["MORNING", "EVENING", "TOTAL"], "Geçerli bir sağım zamanı seçiniz");

// ============================================================================
// Süt kaydı oluşturma şeması
// ============================================================================

export const milkRecordSchema = z.object({
  animalId: z.string().uuid(),
  date: z.coerce.date(),
  session: milkSessionEnum,
  quantity: z.number().positive("Miktar pozitif olmalıdır"),
  fatPercentage: z.number().min(0).max(100).optional(),
  proteinPercentage: z.number().min(0).max(100).optional(),
  somaticCellCount: z.number().int().min(0).optional(),
  notes: z.string().trim().optional(),
});

export type MilkRecordInput = z.infer<typeof milkRecordSchema>;

// ============================================================================
// Süt kaydı güncelleme şeması (tüm alanlar opsiyonel)
// ============================================================================

export const milkRecordUpdateSchema = milkRecordSchema.partial();

export type MilkRecordUpdateInput = z.infer<typeof milkRecordUpdateSchema>;

// ============================================================================
// Süt kaydı filtreleme şeması
// ============================================================================

export const milkRecordFilterSchema = z.object({
  animalId: z.string().uuid().optional(),
  session: milkSessionEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "date", "quantity"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type MilkRecordFilterInput = z.infer<typeof milkRecordFilterSchema>;

// ============================================================================
// Süt satışı oluşturma şeması
// ============================================================================

export const milkSaleSchema = z.object({
  date: z.coerce.date(),
  quantity: z.number().positive("Miktar pozitif olmalıdır"),
  pricePerLiter: z.number().positive("Litre fiyatı pozitif olmalıdır"),
  totalAmount: z.number().positive().optional(),
  buyerName: z.string().trim().min(1, "Alıcı adı zorunludur"),
  invoiceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type MilkSaleInput = z.infer<typeof milkSaleSchema>;

// ============================================================================
// Süt satışı güncelleme şeması
// ============================================================================

export const milkSaleUpdateSchema = milkSaleSchema.partial();

export type MilkSaleUpdateInput = z.infer<typeof milkSaleUpdateSchema>;

// ============================================================================
// Süt satışı filtreleme şeması
// ============================================================================

export const milkSaleFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  buyerName: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "date", "quantity"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type MilkSaleFilterInput = z.infer<typeof milkSaleFilterSchema>;
