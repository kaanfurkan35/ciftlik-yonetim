import { z } from "zod";

// ============================================================================
// Gorev durum ve oncelik enum'lari
// ============================================================================

export const taskStatusEnum = z.enum(
  ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  "Geçersiz görev durumu"
);

export const taskPriorityEnum = z.enum(
  ["LOW", "MEDIUM", "HIGH", "URGENT"],
  "Geçersiz öncelik seviyesi"
);

// ============================================================================
// Gorev olusturma schemasi
// ============================================================================

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Görev başlığı zorunludur"),
  description: z.string().trim().optional(),
  status: taskStatusEnum.default("PENDING"),
  priority: taskPriorityEnum.default("MEDIUM"),
  dueDate: z.coerce.date().optional(),
  assignedToId: z.string().uuid("Geçersiz kullanıcı ID"),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

// ============================================================================
// Gorev guncelleme schemasi (tum alanlar opsiyonel)
// ============================================================================

export const taskUpdateSchema = taskCreateSchema.partial();

export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

// ============================================================================
// Gorev filtreleme schemasi
// ============================================================================

export const taskFilterSchema = z.object({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assignedToId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sortBy: z.enum(["createdAt", "dueDate", "priority", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
