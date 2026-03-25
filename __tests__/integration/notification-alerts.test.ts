import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => {
  const createMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
  })
  return {
    prisma: {
      vaccinationRecord: createMock(),
      feedType: createMock(),
      pregnancyCheck: createMock(),
      notification: createMock(),
      user: createMock(),
    },
  }
})

import { prisma } from '@/lib/prisma'
import {
  createNotification,
  checkVaccinationDueAlerts,
  checkFeedStockAlerts,
  checkCalvingAlerts,
} from '@/lib/notifications'

const farmId = 'farm-a'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createNotification', () => {
  it('creates notification for specific user', async () => {
    await createNotification({
      farmId,
      userId: 'user-1',
      type: 'GENERAL',
      title: 'Test',
      message: 'Test message',
    })

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        farmId,
        userId: 'user-1',
        type: 'GENERAL',
      }),
    })
  })

  it('broadcasts to all farm users when no userId', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'user-1' },
      { id: 'user-2' },
    ] as any)

    await createNotification({
      farmId,
      type: 'GENERAL',
      title: 'Broadcast',
      message: 'To all users',
    })

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: 'user-1' }),
        expect.objectContaining({ userId: 'user-2' }),
      ]),
    })
  })

  it('handles errors gracefully', async () => {
    vi.mocked(prisma.notification.create).mockRejectedValue(new Error('DB error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await createNotification({
      farmId,
      userId: 'user-1',
      type: 'GENERAL',
      title: 'Test',
      message: 'Test',
    })

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('checkVaccinationDueAlerts', () => {
  it('creates notifications for records due within 7 days', async () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    vi.mocked(prisma.vaccinationRecord.findMany).mockResolvedValue([
      {
        id: 'vacc-1',
        nextDueDate: futureDate,
        animal: { name: 'Sarıkız', earTagNumber: 'TR-001' },
        vaccinationType: { name: 'Şap Aşısı' },
      },
    ] as any)

    // No existing notifications (dedup check)
    vi.mocked(prisma.notification.findMany).mockResolvedValue([])

    // createNotification broadcasts (no userId) → needs users
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'user-1' }] as any)

    await checkVaccinationDueAlerts(farmId)

    // createNotification was called without userId → broadcasts via createMany
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          farmId,
          type: 'VACCINATION_DUE',
          title: 'Aşı Zamanı Yaklaşıyor',
        }),
      ]),
    })
  })

  it('skips already-notified records (deduplication)', async () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    vi.mocked(prisma.vaccinationRecord.findMany).mockResolvedValue([
      {
        id: 'vacc-1',
        nextDueDate: futureDate,
        animal: { name: 'Sarıkız', earTagNumber: 'TR-001' },
        vaccinationType: { name: 'Şap Aşısı' },
      },
    ] as any)

    // Already notified
    vi.mocked(prisma.notification.findMany).mockResolvedValue([
      { relatedEntityId: 'vacc-1' },
    ] as any)

    await checkVaccinationDueAlerts(farmId)

    expect(prisma.notification.create).not.toHaveBeenCalled()
    expect(prisma.notification.createMany).not.toHaveBeenCalled()
  })

  it('does nothing when no records are due', async () => {
    vi.mocked(prisma.vaccinationRecord.findMany).mockResolvedValue([])

    await checkVaccinationDueAlerts(farmId)

    expect(prisma.notification.findMany).not.toHaveBeenCalled()
  })
})

describe('checkFeedStockAlerts', () => {
  it('creates notification for low stock feeds', async () => {
    vi.mocked(prisma.feedType.findMany).mockResolvedValue([
      { id: 'feed-1', name: 'Yonca', currentStock: 50, minimumStock: 100, unit: 'KG' },
    ] as any)

    // No existing notifications
    vi.mocked(prisma.notification.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'user-1' }] as any)

    await checkFeedStockAlerts(farmId)

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          farmId,
          type: 'FEED_LOW',
          title: 'Yem Stoku Düşük',
        }),
      ]),
    })
  })

  it('skips when stock is above minimum', async () => {
    vi.mocked(prisma.feedType.findMany).mockResolvedValue([
      { id: 'feed-1', name: 'Yonca', currentStock: 200, minimumStock: 100, unit: 'KG' },
    ] as any)

    await checkFeedStockAlerts(farmId)

    expect(prisma.notification.findMany).not.toHaveBeenCalled()
  })
})

describe('checkCalvingAlerts', () => {
  it('creates notification for expected calvings within 14 days', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    vi.mocked(prisma.pregnancyCheck.findMany).mockResolvedValue([
      {
        id: 'preg-1',
        expectedCalvingDate: futureDate,
        animal: { name: 'Sarıkız', earTagNumber: 'TR-001' },
      },
    ] as any)

    vi.mocked(prisma.notification.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'user-1' }] as any)

    await checkCalvingAlerts(farmId)

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          farmId,
          type: 'CALVING_EXPECTED',
          title: 'Doğum Yaklaşıyor',
        }),
      ]),
    })
  })

  it('skips already-notified pregnancy checks', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    vi.mocked(prisma.pregnancyCheck.findMany).mockResolvedValue([
      {
        id: 'preg-1',
        expectedCalvingDate: futureDate,
        animal: { name: 'Sarıkız', earTagNumber: 'TR-001' },
      },
    ] as any)

    vi.mocked(prisma.notification.findMany).mockResolvedValue([
      { relatedEntityId: 'preg-1' },
    ] as any)

    await checkCalvingAlerts(farmId)

    expect(prisma.notification.create).not.toHaveBeenCalled()
    expect(prisma.notification.createMany).not.toHaveBeenCalled()
  })
})
