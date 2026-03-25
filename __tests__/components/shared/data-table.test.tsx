import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DataTable } from '@/components/shared/data-table'
import { ColumnDef } from '@tanstack/react-table'

interface TestRow {
  id: string
  name: string
  status: string
}

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'name', header: 'İsim' },
  { accessorKey: 'status', header: 'Durum' },
]

const data: TestRow[] = [
  { id: '1', name: 'Test 1', status: 'Aktif' },
  { id: '2', name: 'Test 2', status: 'Pasif' },
  { id: '3', name: 'Test 3', status: 'Aktif' },
]

describe('DataTable', () => {
  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Test 1')).toBeInTheDocument()
    expect(screen.getByText('Test 2')).toBeInTheDocument()
    expect(screen.getByText('Test 3')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('İsim')).toBeInTheDocument()
    expect(screen.getByText('Durum')).toBeInTheDocument()
  })

  it('shows empty state message when no data', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText(/kayıt bulunamadı/i)).toBeInTheDocument()
  })

  it('renders search input when searchKey provided', () => {
    render(<DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="İsim ara..." />)
    expect(screen.getByPlaceholderText('İsim ara...')).toBeInTheDocument()
  })
})
