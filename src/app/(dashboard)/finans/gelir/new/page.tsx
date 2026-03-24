"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TRANSACTION_CATEGORY_LABELS } from "@/lib/constants"
import { INCOME_CATEGORIES } from "@/lib/validations/finance"

interface AnimalOption {
  id: string
  name: string | null
  earTagNumber: string
}

export default function YeniGelirPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animals, setAnimals] = useState<AnimalOption[]>([])

  const [formData, setFormData] = useState({
    category: "MILK_SALE",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    invoiceNumber: "",
    invoiceUrl: "",
    animalId: "",
    notes: "",
  })

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const res = await fetch("/api/animals?limit=100")
        const json = await res.json()
        if (json.success) {
          setAnimals(json.data)
        }
      } catch {
        // Hayvan listesi yüklenemezse devam et
      }
    }
    fetchAnimals()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        type: "INCOME" as const,
        category: formData.category,
        amount: parseFloat(formData.amount.replace(",", ".")),
        date: formData.date,
        description: formData.description,
        invoiceNumber: formData.invoiceNumber || undefined,
        invoiceUrl: formData.invoiceUrl || undefined,
        animalId: formData.animalId || undefined,
        notes: formData.notes || undefined,
      }

      const response = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error || "Gelir eklenirken bir hata oluştu")
      }

      toast.success("Gelir başarıyla eklendi")
      router.push("/finans")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gelir eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/finans" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader
          title="Yeni Gelir Ekle"
          description="Çiftliğe yeni bir gelir kaydı ekleyin."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gelir Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Kategori */}
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                  required
                >
                  {INCOME_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {TRANSACTION_CATEGORY_LABELS[cat] ?? cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tutar */}
              <div className="space-y-2">
                <Label htmlFor="amount">Tutar (₺) *</Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Tarih */}
              <div className="space-y-2">
                <Label htmlFor="date">Tarih *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Fatura Numarası */}
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Fatura Numarası</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invoiceNumber: e.target.value,
                    }))
                  }
                  placeholder="Fatura no (isteğe bağlı)"
                />
              </div>

              {/* Fatura URL */}
              <div className="space-y-2">
                <Label htmlFor="invoiceUrl">Fatura URL</Label>
                <Input
                  id="invoiceUrl"
                  type="url"
                  value={formData.invoiceUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invoiceUrl: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </div>

              {/* Hayvan */}
              <div className="space-y-2">
                <Label htmlFor="animalId">İlişkili Hayvan</Label>
                <select
                  id="animalId"
                  value={formData.animalId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, animalId: e.target.value }))
                  }
                  className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                >
                  <option value="">Seçilmedi</option>
                  {animals.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.earTagNumber}
                      {animal.name ? ` - ${animal.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Açıklama */}
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="İşlem açıklaması"
                required
              />
            </div>

            {/* Notlar */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ek notlar (isteğe bağlı)"
                rows={3}
              />
            </div>

            {/* Butonlar */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor..." : "Gelir Kaydet"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
