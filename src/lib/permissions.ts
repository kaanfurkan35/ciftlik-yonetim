import type { UserRole } from "@prisma/client";

type Action = "create" | "read" | "update" | "delete" | "manage";
type Resource =
  | "animals"
  | "health"
  | "breeding"
  | "milk"
  | "feeding"
  | "finance"
  | "pastures"
  | "tasks"
  | "notifications"
  | "users"
  | "settings"
  | "backup";

const permissions: Record<UserRole, Record<Action, Resource[]>> = {
  ADMIN: {
    create: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks", "notifications", "users", "settings", "backup"],
    read: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks", "notifications", "users", "settings", "backup"],
    update: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks", "notifications", "users", "settings", "backup"],
    delete: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks", "notifications", "users", "settings", "backup"],
    manage: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks", "notifications", "users", "settings", "backup"],
  },
  MANAGER: {
    create: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks", "notifications"],
    read: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks", "notifications", "users", "settings", "backup"],
    update: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks", "notifications"],
    delete: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks"],
    manage: [],
  },
  WORKER: {
    create: ["animals", "health", "breeding", "milk", "feeding", "tasks"],
    read: ["animals", "health", "breeding", "milk", "feeding", "pastures", "tasks", "notifications"],
    update: ["animals", "health", "breeding", "milk", "feeding", "tasks"],
    delete: [],
    manage: [],
  },
  VIEWER: {
    create: [],
    read: ["animals", "health", "breeding", "milk", "feeding", "finance", "pastures", "tasks", "notifications"],
    update: [],
    delete: [],
    manage: [],
  },
};

export function hasPermission(role: UserRole, action: Action, resource: Resource): boolean {
  return permissions[role]?.[action]?.includes(resource) ?? false;
}

export function checkPermission(role: UserRole, action: Action, resource: Resource): void {
  if (!hasPermission(role, action, resource)) {
    throw new Error("Bu işlem için yetkiniz bulunmuyor");
  }
}
