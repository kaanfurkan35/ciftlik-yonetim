import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock fetch for drag updates
const mockFetch = vi.fn()
global.fetch = mockFetch

// Import after mocks
import { KanbanBoard } from '@/app/(dashboard)/gorevler/kanban-board'

const mockTasks = [
  {
    id: 'task-1',
    title: 'Aşı yapılacak',
    description: 'Holstein sürüsü',
    status: 'PENDING',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    assignedTo: { id: 'user-1', name: 'Ahmet', avatarUrl: null },
  },
  {
    id: 'task-2',
    title: 'Yem siparişi',
    description: 'Yonca sipariş ver',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: null,
    assignedTo: { id: 'user-2', name: 'Mehmet', avatarUrl: null },
  },
  {
    id: 'task-3',
    title: 'Süt analizi',
    description: 'Laboratuvar sonuçları',
    status: 'COMPLETED',
    priority: 'LOW',
    dueDate: null,
    assignedTo: { id: 'user-1', name: 'Ahmet', avatarUrl: null },
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
})

describe('KanbanBoard', () => {
  it('renders three status columns', () => {
    render(<KanbanBoard tasks={mockTasks as any} />)
    expect(screen.getByText(/bekliyor/i)).toBeInTheDocument()
    expect(screen.getByText(/devam ediyor/i)).toBeInTheDocument()
    expect(screen.getByText(/tamamlandı/i)).toBeInTheDocument()
  })

  it('displays task titles', () => {
    render(<KanbanBoard tasks={mockTasks as any} />)
    expect(screen.getByText('Aşı yapılacak')).toBeInTheDocument()
    expect(screen.getByText('Yem siparişi')).toBeInTheDocument()
    expect(screen.getByText('Süt analizi')).toBeInTheDocument()
  })

  it('shows assignee names', () => {
    render(<KanbanBoard tasks={mockTasks as any} />)
    expect(screen.getAllByText('Ahmet').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Mehmet').length).toBeGreaterThanOrEqual(1)
  })

  it('shows priority badges', () => {
    render(<KanbanBoard tasks={mockTasks as any} />)
    expect(screen.getByText(/yüksek/i)).toBeInTheDocument()
    expect(screen.getByText(/orta/i)).toBeInTheDocument()
    expect(screen.getByText(/düşük/i)).toBeInTheDocument()
  })

  it('renders empty board with no tasks', () => {
    render(<KanbanBoard tasks={[]} />)
    // Should still show column headers
    expect(screen.getByText(/bekliyor/i)).toBeInTheDocument()
  })
})
