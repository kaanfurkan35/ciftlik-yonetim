"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PASTURE_CONDITION_LABELS } from "@/lib/constants"

export default function YeniMeraPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [sizeDekar, setSizeDekar] = useState("")
  const [capacity, setCapacity] = useState("")
  const [condition, setCondition] = useState("GOOD")
  const [hasWaterSource, setHasWaterSource] = useState(false)
  const [notes, setNotes] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Mera adı zorunludur")
      return
    }

    if (!sizeDekar || Number(sizeDekar) <= 0) {
      toast.error("Geçerli bir büyüklük girin")
      return
    }

    if (!capacity || Number(capacity) <= 0) {
      toast.error("Geçerli bir kapasite girin")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/pastures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sizeDekar: Number(sizeDekar),
          capacity: Number(capacity),
          condition,
          hasWaterSource,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Mera eklenirken bir hata oluştu")
      }

      toast.success("Mera başarıyla eklendi")
      router.push("/meralar")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Mera eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Mera Ekle"
        description="Çiftliğe yeni bir mera/otlak alanı ekleyin."
      />

      <Card>
        <CardHeader>
          <CardTitle>Mera Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Mera Adı *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mera adını girin"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sizeDekar">Büyüklük (Dönüm) *</Label>
                <Input
                  id="sizeDekar"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={sizeDekar}
                  onChange={(e) => setSizeDekar(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasite (Hayvan Sayısı) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mera Durumu</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PASTURE_CONDITION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={hasWaterSource}
                onCheckedChange={setHasWaterSource}
              />
              <Label>Su Kaynağı Mevcut</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mera hakkında ek notlar"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Ekleniyor..." : "Mera Ekle"}
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
