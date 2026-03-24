"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

const UNIT_OPTIONS = [
  { value: "KG", label: "Kilogram (Kg)" },
  { value: "TON", label: "Ton" },
  { value: "LITRE", label: "Litre" },
  { value: "BALYA", label: "Balya" },
  { value: "CUVAL", label: "Çuval" },
]

export default function YeniYemTuruPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      unit: formData.get("unit") as string,
      currentStock: Number(formData.get("currentStock")) || 0,
      minimumStock: Number(formData.get("minimumStock")) || 0,
      costPerUnit: formData.get("costPerUnit")
        ? Number(formData.get("costPerUnit"))
        : undefined,
    }

    try {
      const response = await fetch("/api/feeding/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Yem türü eklenirken bir hata oluştu")
      }

      toast.success("Yem türü başarıyla eklendi")
      router.push("/besleme")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Yem türü eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Yem Türü Ekle"
        description="Yem envanterine yeni bir yem türü ekleyin."
      />

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Yem Adı *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Örn: Arpa, Yonca, Silaj"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Birim *</Label>
                <select
                  id="unit"
                  name="unit"
                  required
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <option value="">Birim seçiniz</option>
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentStock">Mevcut Stok</Label>
                <Input
                  id="currentStock"
                  name="currentStock"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumStock">Minimum Stok</Label>
                <Input
                  id="minimumStock"
                  name="minimumStock"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Birim Fiyat (TL)</Label>
                <Input
                  id="costPerUnit"
                  name="costPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Opsiyonel"
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
