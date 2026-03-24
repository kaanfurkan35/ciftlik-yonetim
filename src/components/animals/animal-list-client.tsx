"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_COLORS,
  ANIMAL_SEX_LABELS,
} from "@/lib/constants"

interface AnimalRow {
  id: string
  earTagNumber: string
  name: string | null
  breed: string | null
  sex: string
  status: string
  dateOfBirth: string | null
  motherName: string | null
  fatherName: string | null
}

function calculateAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "-"
  const birth = new Date(dateOfBirth)
  const now = new Date()
  const diffMs = now.getTime() - birth.getTime()
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years > 0 && months > 0) return `${years} yıl ${months} ay`
  if (years > 0) return `${years} yıl`
  if (months > 0) return `${months} ay`
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return `${days} gün`
}

const columns: ColumnDef<AnimalRow>[] = [
  {
    accessorKey: "earTagNumber",
    header: "Kulak No",
    cell: ({ row }) => (
      <Link
        href={`/hayvanlar/${row.original.id}`}
        className="font-bold font-mono hover:underline"
      >
        {row.original.earTagNumber}
      </Link>
    ),
  },
  {
    accessorKey: "name",
    header: "İsim",
    cell: ({ row }) => row.original.name || "-",
  },
  {
    accessorKey: "breed",
    header: "Irk",
    cell: ({ row }) => row.original.breed || "-",
  },
  {
    accessorKey: "sex",
    header: "Cinsiyet",
    cell: ({ row }) => ANIMAL_SEX_LABELS[row.original.sex] ?? row.original.sex,
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge
          className={ANIMAL_STATUS_COLORS[status] ?? ""}
        >
          {ANIMAL_STATUS_LABELS[status] ?? status}
        </Badge>
      )
    },
  },
  {
    id: "age",
    header: "Yaş",
    cell: ({ row }) => calculateAge(row.original.dateOfBirth),
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => <ActionsCell animal={row.original} />,
  },
]

function ActionsCell({ animal }: { animal: AnimalRow }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/animals/${animal.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error("Silme işlemi başarısız oldu")
      }
      toast.success("Hayvan başarıyla silindi")
      router.refresh()
    } catch {
      toast.error("Hayvan silinirken bir hata oluştu")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">İşlemler</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/hayvanlar/${animal.id}`)}
          >
            <Eye className="size-4" />
            Detay
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/hayvanlar/${animal.id}/duzenle`)}
          >
            <Pencil className="size-4" />
            Düzenle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hayvanı Sil"
        description={`"${animal.name || animal.earTagNumber}" adlı hayvanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        onConfirm={handleDelete}
        confirmText={isDeleting ? "Siliniyor..." : "Sil"}
        cancelText="İptal"
        variant="destructive"
      />
    </>
  )
}

interface AnimalListClientProps {
  animals: AnimalRow[]
}

export function AnimalListClient({ animals }: AnimalListClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const filteredAnimals =
    statusFilter === "ALL"
      ? animals
      : animals.filter((a) => a.status === statusFilter)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as string)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Durumlar</SelectItem>
            {Object.entries(ANIMAL_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredAnimals}
        searchKey="earTagNumber"
        searchPlaceholder="Kulak numarasına göre ara..."
      />
    </div>
  )
}
