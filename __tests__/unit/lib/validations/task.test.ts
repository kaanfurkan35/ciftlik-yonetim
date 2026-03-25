import { describe, it, expect } from 'vitest'
import { taskCreateSchema, taskFilterSchema } from '@/lib/validations/task'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

describe('taskCreateSchema', () => {
  const validTask = {
    title: 'Aşı yapılacak',
    assignedToId: uuid,
  }

  it('accepts valid task', () => {
    expect(taskCreateSchema.safeParse(validTask).success).toBe(true)
  })

  it('requires title', () => {
    expect(taskCreateSchema.safeParse({ assignedToId: uuid }).success).toBe(false)
  })

  it('rejects empty title', () => {
    expect(taskCreateSchema.safeParse({ title: '', assignedToId: uuid }).success).toBe(false)
  })

  it('requires assignedToId', () => {
    expect(taskCreateSchema.safeParse({ title: 'Test' }).success).toBe(false)
  })

  it('rejects invalid assignedToId', () => {
    expect(taskCreateSchema.safeParse({ title: 'Test', assignedToId: 'not-uuid' }).success).toBe(false)
  })

  it('rejects invalid status', () => {
    expect(taskCreateSchema.safeParse({ ...validTask, status: 'DONE' }).success).toBe(false)
  })

  it('rejects invalid priority', () => {
    expect(taskCreateSchema.safeParse({ ...validTask, priority: 'CRITICAL' }).success).toBe(false)
  })

  it('defaults status to PENDING', () => {
    const result = taskCreateSchema.safeParse(validTask)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('PENDING')
    }
  })

  it('defaults priority to MEDIUM', () => {
    const result = taskCreateSchema.safeParse(validTask)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM')
    }
  })
})

describe('taskFilterSchema', () => {
  it('defaults limit to 50', () => {
    const result = taskFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
    }
  })

  it('rejects invalid sortBy', () => {
    expect(taskFilterSchema.safeParse({ sortBy: 'invalid' }).success).toBe(false)
  })

  it('accepts valid sortBy values', () => {
    for (const sortBy of ['createdAt', 'dueDate', 'priority', 'status']) {
      expect(taskFilterSchema.safeParse({ sortBy }).success).toBe(true)
    }
  })
})
