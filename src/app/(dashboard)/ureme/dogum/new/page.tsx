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

interface AnimalOption {
  id: string
  name: string | null
  earTagNumber: string
  sex: string
}

export default function YeniDogumKaydiPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mothers, setMothers] = useState<AnimalOption[]>([])
  const [calves, setCalves] = useState<AnimalOption[]>([])

  const [animalId, setAnimalId] = useState("")
  const [calfId, setCalfId] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [dystociaScore, setDystociaScore] = useState("")
  const [complications, setComplications] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchMothers() {
      try {
        const res = await fetch("/api/animals?limit=100&sex=FEMALE")
        const json = await res.json()
        if (json.success) {
          setMothers(json.data)
        }
      } catch {
        // sessiz hata
      }
    }

    async function fetchCalves() {
      try {
        const res = await fetch("/api/animals?limit=100&status=CALF")
        const json = await res.json()
        if (json.success) {
          setCalves(json.data)
        }
      } catch {
        // sessiz hata
      }
    }

    fetchMothers()
    fetchCalves()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!animalId || !date) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/breeding/calving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId,
          calfId: calfId || undefined,
          date,
          dystociaScore: dystociaScore ? parseInt(dystociaScore) : undefined,
          complications: complications || undefined,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Doğum kaydı eklenirken bir hata oluştu")
      }

      toast.success("Doğum kaydı başarıyla eklendi")
      router.push("/ureme")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Doğum kaydı eklenirken bir hata oluştu"
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
          title="Yeni Doğum Kaydı"
          description="Bir hayvana yeni doğum kaydı ekleyin."
        />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Doğum Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Anne Seçimi */}
            <div className="space-y-2">
              <Label>Anne *</Label>
              <Select value={animalId} onValueChange={(val) => setAnimalId(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Anne seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {mothers.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.name || animal.earTagNumber} ({animal.earTagNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Buzağı Seçimi */}
            <div className="space-y-2">
              <Label>Buzağı</Label>
              <Select value={calfId} onValueChange={(val) => setCalfId(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Buzağı seçiniz (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  {calves.map((calf) => (
                    <SelectItem key={calf.id} value={calf.id}>
                      {calf.name || calf.earTagNumber} ({calf.earTagNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tarih */}
            <div className="space-y-2">
              <Label>Doğum Tarihi *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Dystocia Skoru */}
            <div className="space-y-2">
              <Label>Güçlü Doğum Skoru (1-5)</Label>
              <Select value={dystociaScore} onValueChange={(val) => setDystociaScore(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Skor seçiniz (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Kolay doğum</SelectItem>
                  <SelectItem value="2">2 - Hafif yardım</SelectItem>
                  <SelectItem value="3">3 - Orta yardım</SelectItem>
                  <SelectItem value="4">4 - Zor doğum</SelectItem>
                  <SelectItem value="5">5 - Çok zor / Sezaryen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Komplikasyonlar */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Komplikasyonlar</Label>
              <Input
                type="text"
                value={complications}
                onChange={(e) => setComplications(e.target.value)}
                placeholder="Varsa komplikasyonları belirtin"
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
