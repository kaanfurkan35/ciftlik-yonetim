import { vi } from 'vitest'

function createModelMock() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue({}),
  }
}

export const mockPrisma = {
  animal: createModelMock(),
  animalGroup: createModelMock(),
  animalGroupMembership: createModelMock(),
  user: createModelMock(),
  farm: createModelMock(),
  weightRecord: createModelMock(),
  vaccinationType: createModelMock(),
  vaccinationRecord: createModelMock(),
  healthRecord: createModelMock(),
  medicineInventory: createModelMock(),
  heatRecord: createModelMock(),
  inseminationRecord: createModelMock(),
  pregnancyCheck: createModelMock(),
  calvingRecord: createModelMock(),
  milkRecord: createModelMock(),
  milkSale: createModelMock(),
  feedType: createModelMock(),
  feedPurchase: createModelMock(),
  feedingRecord: createModelMock(),
  transaction: createModelMock(),
  pasture: createModelMock(),
  grazingRecord: createModelMock(),
  notification: createModelMock(),
  task: createModelMock(),
  auditLog: createModelMock(),
  backupRecord: createModelMock(),
  $transaction: vi.fn(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)),
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))
