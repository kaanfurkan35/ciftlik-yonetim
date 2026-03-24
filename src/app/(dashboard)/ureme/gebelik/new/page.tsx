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
import { PREGNANCY_RESULT_LABELS, GESTATION_DAYS } from "@/lib/constants"

interface AnimalOption {
  id: string
  name: string | null
  earTagNumber: string
}

interface InseminationOption {
  id: string
  date: string
  type: string
}

export default function YeniGebelikKontroluPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animals, setAnimals] = useState<AnimalOption[]>([])
  const [inseminations, setInseminations] = useState<InseminationOption[]>([])

  const [animalId, setAnimalId] = useState("")
  const [inseminationId, setInseminationId] = useState("")
  const [checkDate, setCheckDate] = useState(() => new Date().toISOString().split("T")[0])
  const [result, setResult] = useState("")
  const [method, setMethod] = useState("")
  const [expectedCalvingDate, setExpectedCalvingDate] = useState("")
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
    fetchAnimals()
  }, [])

  // Hayvan seçildiğinde tohumlama kayıtlarını getir
  useEffect(() => {
    if (!animalId) {
      setInseminations([])
      return
    }

    async function fetchInseminations() {
      try {
        const res = await fetch(`/api/breeding/insemination?animalId=${animalId}&limit=50`)
        const json = await res.json()
        if (json.success) {
          setInseminations(json.data)
        }
      } catch {
        // sessiz hata
      }
    }
    fetchInseminations()
  }, [animalId])

  // Tohumlama seçildiğinde beklenen doğum tarihini hesapla
  useEffect(() => {
    if (!inseminationId) return
    const selected = inseminations.find((i) => i.id === inseminationId)
    if (selected) {
      const inseminationDate = new Date(selected.date)
      const expected = new Date(inseminationDate.getTime() + GESTATION_DAYS * 24 * 60 * 60 * 1000)
      setExpectedCalvingDate(expected.toISOString().split("T")[0])
    }
  }, [inseminationId, inseminations])

  function formatInseminationDate(dateStr: string): string {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!animalId || !checkDate || !result) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/breeding/pregnancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId,
          inseminationId: inseminationId || undefined,
          checkDate,
          result,
          method: method || undefined,
          expectedCalvingDate: expectedCalvingDate || undefined,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Gebelik kontrolü eklenirken bir hata oluştu")
      }

      toast.success("Gebelik kontrolü başarıyla eklendi")
      router.push("/ureme")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gebelik kontrolü eklenirken bir hata oluştu"
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
          title="Yeni Gebelik Kontrolü"
          description="Bir hayvana yeni gebelik kontrolü kaydı ekleyin."
        />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Gebelik Kontrolü Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Hayvan Seçimi */}
            <div className="space-y-2">
              <Label>Hayvan *</Label>
              <Select value={animalId} onValueChange={(val) => { setAnimalId(val ?? ""); setInseminationId(""); }}>
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

            {/* Tohumlama Seçimi */}
            <div className="space-y-2">
              <Label>İlgili Tohumlama</Label>
              <Select value={inseminationId} onValueChange={(val) => setInseminationId(val ?? "")} disabled={!animalId || inseminations.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={!animalId ? "Önce hayvan seçiniz" : inseminations.length === 0 ? "Tohumlama kaydı yok" : "Tohumlama seçiniz (opsiyonel)"} />
                </SelectTrigger>
                <SelectContent>
                  {inseminations.map((ins) => (
                    <SelectItem key={ins.id} value={ins.id}>
                      {formatInseminationDate(ins.date)} - {ins.type === "ARTIFICIAL" ? "Yapay" : "Doğal"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kontrol Tarihi */}
            <div className="space-y-2">
              <Label>Kontrol Tarihi *</Label>
              <Input
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                required
              />
            </div>

            {/* Sonuç */}
            <div className="space-y-2">
              <Label>Sonuç *</Label>
              <Select value={result} onValueChange={(val) => setResult(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sonuç seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PREGNANCY_RESULT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Yöntem */}
            <div className="space-y-2">
              <Label>Yöntem</Label>
              <Input
                type="text"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="örneğin: Rektal muayene, Ultrason"
              />
            </div>

            {/* Beklenen Doğum Tarihi */}
            <div className="space-y-2">
              <Label>Beklenen Doğum Tarihi</Label>
              <Input
                type="date"
                value={expectedCalvingDate}
                onChange={(e) => setExpectedCalvingDate(e.target.value)}
              />
              {inseminationId && (
                <p className="text-xs text-muted-foreground">
                  Tohumlama tarihine {GESTATION_DAYS} gün eklenerek otomatik hesaplandı.
                </p>
              )}
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
