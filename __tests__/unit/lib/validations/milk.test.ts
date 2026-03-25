import { describe, it, expect } from 'vitest'
import { milkRecordSchema, milkRecordFilterSchema, milkSaleSchema } from '@/lib/validations/milk'

describe('milkRecordSchema', () => {
  const validRecord = {
    animalId: '550e8400-e29b-41d4-a716-446655440000',
    date: '2024-06-15',
    session: 'MORNING',
    quantity: 25.5,
  }

  it('accepts valid milk record', () => {
    expect(milkRecordSchema.safeParse(validRecord).success).toBe(true)
  })

  it('requires animalId', () => {
    const { animalId, ...rest } = validRecord
    expect(milkRecordSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid session enum', () => {
    expect(milkRecordSchema.safeParse({ ...validRecord, session: 'AFTERNOON' }).success).toBe(false)
  })

  it('rejects negative quantity', () => {
    expect(milkRecordSchema.safeParse({ ...validRecord, quantity: -5 }).success).toBe(false)
  })

  it('rejects zero quantity', () => {
    expect(milkRecordSchema.safeParse({ ...validRecord, quantity: 0 }).success).toBe(false)
  })

  it('rejects fatPercentage over 100', () => {
    expect(milkRecordSchema.safeParse({ ...validRecord, fatPercentage: 101 }).success).toBe(false)
  })

  it('accepts optional fields', () => {
    const result = milkRecordSchema.safeParse({
      ...validRecord,
      fatPercentage: 3.5,
      proteinPercentage: 3.2,
      somaticCellCount: 200000,
      notes: 'Test note',
    })
    expect(result.success).toBe(true)
  })
})

describe('milkSaleSchema', () => {
  it('accepts valid sale', () => {
    const result = milkSaleSchema.safeParse({
      date: '2024-06-15',
      quantity: 500,
      pricePerLiter: 12.5,
      buyerName: 'Süt Fabrikası',
    })
    expect(result.success).toBe(true)
  })

  it('requires buyerName', () => {
    const result = milkSaleSchema.safeParse({
      date: '2024-06-15',
      quantity: 500,
      pricePerLiter: 12.5,
      buyerName: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('milkRecordFilterSchema', () => {
  it('rejects invalid sortBy', () => {
    expect(milkRecordFilterSchema.safeParse({ sortBy: 'invalid' }).success).toBe(false)
  })

  it('accepts valid sortBy values', () => {
    for (const sortBy of ['createdAt', 'date', 'quantity']) {
      expect(milkRecordFilterSchema.safeParse({ sortBy }).success).toBe(true)
    }
  })
})
