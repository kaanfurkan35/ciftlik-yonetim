import { describe, it, expect } from 'vitest'
import { transactionSchema, transactionFilterSchema } from '@/lib/validations/finance'

describe('transactionSchema', () => {
  const validTransaction = {
    type: 'INCOME',
    category: 'MILK_SALE',
    amount: 5000,
    date: '2024-06-15',
    description: 'Süt satışı',
  }

  it('accepts valid transaction', () => {
    expect(transactionSchema.safeParse(validTransaction).success).toBe(true)
  })

  it('rejects invalid type', () => {
    expect(transactionSchema.safeParse({ ...validTransaction, type: 'TRANSFER' }).success).toBe(false)
  })

  it('rejects invalid category', () => {
    expect(transactionSchema.safeParse({ ...validTransaction, category: 'INVALID' }).success).toBe(false)
  })

  it('rejects zero amount', () => {
    expect(transactionSchema.safeParse({ ...validTransaction, amount: 0 }).success).toBe(false)
  })

  it('rejects negative amount', () => {
    expect(transactionSchema.safeParse({ ...validTransaction, amount: -100 }).success).toBe(false)
  })

  it('requires description', () => {
    const { description, ...rest } = validTransaction
    expect(transactionSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects empty description', () => {
    expect(transactionSchema.safeParse({ ...validTransaction, description: '' }).success).toBe(false)
  })

  it('accepts empty string for invoiceUrl', () => {
    expect(transactionSchema.safeParse({ ...validTransaction, invoiceUrl: '' }).success).toBe(true)
  })

  it('rejects invalid invoiceUrl', () => {
    expect(transactionSchema.safeParse({ ...validTransaction, invoiceUrl: 'not-a-url' }).success).toBe(false)
  })

  it('accepts all valid categories', () => {
    const categories = ['MILK_SALE', 'ANIMAL_SALE', 'SUBSIDY', 'FEED', 'VETERINARY', 'MEDICATION', 'EQUIPMENT', 'LABOR', 'FUEL', 'UTILITIES', 'OTHER']
    for (const category of categories) {
      expect(transactionSchema.safeParse({ ...validTransaction, category }).success).toBe(true)
    }
  })
})

describe('transactionFilterSchema', () => {
  it('provides defaults', () => {
    const result = transactionFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sortBy).toBe('date')
      expect(result.data.sortOrder).toBe('desc')
    }
  })

  it('rejects invalid sortBy', () => {
    expect(transactionFilterSchema.safeParse({ sortBy: 'invalid' }).success).toBe(false)
  })
})
