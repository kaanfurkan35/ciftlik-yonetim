import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: () => ({
    data: { user: { id: 'user-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' } },
    status: 'authenticated',
  }),
}))

// Mock SidebarTrigger which needs SidebarProvider context
vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <button>Menu</button>,
}))

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}))

import { TopBar } from '@/components/layout/top-bar'

const mockUser = {
  name: 'Test Admin',
  email: 'admin@test.com',
  image: null,
  role: 'ADMIN',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TopBar', () => {
  it('renders user avatar trigger', () => {
    render(<TopBar user={mockUser} />)
    // User name is inside dropdown content (portal), so check the avatar trigger
    expect(screen.getByLabelText('Kullanıcı menüsü')).toBeInTheDocument()
  })

  it('shows notification badge when count > 0', () => {
    render(<TopBar user={mockUser} notificationCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not show badge when count is 0', () => {
    render(<TopBar user={mockUser} notificationCount={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders theme toggle button', () => {
    render(<TopBar user={mockUser} />)
    expect(screen.getByLabelText('Tema değiştir')).toBeInTheDocument()
  })

  it('renders notification button', () => {
    render(<TopBar user={mockUser} />)
    expect(screen.getByLabelText('Bildirimler')).toBeInTheDocument()
  })
})
