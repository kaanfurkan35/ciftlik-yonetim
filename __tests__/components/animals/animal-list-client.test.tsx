import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock fetch for delete operations
const mockFetch = vi.fn()
global.fetch = mockFetch

import { AnimalListClient } from '@/components/animals/animal-list-client'

const mockAnimals = [
  {
    id: '1',
    earTagNumber: 'TR-001',
    name: 'Sarıkız',
    breed: 'Holstein',
    sex: 'FEMALE',
    status: 'ACTIVE',
    dateOfBirth: '2020-01-15',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    earTagNumber: 'TR-002',
    name: 'Karabaş',
    breed: 'Simental',
    sex: 'MALE',
    status: 'ACTIVE',
    dateOfBirth: '2021-06-20',
    createdAt: '2024-01-01',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
})

describe('AnimalListClient', () => {
  it('renders animal rows', () => {
    render(<AnimalListClient animals={mockAnimals as any} />)
    expect(screen.getByText('TR-001')).toBeInTheDocument()
    expect(screen.getByText('TR-002')).toBeInTheDocument()
    expect(screen.getByText('Sarıkız')).toBeInTheDocument()
    expect(screen.getByText('Karabaş')).toBeInTheDocument()
  })

  it('renders breed info', () => {
    render(<AnimalListClient animals={mockAnimals as any} />)
    expect(screen.getByText('Holstein')).toBeInTheDocument()
    expect(screen.getByText('Simental')).toBeInTheDocument()
  })

  it('shows empty state when no animals', () => {
    render(<AnimalListClient animals={[]} />)
    expect(screen.getByText(/kayıt bulunamadı/i)).toBeInTheDocument()
  })

  it('filters by search input', async () => {
    render(<AnimalListClient animals={mockAnimals as any} />)
    const searchInput = screen.getByPlaceholderText(/ara/i)
    fireEvent.change(searchInput, { target: { value: 'Sarıkız' } })

    await waitFor(() => {
      expect(screen.getByText('Sarıkız')).toBeInTheDocument()
      expect(screen.queryByText('Karabaş')).not.toBeInTheDocument()
    })
  })

  it('shows animal count', () => {
    render(<AnimalListClient animals={mockAnimals as any} />)
    expect(screen.getByText('2 hayvan')).toBeInTheDocument()
  })
})
