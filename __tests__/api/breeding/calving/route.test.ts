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
  return { prisma: { calvingRecord: createMock(), animal: createMock() } }
})

vi.mock('@/lib/audit', () => ({ createAuditLog: vi.fn() }))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

const mockCreateNotification = vi.fn()
vi.mock('@/lib/notifications', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}))

import { GET, POST } from '@/app/api/breeding/calving/route'
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

describe('POST /api/breeding/calving', () => {
  const validBody = {
    animalId: '550e8400-e29b-41d4-a716-446655440000',
    date: '2024-06-15',
  }

  it('returns 403 for VIEWER role', async () => {
    mockAuth.mockResolvedValue(viewerSession)
    const res = await POST(makeRequest('/api/breeding/calving', 'POST', validBody))
    expect(res.status).toBe(403)
  })

  it('returns 404 when animal not in same farm', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null)

    const res = await POST(makeRequest('/api/breeding/calving', 'POST', validBody))
    expect(res.status).toBe(404)
  })

  it('creates calving record and updates mother to LACTATING', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue({ id: validBody.animalId, farmId: 'farm-a' } as any)
    vi.mocked(prisma.calvingRecord.create).mockResolvedValue({
      id: 'calving-1',
      animal: { id: validBody.animalId, name: 'Sarıkız', earTagNumber: 'TR-001' },
    } as any)
    vi.mocked(prisma.animal.update).mockResolvedValue({} as any)

    const res = await POST(makeRequest('/api/breeding/calving', 'POST', validBody))
    const json = await res.json()
    expect(json.success).toBe(true)

    // Verify mother status updated to LACTATING
    expect(prisma.animal.update).toHaveBeenCalledWith({
      where: { id: validBody.animalId },
      data: { status: 'LACTATING' },
    })
  })

  it('creates notification on calving', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue({ id: validBody.animalId, farmId: 'farm-a' } as any)
    vi.mocked(prisma.calvingRecord.create).mockResolvedValue({
      id: 'calving-1',
      animal: { id: validBody.animalId, name: 'Sarıkız', earTagNumber: 'TR-001' },
    } as any)
    vi.mocked(prisma.animal.update).mockResolvedValue({} as any)

    await POST(makeRequest('/api/breeding/calving', 'POST', validBody))

    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      farmId: 'farm-a',
      type: 'CALVING_EXPECTED',
      title: 'Doğum Gerçekleşti',
    }))
  })

  it('validates calfId if provided', async () => {
    mockAuth.mockResolvedValue(adminSession)
    const calfId = '660e8400-e29b-41d4-a716-446655440001'
    // Mother found
    vi.mocked(prisma.animal.findFirst)
      .mockResolvedValueOnce({ id: validBody.animalId, farmId: 'farm-a' } as any)
      // Calf not found
      .mockResolvedValueOnce(null)

    const res = await POST(makeRequest('/api/breeding/calving', 'POST', { ...validBody, calfId }))
    expect(res.status).toBe(404)
  })
})
