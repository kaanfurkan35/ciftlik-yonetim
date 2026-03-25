import { describe, it, expect } from 'vitest'
import { feedTypeSchema, feedingRecordSchema, feedPurchaseSchema } from '@/lib/validations/feeding'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

describe('feedTypeSchema', () => {
  it('accepts valid feed type', () => {
    expect(feedTypeSchema.safeParse({
      name: 'Yonca',
      unit: 'KG',
    }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(feedTypeSchema.safeParse({
      name: '',
      unit: 'KG',
    }).success).toBe(false)
  })

  it('rejects negative currentStock', () => {
    expect(feedTypeSchema.safeParse({
      name: 'Yonca',
      unit: 'KG',
      currentStock: -10,
    }).success).toBe(false)
  })

  it('defaults stock to 0', () => {
    const result = feedTypeSchema.safeParse({ name: 'Yonca', unit: 'KG' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currentStock).toBe(0)
      expect(result.data.minimumStock).toBe(0)
    }
  })
})

describe('feedingRecordSchema', () => {
  it('accepts valid feeding record', () => {
    expect(feedingRecordSchema.safeParse({
      feedTypeId: uuid,
      quantity: 50,
      date: '2024-06-15',
    }).success).toBe(true)
  })

  it('rejects negative quantity', () => {
    expect(feedingRecordSchema.safeParse({
      feedTypeId: uuid,
      quantity: -10,
      date: '2024-06-15',
    }).success).toBe(false)
  })

  it('rejects zero quantity', () => {
    expect(feedingRecordSchema.safeParse({
      feedTypeId: uuid,
      quantity: 0,
      date: '2024-06-15',
    }).success).toBe(false)
  })
})

describe('feedPurchaseSchema', () => {
  it('accepts valid purchase', () => {
    expect(feedPurchaseSchema.safeParse({
      feedTypeId: uuid,
      quantity: 1000,
      totalCost: 5000,
      date: '2024-06-15',
    }).success).toBe(true)
  })

  it('rejects zero totalCost', () => {
    expect(feedPurchaseSchema.safeParse({
      feedTypeId: uuid,
      quantity: 1000,
      totalCost: 0,
      date: '2024-06-15',
    }).success).toBe(false)
  })
})
