import { describe, it, expect } from 'vitest'
import { apiSuccess, apiError, parseSearchParams } from '@/lib/api-response'

describe('apiSuccess', () => {
  it('returns JSON with success true and data', async () => {
    const data = { id: '1', name: 'Test' }
    const response = apiSuccess(data)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data).toEqual(data)
    expect(response.status).toBe(200)
  })

  it('includes pagination meta when provided', async () => {
    const meta = { page: 1, limit: 20, total: 100, totalPages: 5 }
    const response = apiSuccess([], meta)
    const json = await response.json()
    expect(json.meta).toEqual(meta)
  })
})

describe('apiError', () => {
  it('returns 400 by default', async () => {
    const response = apiError('Hata mesajı')
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe('Hata mesajı')
    expect(response.status).toBe(400)
  })

  it('returns specified status code', async () => {
    const response = apiError('Yetkisiz', 403)
    expect(response.status).toBe(403)
  })

  it('returns 500 for server errors', async () => {
    const response = apiError('Sunucu hatası', 500)
    expect(response.status).toBe(500)
  })
})

describe('parseSearchParams', () => {
  it('returns defaults for empty params', () => {
    const params = new URLSearchParams()
    const result = parseSearchParams(params)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.sortBy).toBe('createdAt')
    expect(result.sortOrder).toBe('desc')
    expect(result.search).toBe('')
    expect(result.skip).toBe(0)
  })

  it('caps limit at 100', () => {
    const params = new URLSearchParams({ limit: '200' })
    const result = parseSearchParams(params)
    expect(result.limit).toBe(100)
  })

  it('floors limit at 1', () => {
    const params = new URLSearchParams({ limit: '-5' })
    const result = parseSearchParams(params)
    expect(result.limit).toBe(1)
  })

  it('floors page at 1', () => {
    const params = new URLSearchParams({ page: '-1' })
    const result = parseSearchParams(params)
    expect(result.page).toBe(1)
  })

  it('calculates skip correctly', () => {
    const params = new URLSearchParams({ page: '3', limit: '10' })
    const result = parseSearchParams(params)
    expect(result.skip).toBe(20)
  })

  it('parses custom sortBy and sortOrder', () => {
    const params = new URLSearchParams({ sortBy: 'name', sortOrder: 'asc' })
    const result = parseSearchParams(params)
    expect(result.sortBy).toBe('name')
    expect(result.sortOrder).toBe('asc')
  })
})
