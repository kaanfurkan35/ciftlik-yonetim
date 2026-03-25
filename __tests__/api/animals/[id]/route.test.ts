import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => {
  const createMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
  })
  return { prisma: { animal: createMock(), auditLog: createMock() } }
})

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
}))

import { GET, PUT, DELETE } from '@/app/api/animals/[id]/route'
import { prisma } from '@/lib/prisma'

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', farmId: 'farm-a', farmName: 'Farm A' },
}

const viewerSession = {
  user: { id: 'viewer-1', email: 'viewer@test.com', name: 'Viewer', role: 'VIEWER', farmId: 'farm-a', farmName: 'Farm A' },
}

const workerSession = {
  user: { id: 'worker-1', email: 'worker@test.com', name: 'Worker', role: 'WORKER', farmId: 'farm-a', farmName: 'Farm A' },
}

const mockParams = { params: Promise.resolve({ id: 'animal-1' }) }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) init.body = JSON.stringify(body)
  return new NextRequest('http://localhost:3000/api/animals/animal-1', init)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/animals/[id]', () => {
  it('returns animal with relations', async () => {
    mockAuth.mockResolvedValue(adminSession)
    const mockAnimal = { id: 'animal-1', earTagNumber: 'TR-001', farmId: 'farm-a' }
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(mockAnimal as any)

    const res = await GET(makeRequest(), mockParams)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.id).toBe('animal-1')
  })

  it('returns 404 for animal from different farm', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null)

    const res = await GET(makeRequest(), mockParams)
    expect(res.status).toBe(404)
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest(), mockParams)
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/animals/[id]', () => {
  it('updates animal', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue({ id: 'animal-1', earTagNumber: 'TR-001', farmId: 'farm-a' } as any)
    vi.mocked(prisma.animal.update).mockResolvedValue({ id: 'animal-1', name: 'Updated' } as any)

    const res = await PUT(makeRequest('PUT', { name: 'Updated' }), mockParams)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 403 for VIEWER role', async () => {
    mockAuth.mockResolvedValue(viewerSession)
    const res = await PUT(makeRequest('PUT', { name: 'Updated' }), mockParams)
    expect(res.status).toBe(403)
  })

  it('returns 404 when animal not found', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null)
    const res = await PUT(makeRequest('PUT', { name: 'Updated' }), mockParams)
    expect(res.status).toBe(404)
  })

  it('checks for duplicate earTagNumber on change', async () => {
    mockAuth.mockResolvedValue(adminSession)
    // First call: existing animal found
    vi.mocked(prisma.animal.findFirst)
      .mockResolvedValueOnce({ id: 'animal-1', earTagNumber: 'TR-001', farmId: 'farm-a' } as any)
      // Second call: duplicate found
      .mockResolvedValueOnce({ id: 'other-animal', earTagNumber: 'TR-002' } as any)

    const res = await PUT(makeRequest('PUT', { earTagNumber: 'TR-002' }), mockParams)
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/animals/[id]', () => {
  it('soft-deletes animal', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue({ id: 'animal-1', farmId: 'farm-a' } as any)
    vi.mocked(prisma.animal.update).mockResolvedValue({} as any)

    const res = await DELETE(makeRequest('DELETE'), mockParams)
    const json = await res.json()
    expect(json.success).toBe(true)

    const updateCall = vi.mocked(prisma.animal.update).mock.calls[0][0] as any
    expect(updateCall.data.deletedAt).toBeInstanceOf(Date)
  })

  it('returns 403 for WORKER role', async () => {
    mockAuth.mockResolvedValue(workerSession)
    const res = await DELETE(makeRequest('DELETE'), mockParams)
    expect(res.status).toBe(403)
  })

  it('returns 404 when animal not found', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null)
    const res = await DELETE(makeRequest('DELETE'), mockParams)
    expect(res.status).toBe(404)
  })
})
