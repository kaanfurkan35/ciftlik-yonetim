import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => {
  const createMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
  })
  return { prisma: { milkRecord: createMock(), animal: createMock() } }
})

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

import { prisma } from '@/lib/prisma'

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', farmId: 'farm-a', farmName: 'Farm A' },
}

function makeRequest(url: string, method = 'GET', body?: Record<string, unknown>) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) init.body = JSON.stringify(body)
  return new NextRequest(`http://localhost:3000${url}`, init)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(adminSession)
})

describe('Animal-Milk Cross Dependency', () => {
  const milkBody = {
    animalId: '550e8400-e29b-41d4-a716-446655440000',
    date: '2024-06-15',
    session: 'MORNING',
    quantity: 25,
  }

  it('milk record requires animal in same farm', async () => {
    const { POST } = await import('@/app/api/milk/route')
    // Animal not found (different farm or doesn't exist)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null)

    const res = await POST(makeRequest('/api/milk', 'POST', milkBody))
    expect(res.status).toBe(404)
  })

  it('milk record succeeds when animal exists in same farm', async () => {
    const { POST } = await import('@/app/api/milk/route')
    vi.mocked(prisma.animal.findFirst).mockResolvedValue({
      id: milkBody.animalId,
      farmId: 'farm-a',
      status: 'LACTATING',
    } as any)
    vi.mocked(prisma.milkRecord.create).mockResolvedValue({
      id: 'milk-1',
      ...milkBody,
      animal: { id: milkBody.animalId, name: 'Sarıkız', earTagNumber: 'TR-001' },
    } as any)

    const res = await POST(makeRequest('/api/milk', 'POST', milkBody))
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('animal findFirst is called with farmId scope', async () => {
    const { POST } = await import('@/app/api/milk/route')
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null)

    await POST(makeRequest('/api/milk', 'POST', milkBody))

    expect(prisma.animal.findFirst).toHaveBeenCalledWith({
      where: {
        id: milkBody.animalId,
        farmId: 'farm-a',
        deletedAt: null,
      },
    })
  })
})
