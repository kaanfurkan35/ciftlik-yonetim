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
        // Create a mini tx mock
        const tx = {
          feedingRecord: { create: vi.fn().mockResolvedValue({ id: 'new-record' }) },
          feedType: { update: vi.fn().mockResolvedValue({}) },
        }
        return fn(tx)
      }),
    },
  }
})

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

import { GET, POST } from '@/app/api/feeding/records/route'
import { prisma } from '@/lib/prisma'

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', farmId: 'farm-a', farmName: 'Farm A' },
}

const viewerSession = {
  user: { id: 'viewer-1', email: 'viewer@test.com', name: 'Viewer', role: 'VIEWER', farmId: 'farm-a', farmName: 'Farm A' },
}

function makeRequest(url: string, method = 'GET', body?: Record<string, unknown>) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) init.body = JSON.stringify(body)
  return new NextRequest(`http://localhost:3000${url}`, init)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/feeding/records', () => {
  const validBody = {
    feedTypeId: '550e8400-e29b-41d4-a716-446655440000',
    quantity: 50,
    date: '2024-06-15',
  }

  it('returns 403 for VIEWER role', async () => {
    mockAuth.mockResolvedValue(viewerSession)
    const res = await POST(makeRequest('/api/feeding/records', 'POST', validBody))
    expect(res.status).toBe(403)
  })

  it('returns 404 when feedType not in same farm', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.feedType.findFirst).mockResolvedValue(null)

    const res = await POST(makeRequest('/api/feeding/records', 'POST', validBody))
    expect(res.status).toBe(404)
  })

  it('returns 400 for insufficient stock', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.feedType.findFirst).mockResolvedValue({
      id: validBody.feedTypeId,
      farmId: 'farm-a',
      currentStock: 30, // less than requested 50
      unit: 'KG',
    } as any)

    const res = await POST(makeRequest('/api/feeding/records', 'POST', validBody))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Yetersiz stok')
  })

  it('creates record and decrements stock in transaction', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.feedType.findFirst).mockResolvedValue({
      id: validBody.feedTypeId,
      farmId: 'farm-a',
      currentStock: 500,
      unit: 'KG',
    } as any)

    const res = await POST(makeRequest('/api/feeding/records', 'POST', validBody))
    const json = await res.json()
    expect(json.success).toBe(true)

    // Verify $transaction was called
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('returns 400 for invalid body', async () => {
    mockAuth.mockResolvedValue(adminSession)
    const res = await POST(makeRequest('/api/feeding/records', 'POST', { quantity: -10 }))
    expect(res.status).toBe(400)
  })
})
