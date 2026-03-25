import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock matchMedia for SidebarProvider's useIsMobile hook
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

const mockPathname = vi.fn().mockReturnValue('/')
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation')
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    usePathname: () => mockPathname(),
    useSearchParams: () => new URLSearchParams(),
  }
})

import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

function renderWithSidebar(ui: React.ReactElement) {
  return render(<SidebarProvider>{ui}</SidebarProvider>)
}

describe('AppSidebar', () => {
  it('renders navigation items', () => {
    renderWithSidebar(<AppSidebar />)
    expect(screen.getByText('Hayvanlar')).toBeInTheDocument()
    expect(screen.getByText('Sağlık')).toBeInTheDocument()
    expect(screen.getByText('Süt Verimi')).toBeInTheDocument()
    expect(screen.getByText('Finans')).toBeInTheDocument()
  })

  it('renders farm name when provided', () => {
    renderWithSidebar(<AppSidebar farmName="Test Çiftliği" />)
    expect(screen.getByText('Test Çiftliği')).toBeInTheDocument()
  })

  it('shows notification badge when count > 0', () => {
    renderWithSidebar(<AppSidebar notificationCount={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('does not show badge when count is 0', () => {
    renderWithSidebar(<AppSidebar notificationCount={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
