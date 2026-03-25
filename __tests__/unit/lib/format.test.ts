import { describe, it, expect, vi } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatShortDate,
  formatDateTime,
  formatNumber,
  formatWeight,
  formatQuantity,
  formatPercentage,
  formatAge,
} from '@/lib/format'

describe('formatCurrency', () => {
  it('formats positive amount in Turkish Lira', () => {
    const result = formatCurrency(1234.56)
    // Turkish locale uses comma for decimal, dot for thousands
    expect(result).toContain('1.234,56')
    expect(result).toContain('₺')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0,00')
  })

  it('formats negative amount', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500,00')
  })
})

describe('formatDate', () => {
  it('formats Date object', () => {
    const result = formatDate(new Date('2024-06-15'))
    expect(result).toContain('Haziran')
    expect(result).toContain('2024')
  })

  it('formats string date', () => {
    const result = formatDate('2024-01-01')
    expect(result).toContain('Ocak')
    expect(result).toContain('2024')
  })
})

describe('formatShortDate', () => {
  it('formats date as DD.MM.YYYY', () => {
    const result = formatShortDate(new Date('2024-06-15'))
    expect(result).toMatch(/15\.06\.2024/)
  })
})

describe('formatDateTime', () => {
  it('includes date and time', () => {
    const result = formatDateTime(new Date('2024-06-15T14:30:00'))
    expect(result).toMatch(/15\.06\.2024/)
    expect(result).toMatch(/14[.:ˆ]30/)
  })
})

describe('formatNumber', () => {
  it('formats with Turkish thousands separator', () => {
    const result = formatNumber(1234567)
    expect(result).toBe('1.234.567')
  })
})

describe('formatWeight', () => {
  it('formats weight with kg suffix', () => {
    const result = formatWeight(350.5)
    expect(result).toContain('350,5')
    expect(result).toContain('kg')
  })
})

describe('formatQuantity', () => {
  it('formats quantity with unit', () => {
    const result = formatQuantity(100.5, 'Litre')
    expect(result).toContain('100,5')
    expect(result).toContain('Litre')
  })
})

describe('formatPercentage', () => {
  it('formats percentage with % prefix', () => {
    const result = formatPercentage(3.7)
    expect(result).toBe('%3,7')
  })
})

describe('formatAge', () => {
  it('returns "-" for null', () => {
    expect(formatAge(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    expect(formatAge(undefined)).toBe('-')
  })

  it('returns years and months', () => {
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 3)
    const result = formatAge(twoYearsAgo)
    expect(result).toContain('yıl')
  })

  it('returns only months for less than a year', () => {
    const fiveMonthsAgo = new Date()
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5)
    const result = formatAge(fiveMonthsAgo)
    expect(result).toMatch(/\d+ ay/)
  })

  it('returns days for very recent birth', () => {
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
    const result = formatAge(tenDaysAgo)
    expect(result).toMatch(/\d+ gün/)
  })

  it('accepts string date', () => {
    const result = formatAge('2020-01-01')
    expect(result).toContain('yıl')
  })
})
