"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { MILK_SESSION_LABELS } from "@/lib/constants"

interface Animal {
  id: string
  earTagNumber: string
  name: string | null
  status: string
}

interface QuickEntry {
  animalId: string
  animalLabel: string
  quantity: string
  session: string
  fatPercentage: string
  proteinPercentage: string
  somaticCellCount: string
  notes: string
}

export default function YeniSutKaydiPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animals, setAnimals] = useState<Animal[]>([])
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [defaultSession, setDefaultSession] = useState("MORNING")

  // Hızlı giriş satırları
  const [entries, setEntries] = useState<QuickEntry[]>([])

  // Tek kayıt modu
  const [selectedAnimalId, setSelectedAnimalId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [session, setSession] = useState("MORNING")
  const [fatPercentage, setFatPercentage] = useState("")
  const [proteinPercentage, setProteinPercentage] = useState("")
  const [somaticCellCount, setSomaticCellCount] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const res = await fetch("/api/animals?limit=100&status=LACTATING")
        const data = await res.json()
        if (data.success) {
          setAnimals(data.data || [])
        } else {
          // Eğer LACTATING filtresi çalışmıyorsa tüm dişi hayvanları getir
          const res2 = await fetch("/api/animals?limit=100&sex=FEMALE")
          const data2 = await res2.json()
          setAnimals(data2.data || [])
        }
      } catch {
        toast.error("Hayvanlar yüklenirken hata oluştu")
      }
    }
    fetchAnimals()
  }, [])

  function addEntry() {
    if (!selectedAnimalId) {
      toast.error("Lütfen bir hayvan seçin")
      return
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Lütfen geçerli bir miktar girin")
      return
    }

    const animal = animals.find((a) => a.id === selectedAnimalId)
    const animalLabel = animal
      ? `${animal.earTagNumber}${animal.name ? ` - ${animal.name}` : ""}`
      : selectedAnimalId

    setEntries((prev) => [
      ...prev,
      {
        animalId: selectedAnimalId,
        animalLabel,
        quantity,
        session,
        fatPercentage,
        proteinPercentage,
        somaticCellCount,
        notes,
      },
    ])

    // Formu temizle (tarih ve sağım zamanı hariç)
    setSelectedAnimalId("")
    setQuantity("")
    setFatPercentage("")
    setProteinPercentage("")
    setSomaticCellCount("")
    setNotes("")
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmitSingle() {
    if (!selectedAnimalId) {
      toast.error("Lütfen bir hayvan seçin")
      return
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Lütfen geçerli bir miktar girin")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        animalId: selectedAnimalId,
        date: new Date(date).toISOString(),
        session,
        quantity: Number(quantity),
        fatPercentage: fatPercentage ? Number(fatPercentage) : undefined,
        proteinPercentage: proteinPercentage ? Number(proteinPercentage) : undefined,
        somaticCellCount: somaticCellCount ? parseInt(somaticCellCount) : undefined,
        notes: notes || undefined,
      }

      const res = await fetch("/api/milk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Kayıt oluşturulurken hata oluştu")
      }

      toast.success("Süt kaydı başarıyla eklendi")
      router.push("/sut")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kayıt oluşturulurken hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmitBatch() {
    if (entries.length === 0) {
      toast.error("Lütfen en az bir kayıt ekleyin")
      return
    }

    setIsSubmitting(true)
    try {
      let successCount = 0
      let errorCount = 0

      for (const entry of entries) {
        const payload = {
          animalId: entry.animalId,
          date: new Date(date).toISOString(),
          session: entry.session,
          quantity: Number(entry.quantity),
          fatPercentage: entry.fatPercentage ? Number(entry.fatPercentage) : undefined,
          proteinPercentage: entry.proteinPercentage ? Number(entry.proteinPercentage) : undefined,
          somaticCellCount: entry.somaticCellCount ? parseInt(entry.somaticCellCount) : undefined,
          notes: entry.notes || undefined,
        }

        const res = await fetch("/api/milk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          successCount++
        } else {
          errorCount++
        }
      }

      if (errorCount > 0) {
        toast.warning(`${successCount} kayıt eklendi, ${errorCount} kayıt başarısız oldu`)
      } else {
        toast.success(`${successCount} süt kaydı başarıyla eklendi`)
      }

      router.push("/sut")
      router.refresh()
    } catch (error) {
      toast.error("Toplu kayıt oluşturulurken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalEntryQuantity = entries.reduce((sum, e) => sum + Number(e.quantity), 0)

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Yeni Süt Kaydı" description="Süt sağım kaydı oluşturun.">
        <Button render={<Link href="/sut" />} variant="outline">
          <ArrowLeft className="size-4" />
          Geri
        </Button>
      </PageHeader>

      {/* Ortak Ayarlar */}
      <Card>
        <CardHeader>
          <CardTitle>Kayıt Bilgileri</CardTitle>
          <CardDescription>Tarih ve varsayılan sağım zamanını seçin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Tarih</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Varsayılan Sağım Zamanı</Label>
              <Select value={defaultSession} onValueChange={(val) => { setDefaultSession(val ?? ""); setSession(val ?? ""); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MILK_SESSION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kayıt Formu */}
      <Card>
        <CardHeader>
          <CardTitle>Sağım Kaydı</CardTitle>
          <CardDescription>
            Tek kayıt ekleyebilir veya birden fazla hayvan için toplu giriş yapabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Hayvan</Label>
                <Select value={selectedAnimalId} onValueChange={(v) => setSelectedAnimalId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Hayvan seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.earTagNumber}{animal.name ? ` - ${animal.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sağım Zamanı</Label>
                <Select value={session} onValueChange={(v) => setSession(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MILK_SESSION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Miktar (Litre)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ör: 12.5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            {/* Opsiyonel Kalite Metrikleri */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="fatPercentage">Yağ Oranı (%)</Label>
                <Input
                  id="fatPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Ör: 3.8"
                  value={fatPercentage}
                  onChange={(e) => setFatPercentage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proteinPercentage">Protein Oranı (%)</Label>
                <Input
                  id="proteinPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Ör: 3.2"
                  value={proteinPercentage}
                  onChange={(e) => setProteinPercentage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="somaticCellCount">Somatik Hücre Sayısı</Label>
                <Input
                  id="somaticCellCount"
                  type="number"
                  min="0"
                  placeholder="Ör: 200000"
                  value={somaticCellCount}
                  onChange={(e) => setSomaticCellCount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Not</Label>
                <Input
                  id="notes"
                  placeholder="Opsiyonel not"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={addEntry}>
                <Plus className="size-4" />
                Listeye Ekle
              </Button>
              <Button
                type="button"
                onClick={handleSubmitSingle}
                disabled={isSubmitting || !selectedAnimalId || !quantity}
              >
                Tek Kayıt Ekle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toplu Giriş Listesi */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Toplu Giriş Listesi</CardTitle>
            <CardDescription>
              {entries.length} kayıt - Toplam: {totalEntryQuantity.toFixed(1)} L
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-medium">{entry.animalLabel}</span>
                    <span className="text-muted-foreground">
                      {MILK_SESSION_LABELS[entry.session]}
                    </span>
                    <span className="font-semibold">{Number(entry.quantity).toFixed(1)} L</span>
                    {entry.fatPercentage && (
                      <span className="text-muted-foreground">Yağ: {entry.fatPercentage}%</span>
                    )}
                    {entry.proteinPercentage && (
                      <span className="text-muted-foreground">
                        Protein: {entry.proteinPercentage}%
                      </span>
                    )}
                    {entry.notes && (
                      <span className="text-muted-foreground italic">{entry.notes}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeEntry(index)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              ))}

              <div className="pt-4">
                <Button
                  onClick={handleSubmitBatch}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting
                    ? "Kaydediliyor..."
                    : `${entries.length} Kaydı Toplu Ekle`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
