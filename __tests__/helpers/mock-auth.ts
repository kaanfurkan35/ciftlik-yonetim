import { vi } from 'vitest'

export function createMockSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: 'user-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'ADMIN' as const,
      farmId: 'farm-a',
      farmName: 'Test Farm A',
      ...overrides,
    },
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  }
}

export const adminSession = createMockSession({
  id: 'admin-1',
  email: 'admin@farm-a.com',
  name: 'Admin User',
  role: 'ADMIN',
  farmId: 'farm-a',
  farmName: 'Farm A',
})

export const managerSession = createMockSession({
  id: 'manager-1',
  email: 'manager@farm-a.com',
  name: 'Manager User',
  role: 'MANAGER',
  farmId: 'farm-a',
  farmName: 'Farm A',
})

export const workerSession = createMockSession({
  id: 'worker-1',
  email: 'worker@farm-a.com',
  name: 'Worker User',
  role: 'WORKER',
  farmId: 'farm-a',
  farmName: 'Farm A',
})

export const viewerSession = createMockSession({
  id: 'viewer-1',
  email: 'viewer@farm-a.com',
  name: 'Viewer User',
  role: 'VIEWER',
  farmId: 'farm-a',
  farmName: 'Farm A',
})

// Different farm for tenant isolation tests
export const otherFarmSession = createMockSession({
  id: 'other-admin-1',
  email: 'admin@farm-b.com',
  name: 'Other Admin',
  role: 'ADMIN',
  farmId: 'farm-b',
  farmName: 'Farm B',
})

// In mock-auth.ts, we just export the sessions.
// The actual mocking of auth() is done in each test file via vi.mock('@/lib/auth')
