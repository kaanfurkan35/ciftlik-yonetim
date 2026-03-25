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

import { GET, POST } from '@/app/api/milk/route'
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

describe('GET /api/milk', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest('/api/milk'))
    expect(res.status).toBe(401)
  })

  it('returns paginated records', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.milkRecord.findMany).mockResolvedValue([])
    vi.mocked(prisma.milkRecord.count).mockResolvedValue(0)

    const res = await GET(makeRequest('/api/milk'))
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('scopes query to farmId via animal relation', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.milkRecord.findMany).mockResolvedValue([])
    vi.mocked(prisma.milkRecord.count).mockResolvedValue(0)

    await GET(makeRequest('/api/milk'))

    const call = vi.mocked(prisma.milkRecord.findMany).mock.calls[0][0] as any
    expect(call.where.animal.farmId).toBe('farm-a')
  })
})

describe('POST /api/milk', () => {
  const validBody = {
    animalId: '550e8400-e29b-41d4-a716-446655440000',
    date: '2024-06-15',
    session: 'MORNING',
    quantity: 25.5,
  }

  it('returns 403 for VIEWER role', async () => {
    mockAuth.mockResolvedValue(viewerSession)
    const res = await POST(makeRequest('/api/milk', 'POST', validBody))
    expect(res.status).toBe(403)
  })

  it('returns 404 when animal not in same farm', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null) // not found

    const res = await POST(makeRequest('/api/milk', 'POST', validBody))
    expect(res.status).toBe(404)
  })

  it('creates milk record for valid data', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue({ id: validBody.animalId, farmId: 'farm-a' } as any)
    vi.mocked(prisma.milkRecord.create).mockResolvedValue({ id: 'new-milk', ...validBody } as any)

    const res = await POST(makeRequest('/api/milk', 'POST', validBody))
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 400 for invalid body', async () => {
    mockAuth.mockResolvedValue(adminSession)
    const res = await POST(makeRequest('/api/milk', 'POST', { session: 'INVALID' }))
    expect(res.status).toBe(400)
  })
})
