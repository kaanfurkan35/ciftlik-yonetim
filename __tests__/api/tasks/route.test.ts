import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => {
  const createMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
  })
  return { prisma: { task: createMock(), user: createMock() } }
})

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}))

const mockCreateNotification = vi.fn()
vi.mock('@/lib/notifications', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}))

import { GET, POST } from '@/app/api/tasks/route'
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

describe('GET /api/tasks', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest('/api/tasks'))
    expect(res.status).toBe(401)
  })

  it('returns tasks scoped to farmId', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.task.findMany).mockResolvedValue([])
    vi.mocked(prisma.task.count).mockResolvedValue(0)

    const res = await GET(makeRequest('/api/tasks'))
    const json = await res.json()
    expect(json.success).toBe(true)

    const call = vi.mocked(prisma.task.findMany).mock.calls[0][0] as any
    expect(call.where.farmId).toBe('farm-a')
  })
})

describe('POST /api/tasks', () => {
  const validBody = {
    title: 'Aşı yapılacak',
    assignedToId: '550e8400-e29b-41d4-a716-446655440000',
  }

  it('returns 403 for VIEWER role', async () => {
    mockAuth.mockResolvedValue(viewerSession)
    const res = await POST(makeRequest('/api/tasks', 'POST', validBody))
    expect(res.status).toBe(403)
  })

  it('returns 404 when assigned user not in same farm', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)

    const res = await POST(makeRequest('/api/tasks', 'POST', validBody))
    expect(res.status).toBe(404)
  })

  it('creates task and sends TASK_ASSIGNED notification', async () => {
    mockAuth.mockResolvedValue(adminSession)
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: validBody.assignedToId, farmId: 'farm-a' } as any)
    vi.mocked(prisma.task.create).mockResolvedValue({
      id: 'task-1',
      title: validBody.title,
      assignedToId: validBody.assignedToId,
    } as any)

    const res = await POST(makeRequest('/api/tasks', 'POST', validBody))
    const json = await res.json()
    expect(json.success).toBe(true)

    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      farmId: 'farm-a',
      userId: validBody.assignedToId,
      type: 'TASK_ASSIGNED',
    }))
  })

  it('returns 400 for invalid body', async () => {
    mockAuth.mockResolvedValue(adminSession)
    const res = await POST(makeRequest('/api/tasks', 'POST', { title: '' }))
    expect(res.status).toBe(400)
  })
})
