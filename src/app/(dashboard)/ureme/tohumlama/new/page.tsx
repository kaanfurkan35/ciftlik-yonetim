"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { INSEMINATION_TYPE_LABELS } from "@/lib/constants"

interface AnimalOption {
  id: string
  name: string | null
  earTagNumber: string
  sex: string
}

export default function YeniTohumlamaPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animals, setAnimals] = useState<AnimalOption[]>([])
  const [bulls, setBulls] = useState<AnimalOption[]>([])

  const [animalId, setAnimalId] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [type, setType] = useState("")
  const [bullId, setBullId] = useState("")
  const [semenBatchNumber, setSemenBatchNumber] = useState("")
  const [technicianName, setTechnicianName] = useState("")
  const [cost, setCost] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const res = await fetch("/api/animals?limit=100&sex=FEMALE")
        const json = await res.json()
        if (json.success) {
          setAnimals(json.data)
        }
      } catch {
        // sessiz hata
      }
    }

    async function fetchBulls() {
      try {
        const res = await fetch("/api/animals?limit=100&sex=MALE")
        const json = await res.json()
        if (json.success) {
          setBulls(json.data)
        }
      } catch {
        // sessiz hata
      }
    }

    fetchAnimals()
    fetchBulls()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!animalId || !date || !type) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/breeding/insemination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId,
          date,
          type,
          bullId: bullId || undefined,
          semenBatchNumber: semenBatchNumber || undefined,
          technicianName: technicianName || undefined,
          cost: cost ? parseFloat(cost) : undefined,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Tohumlama kaydı eklenirken bir hata oluştu")
      }

      toast.success("Tohumlama kaydı başarıyla eklendi")
      router.push("/ureme")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Tohumlama kaydı eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/ureme" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader
          title="Yeni Tohumlama Kaydı"
          description="Bir hayvana yeni tohumlama kaydı ekleyin."
        />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Tohumlama Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Hayvan Seçimi */}
            <div className="space-y-2">
              <Label>Hayvan *</Label>
              <Select value={animalId} onValueChange={(val) => setAnimalId(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Hayvan seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {animals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.name || animal.earTagNumber} ({animal.earTagNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tarih */}
            <div className="space-y-2">
              <Label>Tarih *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Tohumlama Türü */}
            <div className="space-y-2">
              <Label>Tohumlama Türü *</Label>
              <Select value={type} onValueChange={(val) => setType(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tür seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSEMINATION_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Boğa Seçimi (doğal tohumlama için) */}
            <div className="space-y-2">
              <Label>Boğa</Label>
              <Select value={bullId} onValueChange={(val) => setBullId(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Boğa seçiniz (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  {bulls.map((bull) => (
                    <SelectItem key={bull.id} value={bull.id}>
                      {bull.name || bull.earTagNumber} ({bull.earTagNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semen Parti No */}
            <div className="space-y-2">
              <Label>Semen Parti Numarası</Label>
              <Input
                type="text"
                value={semenBatchNumber}
                onChange={(e) => setSemenBatchNumber(e.target.value)}
                placeholder="örneğin: SB-2024-001"
              />
            </div>

            {/* Teknisyen */}
            <div className="space-y-2">
              <Label>Teknisyen Adı</Label>
              <Input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="Tohumlamayı yapan teknisyen"
              />
            </div>

            {/* Maliyet */}
            <div className="space-y-2">
              <Label>Maliyet (TL)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Notlar */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Notlar</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ek bilgiler..."
                rows={3}
              />
            </div>

            {/* Butonlar */}
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button type="button" variant="outline" render={<Link href="/ureme" />}>
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
