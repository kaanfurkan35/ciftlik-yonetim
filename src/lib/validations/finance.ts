import { z } from "zod";

// ============================================================================
// Finansal islem enum'lari
// ============================================================================

export const transactionTypeEnum = z.enum(
  ["INCOME", "EXPENSE"],
  "Geçerli bir işlem türü seçiniz"
);

export const transactionCategoryEnum = z.enum(
  [
    "MILK_SALE",
    "ANIMAL_SALE",
    "SUBSIDY",
    "FEED",
    "VETERINARY",
    "MEDICATION",
    "EQUIPMENT",
    "LABOR",
    "FUEL",
    "UTILITIES",
    "OTHER",
  ],
  "Geçerli bir kategori seçiniz"
);

// Gelir kategorileri
export const INCOME_CATEGORIES = [
  "MILK_SALE",
  "ANIMAL_SALE",
  "SUBSIDY",
  "OTHER",
] as const;

// Gider kategorileri
export const EXPENSE_CATEGORIES = [
  "FEED",
  "VETERINARY",
  "MEDICATION",
  "EQUIPMENT",
  "LABOR",
  "FUEL",
  "UTILITIES",
  "OTHER",
] as const;

// ============================================================================
// Finansal islem olusturma schemasi
// ============================================================================

export const transactionSchema = z.object({
  type: transactionTypeEnum,
  category: transactionCategoryEnum,
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır"),
  date: z.coerce.date(),
  description: z.string().trim().min(1, "Açıklama gereklidir"),
  invoiceNumber: z.string().trim().optional(),
  invoiceUrl: z.string().trim().url("Geçerli bir URL giriniz").optional().or(z.literal("")),
  animalId: z.string().uuid().optional(),
  notes: z.string().trim().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

// ============================================================================
// Finansal islem guncelleme schemasi
// ============================================================================

export const transactionUpdateSchema = transactionSchema.partial();

export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;

// ============================================================================
// Finansal islem filtreleme / sorgu parametreleri schemasi
// ============================================================================

export const transactionFilterSchema = z.object({
  type: transactionTypeEnum.optional(),
  category: transactionCategoryEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
