import { describe, it, expect } from 'vitest'
import { animalCreateSchema, animalFilterSchema } from '@/lib/validations/animal'

describe('animalCreateSchema', () => {
  const validAnimal = {
    earTagNumber: 'TR-12345',
    breed: 'Holstein',
    sex: 'FEMALE',
    acquisitionType: 'BORN',
  }

  it('accepts valid animal data', () => {
    const result = animalCreateSchema.safeParse(validAnimal)
    expect(result.success).toBe(true)
  })

  it('requires earTagNumber', () => {
    const { earTagNumber, ...rest } = validAnimal
    const result = animalCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('requires breed', () => {
    const { breed, ...rest } = validAnimal
    const result = animalCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('requires sex', () => {
    const { sex, ...rest } = validAnimal
    const result = animalCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects invalid sex enum', () => {
    const result = animalCreateSchema.safeParse({ ...validAnimal, sex: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status enum', () => {
    const result = animalCreateSchema.safeParse({ ...validAnimal, status: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('rejects negative acquisitionPrice', () => {
    const result = animalCreateSchema.safeParse({ ...validAnimal, acquisitionPrice: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid UUID for motherId', () => {
    const result = animalCreateSchema.safeParse({ ...validAnimal, motherId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('defaults status to ACTIVE', () => {
    const result = animalCreateSchema.safeParse(validAnimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('ACTIVE')
    }
  })

  it('accepts all valid status enums', () => {
    const statuses = ['ACTIVE', 'SOLD', 'DECEASED', 'DRY', 'LACTATING', 'PREGNANT', 'CALF']
    for (const status of statuses) {
      const result = animalCreateSchema.safeParse({ ...validAnimal, status })
      expect(result.success).toBe(true)
    }
  })
})

describe('animalFilterSchema', () => {
  it('provides defaults', () => {
    const result = animalFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
      expect(result.data.sortBy).toBe('createdAt')
      expect(result.data.sortOrder).toBe('desc')
    }
  })

  it('rejects limit over 100', () => {
    const result = animalFilterSchema.safeParse({ limit: 200 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid sortBy', () => {
    const result = animalFilterSchema.safeParse({ sortBy: 'malicious_field' })
    expect(result.success).toBe(false)
  })

  it('accepts valid sortBy values', () => {
    const validSorts = ['createdAt', 'earTagNumber', 'name', 'dateOfBirth', 'status']
    for (const sortBy of validSorts) {
      const result = animalFilterSchema.safeParse({ sortBy })
      expect(result.success).toBe(true)
    }
  })
})
