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
      heatRecord: createMock(),
      inseminationRecord: createMock(),
      pregnancyCheck: createMock(),
      calvingRecord: createMock(),
      animal: createMock(),
      notification: createMock(),
      user: createMock(),
    },
  }
})

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(),
}))

vi.mock('@/lib/audit', () => ({ createAuditLog: vi.fn() }))

import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', farmId: 'farm-a', farmName: 'Farm A' },
}

const motherId = '550e8400-e29b-41d4-a716-446655440000'
const calfId = '660e8400-e29b-41d4-a716-446655440001'

function makeRequest(url: string, method = 'GET', body?: Record<string, unknown>) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) init.body = JSON.stringify(body)
  return new NextRequest(`http://localhost:3000${url}`, init)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(adminSession)
})

describe('Breeding Pipeline: Heat → Insemination → Pregnancy → Calving', () => {
  it('calving record updates mother status to LACTATING', async () => {
    const { POST } = await import('@/app/api/breeding/calving/route')

    vi.mocked(prisma.animal.findFirst).mockResolvedValue({
      id: motherId,
      name: 'Sarıkız',
      earTagNumber: 'TR-001',
      farmId: 'farm-a',
      status: 'PREGNANT',
    } as any)

    vi.mocked(prisma.calvingRecord.create).mockResolvedValue({
      id: 'calving-1',
      animalId: motherId,
      animal: { id: motherId, name: 'Sarıkız', earTagNumber: 'TR-001' },
    } as any)

    vi.mocked(prisma.animal.update).mockResolvedValue({} as any)

    await POST(makeRequest('/api/breeding/calving', 'POST', {
      animalId: motherId,
      date: '2024-06-15',
    }))

    expect(prisma.animal.update).toHaveBeenCalledWith({
      where: { id: motherId },
      data: { status: 'LACTATING' },
    })
  })

  it('calving with calfId validates calf exists in same farm', async () => {
    const { POST } = await import('@/app/api/breeding/calving/route')

    // Mother found
    vi.mocked(prisma.animal.findFirst)
      .mockResolvedValueOnce({ id: motherId, farmId: 'farm-a' } as any)
      // Calf found
      .mockResolvedValueOnce({ id: calfId, farmId: 'farm-a' } as any)

    vi.mocked(prisma.calvingRecord.create).mockResolvedValue({
      id: 'calving-1',
      animalId: motherId,
      calfId: calfId,
      animal: { id: motherId, name: 'Sarıkız', earTagNumber: 'TR-001' },
    } as any)

    vi.mocked(prisma.animal.update).mockResolvedValue({} as any)

    const res = await POST(makeRequest('/api/breeding/calving', 'POST', {
      animalId: motherId,
      calfId: calfId,
      date: '2024-06-15',
    }))

    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('calving creates notification for the farm', async () => {
    const { POST } = await import('@/app/api/breeding/calving/route')

    vi.mocked(prisma.animal.findFirst).mockResolvedValue({
      id: motherId, farmId: 'farm-a',
    } as any)

    vi.mocked(prisma.calvingRecord.create).mockResolvedValue({
      id: 'calving-1',
      animal: { id: motherId, name: 'Sarıkız', earTagNumber: 'TR-001' },
    } as any)

    vi.mocked(prisma.animal.update).mockResolvedValue({} as any)

    await POST(makeRequest('/api/breeding/calving', 'POST', {
      animalId: motherId,
      date: '2024-06-15',
    }))

    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      farmId: 'farm-a',
      type: 'CALVING_EXPECTED',
      title: 'Doğum Gerçekleşti',
    }))
  })
})
