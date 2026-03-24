"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FeedTypeOption {
  id: string
  name: string
  unit: string
}

export default function YeniSatinAlmaPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedTypes, setFeedTypes] = useState<FeedTypeOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeedTypes() {
      try {
        const res = await fetch("/api/feeding/types?limit=100")
        const json = await res.json()
        if (json.success) {
          setFeedTypes(json.data)
        }
      } catch {
        toast.error("Yem türleri yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    loadFeedTypes()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      feedTypeId: formData.get("feedTypeId") as string,
      quantity: Number(formData.get("quantity")),
      totalCost: Number(formData.get("totalCost")),
      supplier: (formData.get("supplier") as string) || undefined,
      date: formData.get("date") as string,
      invoiceNumber: (formData.get("invoiceNumber") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    }

    try {
      const response = await fetch("/api/feeding/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Satın alma kaydı eklenirken bir hata oluştu")
      }

      toast.success("Satın alma kaydı başarıyla eklendi. Stok güncellendi.")
      router.push("/besleme")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Satın alma kaydı eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Satın Alma Kaydı"
        description="Yem satın alma kaydı oluşturun. Stok otomatik olarak güncellenir."
      />

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feedTypeId">Yem Türü *</Label>
                <select
                  id="feedTypeId"
                  name="feedTypeId"
                  required
                  disabled={loading}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                >
                  <option value="">
                    {loading ? "Yükleniyor..." : "Yem türü seçiniz"}
                  </option>
                  {feedTypes.map((ft) => (
                    <option key={ft.id} value={ft.id}>
                      {ft.name} ({ft.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Tarih *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Miktar *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Miktar giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCost">Toplam Maliyet (TL) *</Label>
                <Input
                  id="totalCost"
                  name="totalCost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Toplam maliyet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Tedarikçi</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  placeholder="Tedarikçi adı (opsiyonel)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Fatura Numarası</Label>
                <Input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  placeholder="Fatura no (opsiyonel)"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Ek notlar (opsiyonel)"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
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
