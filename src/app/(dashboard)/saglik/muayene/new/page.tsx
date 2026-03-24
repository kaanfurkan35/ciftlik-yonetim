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
import { HEALTH_RECORD_TYPE_LABELS } from "@/lib/constants"

interface AnimalOption {
  id: string
  name: string | null
  earTagNumber: string
}

export default function YeniSaglikKaydiPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animals, setAnimals] = useState<AnimalOption[]>([])
  const [isLoadingAnimals, setIsLoadingAnimals] = useState(true)

  // Form state
  const [animalId, setAnimalId] = useState("")
  const [type, setType] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [diagnosis, setDiagnosis] = useState("")
  const [treatment, setTreatment] = useState("")
  const [medication, setMedication] = useState("")
  const [dosage, setDosage] = useState("")
  const [withdrawalEndDate, setWithdrawalEndDate] = useState("")
  const [vetName, setVetName] = useState("")
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
    fetchAnimals()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!animalId) {
      toast.error("Lütfen bir hayvan seçiniz")
      return
    }

    if (!type) {
      toast.error("Lütfen kayıt türünü seçiniz")
      return
    }

    setIsSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        animalId,
        type,
        date: new Date(date).toISOString(),
      }

      if (diagnosis) body.diagnosis = diagnosis
      if (treatment) body.treatment = treatment
      if (medication) body.medication = medication
      if (dosage) body.dosage = dosage
      if (withdrawalEndDate) body.withdrawalEndDate = new Date(withdrawalEndDate).toISOString()
      if (vetName) body.vetName = vetName
      if (cost) body.cost = parseFloat(cost)
      if (notes) body.notes = notes

      const response = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Sağlık kaydı eklenirken bir hata oluştu")
      }

      toast.success("Sağlık kaydı başarıyla eklendi")
      router.push("/saglik")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Sağlık kaydı eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Sağlık Kaydı"
        description="Hayvan için yeni bir sağlık kaydı oluşturun."
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
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
                <Label htmlFor="type">Kayıt Türü *</Label>
                <Select value={type} onValueChange={(v) => setType(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kayıt türü seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HEALTH_RECORD_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Tarih *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vetName">Veteriner Adı</Label>
                <Input
                  id="vetName"
                  value={vetName}
                  onChange={(e) => setVetName(e.target.value)}
                  placeholder="Veteriner adını giriniz"
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
            </CardContent>
          </Card>

          {/* Tedavi Detayları */}
          <Card>
            <CardHeader>
              <CardTitle>Tedavi Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Teşhis</Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Teşhis giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment">Tedavi</Label>
                <Input
                  id="treatment"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Uygulanan tedaviyi giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medication">İlaç</Label>
                <Input
                  id="medication"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  placeholder="Kullanılan ilacı giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">Dozaj</Label>
                <Input
                  id="dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Dozaj bilgisini giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawalEndDate">İlaç Arınma Bitiş Tarihi</Label>
                <Input
                  id="withdrawalEndDate"
                  type="date"
                  value={withdrawalEndDate}
                  onChange={(e) => setWithdrawalEndDate(e.target.value)}
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
