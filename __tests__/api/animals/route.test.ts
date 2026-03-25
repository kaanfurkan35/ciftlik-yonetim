import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock prisma before importing route
vi.mock('@/lib/prisma', () => {
  const createMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
  })
  return {
    prisma: {
      animal: createMock(),
      auditLog: createMock(),
    },
  }
})

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
}))

import { GET, POST } from '@/app/api/animals/route'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', farmId: 'farm-a', farmName: 'Farm A' },
}

const viewerSession = {
  user: { id: 'viewer-1', email: 'viewer@test.com', name: 'Viewer', role: 'VIEWER', farmId: 'farm-a', farmName: 'Farm A' },
}

function makeRequest(url: string, method = 'GET', body?: Record<string, unknown>) {
  const fullUrl = `http://localhost:3000${url}`
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) init.body = JSON.stringify(body)
  return new NextRequest(fullUrl, init)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/animals', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest('/api/animals'))
    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json.success).toBe(false)
  })

  it('returns paginated animals for authenticated user', async () => {
    mockAuth.mockResolvedValue(adminSession)
    const mockAnimals = [{ id: '1', earTagNumber: 'TR-001', name: 'Sarı' }]
    vi.mocked(prisma.animal.findMany).mockResolvedValue(mockAnimals as any)
    vi.mocked(prisma.animal.count).mockResolvedValue(1)

    const res = await GET(makeRequest('/api/animals'))
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toEqual(mockAnimals)
    expect(json.meta.total).toBe(1)
  })

  it('scopes query to farmId', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findMany).mockResolvedValue([])
    vi.mocked(prisma.animal.count).mockResolvedValue(0)

    await GET(makeRequest('/api/animals'))

    const findManyCall = vi.mocked(prisma.animal.findMany).mock.calls[0][0] as any
    expect(findManyCall.where.farmId).toBe('farm-a')
    expect(findManyCall.where.deletedAt).toBeNull()
  })

  it('applies search filter', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findMany).mockResolvedValue([])
    vi.mocked(prisma.animal.count).mockResolvedValue(0)

    await GET(makeRequest('/api/animals?search=Sarı'))

    const findManyCall = vi.mocked(prisma.animal.findMany).mock.calls[0][0] as any
    expect(findManyCall.where.OR).toBeDefined()
    expect(findManyCall.where.OR).toHaveLength(2)
  })

  it('applies status filter', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findMany).mockResolvedValue([])
    vi.mocked(prisma.animal.count).mockResolvedValue(0)

    await GET(makeRequest('/api/animals?status=LACTATING'))

    const findManyCall = vi.mocked(prisma.animal.findMany).mock.calls[0][0] as any
    expect(findManyCall.where.status).toBe('LACTATING')
  })

  it('returns 400 for invalid filter params', async () => {
    mockAuth.mockResolvedValue(adminSession)
    const res = await GET(makeRequest('/api/animals?sortBy=malicious_field'))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/animals', () => {
  const validBody = {
    earTagNumber: 'TR-99999',
    breed: 'Holstein',
    sex: 'FEMALE',
    acquisitionType: 'BORN',
  }

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest('/api/animals', 'POST', validBody))
    expect(res.status).toBe(401)
  })

  it('returns 403 for VIEWER role', async () => {
    mockAuth.mockResolvedValue(viewerSession)
    const res = await POST(makeRequest('/api/animals', 'POST', validBody))
    expect(res.status).toBe(403)
  })

  it('creates animal with farmId and createdById', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null) // no duplicate
    const created = { id: 'new-id', ...validBody, farmId: 'farm-a' }
    vi.mocked(prisma.animal.create).mockResolvedValue(created as any)

    const res = await POST(makeRequest('/api/animals', 'POST', validBody))
    const json = await res.json()
    expect(json.success).toBe(true)

    const createCall = vi.mocked(prisma.animal.create).mock.calls[0][0] as any
    expect(createCall.data.farmId).toBe('farm-a')
    expect(createCall.data.createdById).toBe('admin-1')
  })

  it('returns 409 for duplicate earTagNumber', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue({ id: 'existing' } as any)

    const res = await POST(makeRequest('/api/animals', 'POST', validBody))
    expect(res.status).toBe(409)
  })

  it('returns 400 for invalid body', async () => {
    mockAuth.mockResolvedValue(adminSession)
    const res = await POST(makeRequest('/api/animals', 'POST', { sex: 'INVALID' }))
    expect(res.status).toBe(400)
  })

  it('calls createAuditLog on success', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.animal.create).mockResolvedValue({ id: 'new-id' } as any)

    await POST(makeRequest('/api/animals', 'POST', validBody))
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'CREATE',
      entityType: 'Animal',
    }))
  })
})
