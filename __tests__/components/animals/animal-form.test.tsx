import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnimalForm } from '@/components/animals/animal-form'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AnimalForm', () => {
  const mockOnSubmit = vi.fn()
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  }

  it('renders form fields', () => {
    render(<AnimalForm {...defaultProps} />)
    expect(screen.getByPlaceholderText('TR-12345678')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Örnek: Sarıkız')).toBeInTheDocument()
    expect(screen.getByText('Temel Bilgiler')).toBeInTheDocument()
  })

  it('shows submit button', () => {
    render(<AnimalForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: /kaydet/i })).toBeInTheDocument()
  })

  it('disables submit button when isSubmitting is true', () => {
    render(<AnimalForm {...defaultProps} isSubmitting={true} />)
    const submitButton = screen.getByRole('button', { name: /kaydediliyor/i })
    expect(submitButton).toBeDisabled()
  })

  it('renders cancel button', () => {
    render(<AnimalForm {...defaultProps} />)
    expect(screen.getByText('İptal')).toBeInTheDocument()
  })
})
