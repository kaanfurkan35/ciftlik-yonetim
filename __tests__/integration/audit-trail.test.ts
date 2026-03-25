import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Audit Trail', () => {
  it('creates audit log with correct params', () => {
    createAuditLog({
      userId: 'user-1',
      farmId: 'farm-a',
      action: 'CREATE',
      entityType: 'Animal',
      entityId: 'animal-1',
      changes: { name: 'Sarıkız' },
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'CREATE',
        entityType: 'Animal',
        entityId: 'animal-1',
      }),
    })
  })

  it('is fire-and-forget (does not block)', () => {
    // createAuditLog returns void (not a promise)
    const result = createAuditLog({
      userId: 'user-1',
      farmId: 'farm-a',
      action: 'DELETE',
      entityType: 'Animal',
      entityId: 'animal-1',
    })

    expect(result).toBeUndefined()
  })

  it('suppresses errors (logs to console)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('DB error'))

    createAuditLog({
      userId: 'user-1',
      farmId: 'farm-a',
      action: 'UPDATE',
      entityType: 'Animal',
    })

    // Wait for the catch to fire
    await new Promise((r) => setTimeout(r, 10))

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
