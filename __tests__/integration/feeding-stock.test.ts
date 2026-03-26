import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => {
  const createMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
  })
  return {
    prisma: {
      feedingRecord: createMock(),
      feedType: createMock(),
      animal: createMock(),
      animalGroup: createMock(),
      $transaction: vi.fn(async (fn: any) => {
        const tx = {
          feedingRecord: { create: vi.fn().mockResolvedValue({ id: 'record-1' }) },
          feedType: { update: vi.fn().mockResolvedValue({}) },
        }
        return fn(tx)
      }),
    },
  }
})

vi.mock('@/lib/audit', () => ({ createAuditLog: vi.fn() }))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

import { prisma } from '@/lib/prisma'

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', farmId: 'farm-a', farmName: 'Farm A' },
}

const feedTypeId = '550e8400-e29b-41d4-a716-446655440000'

function makeRequest(url: string, method = 'GET', body?: Record<string, unknown>) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) init.body = JSON.stringify(body)
  return new NextRequest(`http://localhost:3000${url}`, init)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(adminSession)
})

describe('Feeding-Stock Cross Dependency', () => {
  it('rejects feeding when stock is insufficient', async () => {
    const { POST } = await import('@/app/api/feeding/records/route')

    vi.mocked(prisma.feedType.findFirst).mockResolvedValue({
      id: feedTypeId,
      farmId: 'farm-a',
      currentStock: 30,
      unit: 'KG',
    } as any)

    const res = await POST(makeRequest('/api/feeding/records', 'POST', {
      feedTypeId,
      quantity: 50,
      date: '2024-06-15',
    }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Yetersiz stok')
    expect(json.error).toContain('30')
  })

  it('allows feeding when stock equals quantity (exact match)', async () => {
    const { POST } = await import('@/app/api/feeding/records/route')

    vi.mocked(prisma.feedType.findFirst).mockResolvedValue({
      id: feedTypeId,
      farmId: 'farm-a',
      currentStock: 50,
      unit: 'KG',
    } as any)

    const res = await POST(makeRequest('/api/feeding/records', 'POST', {
      feedTypeId,
      quantity: 50,
      date: '2024-06-15',
    }))

    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('uses $transaction for atomic stock decrement', async () => {
    const { POST } = await import('@/app/api/feeding/records/route')

    vi.mocked(prisma.feedType.findFirst).mockResolvedValue({
      id: feedTypeId,
      farmId: 'farm-a',
      currentStock: 500,
      unit: 'KG',
    } as any)

    await POST(makeRequest('/api/feeding/records', 'POST', {
      feedTypeId,
      quantity: 100,
      date: '2024-06-15',
    }))

    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('rejects when feedType belongs to different farm', async () => {
    const { POST } = await import('@/app/api/feeding/records/route')

    vi.mocked(prisma.feedType.findFirst).mockResolvedValue(null)

    const res = await POST(makeRequest('/api/feeding/records', 'POST', {
      feedTypeId,
      quantity: 10,
      date: '2024-06-15',
    }))

    expect(res.status).toBe(404)
  })
})
