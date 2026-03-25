import { describe, it, expect } from 'vitest'
import {
  heatRecordSchema,
  inseminationRecordSchema,
  pregnancyCheckSchema,
  calvingRecordSchema,
  breedingFilterSchema,
} from '@/lib/validations/breeding'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

describe('heatRecordSchema', () => {
  it('accepts valid heat record', () => {
    expect(heatRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
      intensity: 'STRONG',
    }).success).toBe(true)
  })

  it('rejects invalid intensity', () => {
    expect(heatRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
      intensity: 'VERY_STRONG',
    }).success).toBe(false)
  })
})

describe('inseminationRecordSchema', () => {
  it('accepts valid insemination', () => {
    expect(inseminationRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
      type: 'ARTIFICIAL',
    }).success).toBe(true)
  })

  it('accepts optional bullId', () => {
    expect(inseminationRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
      type: 'NATURAL',
      bullId: uuid,
    }).success).toBe(true)
  })

  it('rejects invalid insemination type', () => {
    expect(inseminationRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
      type: 'IVF',
    }).success).toBe(false)
  })
})

describe('pregnancyCheckSchema', () => {
  it('accepts valid pregnancy check', () => {
    expect(pregnancyCheckSchema.safeParse({
      animalId: uuid,
      checkDate: '2024-06-15',
      result: 'POSITIVE',
    }).success).toBe(true)
  })

  it('rejects invalid result', () => {
    expect(pregnancyCheckSchema.safeParse({
      animalId: uuid,
      checkDate: '2024-06-15',
      result: 'MAYBE',
    }).success).toBe(false)
  })

  it('accepts all valid results', () => {
    for (const result of ['POSITIVE', 'NEGATIVE', 'INCONCLUSIVE']) {
      expect(pregnancyCheckSchema.safeParse({
        animalId: uuid,
        checkDate: '2024-06-15',
        result,
      }).success).toBe(true)
    }
  })
})

describe('calvingRecordSchema', () => {
  it('accepts valid calving record', () => {
    expect(calvingRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
    }).success).toBe(true)
  })

  it('rejects dystociaScore over 5', () => {
    expect(calvingRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
      dystociaScore: 6,
    }).success).toBe(false)
  })

  it('rejects dystociaScore under 1', () => {
    expect(calvingRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
      dystociaScore: 0,
    }).success).toBe(false)
  })

  it('accepts optional calfId', () => {
    expect(calvingRecordSchema.safeParse({
      animalId: uuid,
      date: '2024-06-15',
      calfId: uuid,
    }).success).toBe(true)
  })
})

describe('breedingFilterSchema', () => {
  it('provides defaults', () => {
    const result = breedingFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
      expect(result.data.sortOrder).toBe('desc')
    }
  })
})
