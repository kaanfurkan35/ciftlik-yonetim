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

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL · Prisma 6 · NextAuth v5 (JWT + Credentials) · TailwindCSS v4 · shadcn/ui · Zustand · TanStack Query + Table · React Hook Form + Zod · Recharts

### Route Groups

- `src/app/(auth)/` — Login page (unauthenticated)
- `src/app/(dashboard)/` — All protected pages, guarded by layout auth check
- `src/app/api/` — REST API routes per domain (animals, health, breeding, milk, feeding, finance, pastures, tasks, etc.)

### Key Libraries

| Path | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth config with JWT callbacks, session enrichment (role, farmId) |
| `src/lib/permissions.ts` | RBAC permission matrix: ADMIN, MANAGER, WORKER, VIEWER |
| `src/lib/api-response.ts` | `apiSuccess()` / `apiError()` / `apiPaginated()` helpers |
| `src/lib/prisma.ts` | Prisma singleton client |
| `src/lib/constants.ts` | Turkish label mappings and enums |
| `src/lib/validations/` | Zod schemas per domain (animal, breeding, feeding, finance, health, milk, pasture, task) |

### API Route Pattern

Every API route follows this sequence:
1. `auth()` — require session
2. `checkPermission(role, action, resource)` — RBAC gate
3. Zod validation of request body
4. Tenant isolation — all queries scoped by `session.user.farmId`
5. Prisma operation
6. Return `apiSuccess()`/`apiError()` with proper HTTP status

Pagination params: `page`, `limit` (max 100), `sortBy`, `sortOrder`, `search`.

### Data Patterns

- **Soft deletes**: All models use `deletedAt` field; queries always filter `deletedAt: null`; DELETE endpoints set `deletedAt: new Date()`
- **Audit trail**: `AuditLog` model tracks changes; most entities have `createdById`
- **Multi-tenancy**: Every query is scoped to `farmId` from the user's session

### Component Organization

- `src/components/ui/` — shadcn/ui primitives
- `src/components/<domain>/` — Domain-specific components (e.g., `animals/`)
- `src/components/layout/` — AppSidebar, TopBar, MobileNav
- `src/components/shared/` — PageHeader, EmptyState, StatCard
- `src/components/providers/` — Context providers (query, theme, auth)

### Page Pattern

Server component `page.tsx` fetches initial data → renders client component `*-client.tsx` for interactivity. TanStack Query for client-side data fetching/mutations.

### All UI text is in Turkish

Labels and constants are in `src/lib/constants.ts`. The app locale is `tr`.
