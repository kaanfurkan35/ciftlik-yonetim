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
      animal: createMock(),
      milkRecord: createMock(),
      task: createMock(),
      user: createMock(),
      transaction: createMock(),
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

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { GET as getAnimals } from '@/app/api/animals/route'
import { POST as postMilk } from '@/app/api/milk/route'
import { POST as postTasks } from '@/app/api/tasks/route'
import { GET as getFinance } from '@/app/api/finance/route'

const farmASession = {
  user: { id: 'admin-a', email: 'admin@farm-a.com', name: 'Admin A', role: 'ADMIN', farmId: 'farm-a', farmName: 'Farm A' },
}

function makeRequest(url: string, method = 'GET', body?: Record<string, unknown>) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) init.body = JSON.stringify(body)
  return new NextRequest(`http://localhost:3000${url}`, init)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(farmASession)
})

describe('Tenant Isolation', () => {
  it('Animals GET scopes to farmId', async () => {
    vi.mocked(prisma.animal.findMany).mockResolvedValue([])
    vi.mocked(prisma.animal.count).mockResolvedValue(0)

    await getAnimals(makeRequest('/api/animals'))

    const call = vi.mocked(prisma.animal.findMany).mock.calls[0][0] as any
    expect(call.where.farmId).toBe('farm-a')
  })

  it('Milk POST rejects animal from different farm', async () => {
    vi.mocked(prisma.animal.findFirst).mockResolvedValue(null)

    const res = await postMilk(makeRequest('/api/milk', 'POST', {
      animalId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2024-06-15',
      session: 'MORNING',
      quantity: 20,
    }))
    expect(res.status).toBe(404)
  })

  it('Tasks POST rejects user from different farm', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)

    const res = await postTasks(makeRequest('/api/tasks', 'POST', {
      title: 'Test task',
      assignedToId: '550e8400-e29b-41d4-a716-446655440000',
    }))
    expect(res.status).toBe(404)
  })

  it('Finance GET scopes transactions to farmId', async () => {
    vi.mocked((prisma as any).transaction.findMany).mockResolvedValue([])
    vi.mocked((prisma as any).transaction.count).mockResolvedValue(0)

    await getFinance(makeRequest('/api/finance'))

    const call = vi.mocked((prisma as any).transaction.findMany).mock.calls[0][0] as any
    expect(call.where.farmId).toBe('farm-a')
  })
})
