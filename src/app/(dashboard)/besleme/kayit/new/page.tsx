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
  currentStock: number
}

interface AnimalOption {
  id: string
  name: string | null
  earTagNumber: string
}

interface GroupOption {
  id: string
  name: string
}

export default function YeniYemlemeKaydiPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedTypes, setFeedTypes] = useState<FeedTypeOption[]>([])
  const [animals, setAnimals] = useState<AnimalOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<"animal" | "group" | "none">("none")

  useEffect(() => {
    async function loadData() {
      try {
        const [feedRes, animalRes, groupRes] = await Promise.all([
          fetch("/api/feeding/types?limit=100"),
          fetch("/api/animals?limit=100"),
          fetch("/api/groups?limit=100").catch(() => null),
        ])

        const feedJson = await feedRes.json()
        if (feedJson.success) {
          setFeedTypes(
            feedJson.data.map((ft: Record<string, unknown>) => ({
              id: ft.id,
              name: ft.name,
              unit: ft.unit,
              currentStock: Number(ft.currentStock),
            }))
          )
        }

        const animalJson = await animalRes.json()
        if (animalJson.success) {
          setAnimals(animalJson.data)
        }

        if (groupRes) {
          const groupJson = await groupRes.json()
          if (groupJson.success) {
            setGroups(groupJson.data)
          }
        }
      } catch {
        toast.error("Veriler yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      feedTypeId: formData.get("feedTypeId") as string,
      quantity: Number(formData.get("quantity")),
      date: formData.get("date") as string,
      notes: (formData.get("notes") as string) || undefined,
    }

    if (target === "animal" && formData.get("animalId")) {
      data.animalId = formData.get("animalId") as string
    }
    if (target === "group" && formData.get("groupId")) {
      data.groupId = formData.get("groupId") as string
    }

    try {
      const response = await fetch("/api/feeding/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Yemleme kaydı eklenirken bir hata oluştu")
      }

      toast.success("Yemleme kaydı başarıyla eklendi. Stok güncellendi.")
      router.push("/besleme")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Yemleme kaydı eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Yemleme Kaydı"
        description="Günlük yemleme kaydı oluşturun. Stok otomatik olarak güncellenir."
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
                      {ft.name} (Stok: {ft.currentStock} {ft.unit})
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
                <Label>Hedef</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={target === "none" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTarget("none")}
                  >
                    Genel
                  </Button>
                  <Button
                    type="button"
                    variant={target === "animal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTarget("animal")}
                  >
                    Hayvan
                  </Button>
                  <Button
                    type="button"
                    variant={target === "group" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTarget("group")}
                  >
                    Grup
                  </Button>
                </div>
              </div>

              {target === "animal" && (
                <div className="space-y-2">
                  <Label htmlFor="animalId">Hayvan</Label>
                  <select
                    id="animalId"
                    name="animalId"
                    disabled={loading}
                    className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                  >
                    <option value="">Hayvan seçiniz</option>
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.earTagNumber} {a.name ? `- ${a.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {target === "group" && (
                <div className="space-y-2">
                  <Label htmlFor="groupId">Grup</Label>
                  <select
                    id="groupId"
                    name="groupId"
                    disabled={loading}
                    className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                  >
                    <option value="">Grup seçiniz</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
