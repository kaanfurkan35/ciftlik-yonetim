import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => {
  const createMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
  })
  return { prisma: { transaction: createMock(), animal: createMock() } }
})

vi.mock('@/lib/audit', () => ({ createAuditLog: vi.fn() }))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

import { GET, POST } from '@/app/api/finance/route'
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

describe('GET /api/finance', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest('/api/finance'))
    expect(res.status).toBe(401)
  })

  it('returns transactions scoped to farmId', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
    vi.mocked(prisma.transaction.count).mockResolvedValue(0)

    const res = await GET(makeRequest('/api/finance'))
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})

describe('POST /api/finance', () => {
  const validBody = {
    type: 'INCOME',
    category: 'MILK_SALE',
    amount: 5000,
    date: '2024-06-15',
    description: 'Süt satışı',
  }

  it('returns 403 for VIEWER role', async () => {
    mockAuth.mockResolvedValue(viewerSession)
    const res = await POST(makeRequest('/api/finance', 'POST', validBody))
    expect(res.status).toBe(403)
  })

  it('creates transaction', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.transaction.create).mockResolvedValue({ id: 'tx-1', ...validBody } as any)

    const res = await POST(makeRequest('/api/finance', 'POST', validBody))
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('validates animalId if provided', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null)

    const res = await POST(makeRequest('/api/finance', 'POST', {
      ...validBody,
      animalId: '550e8400-e29b-41d4-a716-446655440000',
    }))
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid body', async () => {
    mockAuth.mockResolvedValue(adminSession)
    const res = await POST(makeRequest('/api/finance', 'POST', { type: 'INVALID' }))
    expect(res.status).toBe(400)
  })
})
