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

import { prisma } from '@/lib/prisma'

const adminSession = {
  user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', farmId: 'farm-a', farmName: 'Farm A' },
}

const assigneeId = '550e8400-e29b-41d4-a716-446655440000'

function makeRequest(url: string, method = 'GET', body?: Record<string, unknown>) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) init.body = JSON.stringify(body)
  return new NextRequest(`http://localhost:3000${url}`, init)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(adminSession)
})

describe('Task-Notification Cross Dependency', () => {
  it('task creation sends TASK_ASSIGNED notification to assignee', async () => {
    const { POST } = await import('@/app/api/tasks/route')

    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: assigneeId,
      farmId: 'farm-a',
      isActive: true,
    } as any)

    vi.mocked(prisma.task.create).mockResolvedValue({
      id: 'task-1',
      title: 'Aşı yapılacak',
      assignedToId: assigneeId,
    } as any)

    await POST(makeRequest('/api/tasks', 'POST', {
      title: 'Aşı yapılacak',
      assignedToId: assigneeId,
    }))

    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
      farmId: 'farm-a',
      userId: assigneeId,
      type: 'TASK_ASSIGNED',
      title: 'Yeni Görev',
    }))
  })

  it('rejects task assignment to user from different farm', async () => {
    const { POST } = await import('@/app/api/tasks/route')
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)

    const res = await POST(makeRequest('/api/tasks', 'POST', {
      title: 'Cross-farm task',
      assignedToId: assigneeId,
    }))

    expect(res.status).toBe(404)
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })
})
