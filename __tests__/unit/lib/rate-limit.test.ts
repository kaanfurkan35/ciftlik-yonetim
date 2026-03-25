import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows first request', () => {
    const result = rateLimit('test-1', 5, 60000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('allows multiple requests within limit', () => {
    for (let i = 0; i < 4; i++) {
      const result = rateLimit('test-2', 5, 60000)
      expect(result.success).toBe(true)
    }
  })

  it('blocks after exceeding limit', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('test-3', 5, 60000)
    }
    const result = rateLimit('test-3', 5, 60000)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets after window expires', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('test-4', 5, 60000)
    }
    // Should be blocked
    expect(rateLimit('test-4', 5, 60000).success).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(61000)

    // Should be allowed again
    const result = rateLimit('test-4', 5, 60000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('tracks different identifiers independently', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('user-a', 5, 60000)
    }
    expect(rateLimit('user-a', 5, 60000).success).toBe(false)
    expect(rateLimit('user-b', 5, 60000).success).toBe(true)
  })
})
