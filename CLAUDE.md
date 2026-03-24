# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma db seed   # Seed database (prisma/seed.ts)
npx prisma studio    # Visual database browser
```

## Architecture

**Turkish-language cattle farm management system** (Çiftlik Yönetim) — multi-tenant SaaS with RBAC.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL · Prisma 6 · NextAuth v5 (JWT + Credentials) · TailwindCSS v4 · shadcn/ui (@base-ui/react) · Zustand · TanStack Query + Table · React Hook Form + Zod · Recharts

### Route Groups

- `src/app/(auth)/` — Login page (unauthenticated)
- `src/app/(dashboard)/` — All protected pages, guarded by layout auth check
- `src/app/api/` — REST API routes per domain (animals, health, breeding, milk, feeding, finance, pastures, tasks, etc.)

### Key Libraries

| Path | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth config with JWT callbacks (8h maxAge), session enrichment (role, farmId) |
| `src/lib/permissions.ts` | RBAC permission matrix: ADMIN, MANAGER, WORKER, VIEWER |
| `src/lib/api-response.ts` | `apiSuccess()` / `apiError()` helpers |
| `src/lib/prisma.ts` | Prisma singleton client (imports env validation) |
| `src/lib/constants.ts` | Turkish label mappings, status colors (theme-aware, no hardcoded Tailwind colors) |
| `src/lib/validations/` | Zod schemas per domain — `sortBy` fields use `z.enum()` whitelists |
| `src/lib/audit.ts` | `createAuditLog()` — fire-and-forget audit trail for CRUD operations |
| `src/lib/notifications.ts` | `createNotification()` + scheduled alert checks (vaccination, feed stock, calving) |
| `src/lib/format.ts` | Turkish locale formatters: `formatCurrency()`, `formatDate()`, `formatNumber()`, etc. |
| `src/lib/rate-limit.ts` | In-memory sliding window rate limiter (login: 5/15min) |
| `src/lib/csrf.ts` | Origin/Referer validation for mutation requests |
| `src/lib/env.ts` | Zod validation of required env vars (DATABASE_URL, AUTH_SECRET) |
| `src/proxy.ts` | Next.js 16 middleware — auth + CSRF protection (replaces middleware.ts) |

### API Route Pattern

Every API route follows this sequence:
1. `auth()` — require session
2. `checkPermission(role, action, resource)` — RBAC gate (**including GET endpoints**)
3. Zod validation of request body/params
4. Tenant isolation — all queries scoped by `session.user.farmId`
5. Prisma operation (use `$transaction()` for multi-step mutations)
6. `createAuditLog()` — fire-and-forget on mutations
7. Return `apiSuccess()`/`apiError()` with proper HTTP status

Pagination params: `page`, `limit` (max 100), `sortBy` (whitelisted via `z.enum`), `sortOrder`, `search`.

Error catch pattern: always check for permission error (`"Bu işlem için yetkiniz bulunmuyor"`) → 403 before generic 500.

Next.js 16 params: `{ params }: { params: Promise<{ id: string }> }` — use `const { id } = await params;`

### Data Patterns

- **Soft deletes**: All models use `deletedAt` field; queries always filter `deletedAt: null`; DELETE endpoints set `deletedAt: new Date()`
- **Audit trail**: `createAuditLog()` from `src/lib/audit.ts` on all CRUD mutations (fire-and-forget)
- **Multi-tenancy**: Every query is scoped to `farmId` from the user's session
- **Notifications**: `createNotification()` for event-driven alerts; `POST /api/notifications/check` for scheduled checks

### Component Organization

- `src/components/ui/` — shadcn/ui primitives (Button auto-sets `nativeButton={false}` when `render` prop used)
- `src/components/<domain>/` — Domain-specific components (e.g., `animals/`)
- `src/components/layout/` — AppSidebar, TopBar, MobileNav
- `src/components/shared/` — PageHeader, EmptyState, StatCard, DataTable, ConfirmDialog, FormFieldError
- `src/components/providers/` — Context providers (query, theme, auth)

### Page Pattern

Server component `page.tsx` fetches initial data → renders client component `*-client.tsx` for interactivity. TanStack Query for client-side data fetching/mutations.

### Theme

Organic Biophilic farm theme — earth green + harvest gold. OKLCH color space. All status colors use CSS variables (success, destructive, primary, accent) — **never hardcode Tailwind color classes**.

### All UI text is in Turkish

Labels and constants are in `src/lib/constants.ts`. Use `src/lib/format.ts` for dates, currency, and numbers. The app locale is `tr`.
