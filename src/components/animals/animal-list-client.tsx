"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_COLORS,
  ANIMAL_SEX_LABELS,
} from "@/lib/constants"
import { formatAge } from "@/lib/format"

interface AnimalRow {
  id: string
  earTagNumber: string
  name: string | null
  breed: string | null
  sex: string
  status: string
  dateOfBirth: string | null
}

interface AnimalListClientProps {
  animals: AnimalRow[]
}

export function AnimalListClient({ animals }: AnimalListClientProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AnimalRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = useMemo(() => {
    let result = animals
    if (statusFilter !== "ALL") {
      result = result.filter((a) => a.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.earTagNumber.toLowerCase().includes(q) ||
          (a.name && a.name.toLowerCase().includes(q))
      )
    }
    return result
  }, [animals, statusFilter, search])

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/animals/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Hayvan başarıyla silindi")
      setDeleteTarget(null)
      router.refresh()
    } catch {
      toast.error("Hayvan silinirken bir hata oluştu")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Kulak no veya isim ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Label htmlFor="sf" className="text-sm text-muted-foreground">Durum:</Label>
          <NativeSelect
            id="sf"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tüm Durumlar</option>
            {Object.entries(ANIMAL_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </NativeSelect>
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} hayvan</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kulak No</TableHead>
              <TableHead>İsim</TableHead>
              <TableHead>Irk</TableHead>
              <TableHead>Cinsiyet</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Yaş</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((animal) => (
                <TableRow key={animal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/hayvanlar/${animal.id}`)}>
                  <TableCell>
                    <Link href={`/hayvanlar/${animal.id}`} className="font-mono font-bold text-sm hover:text-primary" onClick={(e) => e.stopPropagation()}>
                      {animal.earTagNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{animal.name || "-"}</TableCell>
                  <TableCell className="text-sm">{animal.breed || "-"}</TableCell>
                  <TableCell className="text-sm">{ANIMAL_SEX_LABELS[animal.sex] ?? animal.sex}</TableCell>
                  <TableCell>
                    <Badge className={ANIMAL_STATUS_COLORS[animal.status] ?? ""}>
                      {ANIMAL_STATUS_LABELS[animal.status] ?? animal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatAge(animal.dateOfBirth)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">İşlemler</span>
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/hayvanlar/${animal.id}`)}>
                          <Eye className="size-4" /> Detay
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/hayvanlar/${animal.id}/edit`)}>
                          <Pencil className="size-4" /> Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(animal)}>
                          <Trash2 className="size-4" /> Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Single shared delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Hayvanı Sil"
        description={`"${deleteTarget?.name || deleteTarget?.earTagNumber}" adlı hayvanı silmek istediğinizden emin misiniz?`}
        onConfirm={handleDelete}
        confirmText={isDeleting ? "Siliniyor..." : "Sil"}
        cancelText="İptal"
        variant="destructive"
      />
    </div>
  )
}
