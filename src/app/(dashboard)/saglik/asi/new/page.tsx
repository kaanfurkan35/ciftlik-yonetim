"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
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

interface AnimalOption {
  id: string
  name: string | null
  earTagNumber: string
}

interface VaccinationTypeOption {
  id: string
  name: string
  description: string | null
  intervalDays: number
}

export default function YeniAsiKaydiPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animals, setAnimals] = useState<AnimalOption[]>([])
  const [vaccinationTypes, setVaccinationTypes] = useState<VaccinationTypeOption[]>([])
  const [isLoadingAnimals, setIsLoadingAnimals] = useState(true)
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)

  // Form state
  const [animalId, setAnimalId] = useState("")
  const [vaccinationTypeId, setVaccinationTypeId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [nextDueDate, setNextDueDate] = useState("")
  const [batchNumber, setBatchNumber] = useState("")
  const [cost, setCost] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const response = await fetch("/api/animals?limit=100")
        if (response.ok) {
          const result = await response.json()
          setAnimals(result.data)
        }
      } catch {
        toast.error("Hayvanlar yüklenirken bir hata oluştu")
      } finally {
        setIsLoadingAnimals(false)
      }
    }

    async function fetchVaccinationTypes() {
      try {
        const response = await fetch("/api/vaccination-types")
        if (response.ok) {
          const result = await response.json()
          setVaccinationTypes(result.data)
        }
      } catch {
        // Aşı türleri yüklenemezse sessizce devam et
      } finally {
        setIsLoadingTypes(false)
      }
    }

    fetchAnimals()
    fetchVaccinationTypes()
  }, [])

  // Aşı türü seçildiğinde sonraki tarihi otomatik hesapla
  useEffect(() => {
    if (vaccinationTypeId && date) {
      const selectedType = vaccinationTypes.find((t) => t.id === vaccinationTypeId)
      if (selectedType) {
        const vaccDate = new Date(date)
        const next = new Date(
          vaccDate.getTime() + selectedType.intervalDays * 24 * 60 * 60 * 1000
        )
        setNextDueDate(next.toISOString().split("T")[0])
      }
    }
  }, [vaccinationTypeId, date, vaccinationTypes])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!animalId) {
      toast.error("Lütfen bir hayvan seçiniz")
      return
    }

    if (!vaccinationTypeId) {
      toast.error("Lütfen bir aşı türü seçiniz")
      return
    }

    setIsSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        animalId,
        vaccinationTypeId,
        date: new Date(date).toISOString(),
      }

      if (nextDueDate) body.nextDueDate = new Date(nextDueDate).toISOString()
      if (batchNumber) body.batchNumber = batchNumber
      if (cost) body.cost = parseFloat(cost)
      if (notes) body.notes = notes

      const response = await fetch("/api/vaccinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Aşı kaydı eklenirken bir hata oluştu")
      }

      toast.success("Aşı kaydı başarıyla eklendi")
      router.push("/saglik")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Aşı kaydı eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Aşı Kaydı"
        description="Hayvan için yeni bir aşı kaydı oluşturun."
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle>Aşı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="animalId">Hayvan *</Label>
                <Select value={animalId} onValueChange={(v) => setAnimalId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingAnimals ? "Yükleniyor..." : "Hayvan seçiniz"} />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.name
                          ? `${animal.name} (${animal.earTagNumber})`
                          : animal.earTagNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vaccinationTypeId">Aşı Türü *</Label>
                <Select value={vaccinationTypeId} onValueChange={(v) => setVaccinationTypeId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingTypes ? "Yükleniyor..." : "Aşı türü seçiniz"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vaccinationTypes.map((vt) => (
                      <SelectItem key={vt.id} value={vt.id}>
                        {vt.name}
                        {vt.description ? ` - ${vt.description}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Aşı Tarihi *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Sonraki Aşı Tarihi</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Aşı türü seçildiğinde otomatik hesaplanır, istenirse değiştirilebilir.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ek Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle>Ek Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Parti Numarası</Label>
                <Input
                  id="batchNumber"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="Aşı parti numarasını giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Maliyet (TL)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ek notlar giriniz"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/saglik")}
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  )
}
