import { faker } from '@faker-js/faker'

export function createMockAnimal(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    earTagNumber: `TR-${faker.number.int({ min: 10000, max: 99999 })}`,
    name: faker.animal.cow(),
    breed: faker.helpers.arrayElement(['Holstein', 'Simental', 'Jersey', 'Angus', 'Montofon']),
    sex: faker.helpers.arrayElement(['MALE', 'FEMALE']),
    color: faker.color.human(),
    dateOfBirth: faker.date.past({ years: 5 }),
    dateOfDeath: null,
    deathCause: null,
    status: 'ACTIVE',
    acquisitionType: faker.helpers.arrayElement(['BORN', 'PURCHASED']),
    acquisitionDate: faker.date.past({ years: 3 }),
    acquisitionPrice: null,
    photoUrls: [],
    notes: null,
    motherId: null,
    fatherId: null,
    currentGroupId: null,
    farmId: 'farm-a',
    createdById: 'user-1',
    createdAt: faker.date.past(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

export function createMockMilkRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    animalId: faker.string.uuid(),
    date: new Date(),
    session: faker.helpers.arrayElement(['MORNING', 'EVENING', 'TOTAL']),
    quantity: faker.number.float({ min: 5, max: 40, fractionDigits: 1 }),
    fatPercentage: faker.number.float({ min: 2, max: 6, fractionDigits: 1 }),
    proteinPercentage: faker.number.float({ min: 2, max: 5, fractionDigits: 1 }),
    somaticCellCount: faker.number.int({ min: 50000, max: 500000 }),
    notes: null,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

export function createMockHealthRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    animalId: faker.string.uuid(),
    type: faker.helpers.arrayElement(['VET_VISIT', 'TREATMENT', 'SURGERY', 'DEWORMING', 'CHECKUP', 'OTHER']),
    date: new Date(),
    diagnosis: faker.lorem.sentence(),
    treatment: faker.lorem.sentence(),
    medication: faker.lorem.word(),
    dosage: '5ml',
    withdrawalEndDate: null,
    vetName: faker.person.fullName(),
    cost: faker.number.float({ min: 50, max: 2000, fractionDigits: 2 }),
    notes: null,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

export function createMockTransaction(overrides: Record<string, unknown> = {}) {
  const type = faker.helpers.arrayElement(['INCOME', 'EXPENSE'])
  return {
    id: faker.string.uuid(),
    type,
    category: type === 'INCOME'
      ? faker.helpers.arrayElement(['MILK_SALE', 'ANIMAL_SALE', 'SUBSIDY', 'OTHER'])
      : faker.helpers.arrayElement(['FEED', 'VETERINARY', 'MEDICATION', 'EQUIPMENT', 'LABOR', 'FUEL', 'UTILITIES', 'OTHER']),
    amount: faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }),
    date: new Date(),
    description: faker.lorem.sentence(),
    invoiceNumber: faker.string.alphanumeric(8),
    invoiceUrl: null,
    animalId: null,
    notes: null,
    farmId: 'farm-a',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

export function createMockTask(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence({ min: 3, max: 6 }),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    dueDate: faker.date.future(),
    completedAt: null,
    assignedToId: 'worker-1',
    farmId: 'farm-a',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

export function createMockFeedType(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(['Yonca', 'Arpa', 'Misir Silaji', 'Saman', 'Karma Yem']),
    unit: faker.helpers.arrayElement(['KG', 'TON']),
    currentStock: 500,
    minimumStock: 100,
    costPerUnit: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }),
    farmId: 'farm-a',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    passwordHash: '$2b$12$fakehash',
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    role: 'WORKER',
    avatarUrl: null,
    isActive: true,
    farmId: 'farm-a',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

export function createMockNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    userId: 'user-1',
    type: 'GENERAL',
    title: faker.lorem.sentence({ min: 3, max: 6 }),
    message: faker.lorem.sentence(),
    isRead: false,
    readAt: null,
    relatedEntityId: null,
    relatedEntityType: null,
    farmId: 'farm-a',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}

export function createMockCalvingRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    animalId: faker.string.uuid(),
    calfId: null,
    date: new Date(),
    dystociaScore: faker.number.int({ min: 1, max: 5 }),
    complications: null,
    notes: null,
    assistedById: 'user-1',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }
}
