import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}))

import LoginPage from '@/app/(auth)/login/page'
import { signIn } from 'next-auth/react'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Login Page', () => {
  it('renders email and password inputs', () => {
    render(<LoginPage />)
    // Login page uses placeholder "ornek@ciftlik.com" for email
    expect(screen.getByPlaceholderText('ornek@ciftlik.com')).toBeInTheDocument()
    // Password uses "••••••••" placeholder
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument()
  })

  it('shows validation error for empty email submission', async () => {
    render(<LoginPage />)
    const submitButton = screen.getByRole('button', { name: /giriş yap/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/e-posta adresi gereklidir/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('ornek@ciftlik.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')

    await user.type(emailInput, 'test@test.com')
    await user.type(passwordInput, '123')

    const submitButton = screen.getByRole('button', { name: /giriş yap/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/en az 6 karakter/i)).toBeInTheDocument()
    })
  })

  it('calls signIn on valid submission', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: null, ok: true, status: 200, url: '/' })
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('ornek@ciftlik.com'), 'admin@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')

    fireEvent.click(screen.getByRole('button', { name: /giriş yap/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
        email: 'admin@test.com',
        password: 'password123',
        redirect: false,
      }))
    })
  })

  it('shows error message on failed login', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: 'CredentialsSignin', ok: false, status: 401, url: null })
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('ornek@ciftlik.com'), 'wrong@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')

    fireEvent.click(screen.getByRole('button', { name: /giriş yap/i }))

    await waitFor(() => {
      expect(screen.getByText(/hatalı/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    render(<LoginPage />)
    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Find toggle button by aria-label
    const toggleButton = screen.getByLabelText(/şifreyi göster/i)
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
