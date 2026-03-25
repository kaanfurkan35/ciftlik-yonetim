import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Must set env before import
beforeEach(() => {
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
})

// Dynamic import to get fresh module
async function getValidateOrigin() {
  const mod = await import('@/lib/csrf')
  return mod.validateOrigin
}

function makeRequest(method: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    method,
    headers,
  })
}

describe('validateOrigin', () => {
  it('allows GET requests', async () => {
    const validateOrigin = await getValidateOrigin()
    expect(validateOrigin(makeRequest('GET'))).toBe(true)
  })

  it('allows HEAD requests', async () => {
    const validateOrigin = await getValidateOrigin()
    expect(validateOrigin(makeRequest('HEAD'))).toBe(true)
  })

  it('allows OPTIONS requests', async () => {
    const validateOrigin = await getValidateOrigin()
    expect(validateOrigin(makeRequest('OPTIONS'))).toBe(true)
  })

  it('allows POST with no origin or referer (same-origin)', async () => {
    const validateOrigin = await getValidateOrigin()
    expect(validateOrigin(makeRequest('POST'))).toBe(true)
  })

  it('allows POST with valid origin', async () => {
    const validateOrigin = await getValidateOrigin()
    expect(validateOrigin(makeRequest('POST', { origin: 'http://localhost:3000' }))).toBe(true)
  })

  it('allows POST with valid referer', async () => {
    const validateOrigin = await getValidateOrigin()
    expect(validateOrigin(makeRequest('POST', { referer: 'http://localhost:3000/some-page' }))).toBe(true)
  })

  it('rejects POST with invalid origin', async () => {
    const validateOrigin = await getValidateOrigin()
    expect(validateOrigin(makeRequest('POST', { origin: 'http://evil.com' }))).toBe(false)
  })

  it('rejects POST with invalid referer', async () => {
    const validateOrigin = await getValidateOrigin()
    expect(validateOrigin(makeRequest('POST', { referer: 'http://evil.com/attack' }))).toBe(false)
  })
})
