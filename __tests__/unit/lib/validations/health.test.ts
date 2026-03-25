import { describe, it, expect } from 'vitest'
import { healthRecordSchema, vaccinationRecordSchema, healthRecordFilterSchema } from '@/lib/validations/health'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

describe('healthRecordSchema', () => {
  it('accepts valid health record', () => {
    expect(healthRecordSchema.safeParse({
      animalId: uuid,
      type: 'VET_VISIT',
      date: '2024-06-15',
    }).success).toBe(true)
  })

  it('rejects invalid type', () => {
    expect(healthRecordSchema.safeParse({
      animalId: uuid,
      type: 'INVALID_TYPE',
      date: '2024-06-15',
    }).success).toBe(false)
  })

  it('accepts all valid types', () => {
    for (const type of ['VET_VISIT', 'TREATMENT', 'SURGERY', 'DEWORMING', 'CHECKUP', 'OTHER']) {
      expect(healthRecordSchema.safeParse({
        animalId: uuid,
        type,
        date: '2024-06-15',
      }).success).toBe(true)
    }
  })

  it('rejects negative cost', () => {
    expect(healthRecordSchema.safeParse({
      animalId: uuid,
      type: 'VET_VISIT',
      date: '2024-06-15',
      cost: -50,
    }).success).toBe(false)
  })
})

describe('vaccinationRecordSchema', () => {
  it('accepts valid vaccination', () => {
    expect(vaccinationRecordSchema.safeParse({
      animalId: uuid,
      vaccinationTypeId: uuid,
      date: '2024-06-15',
    }).success).toBe(true)
  })

  it('requires vaccinationTypeId', () => {
    expect(vaccinationRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
    }).success).toBe(false)
  })
})

describe('healthRecordFilterSchema', () => {
  it('rejects invalid sortBy', () => {
    expect(healthRecordFilterSchema.safeParse({ sortBy: 'invalid' }).success).toBe(false)
  })

  it('accepts valid sortBy values', () => {
    for (const sortBy of ['createdAt', 'date', 'type']) {
      expect(healthRecordFilterSchema.safeParse({ sortBy }).success).toBe(true)
    }
  })
})
