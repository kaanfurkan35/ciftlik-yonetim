"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export default function YeniSutSatisiPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [quantity, setQuantity] = useState("")
  const [pricePerLiter, setPricePerLiter] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [notes, setNotes] = useState("")

  // Otomatik toplam tutar hesaplama
  const totalAmount =
    quantity && pricePerLiter
      ? (Number(quantity) * Number(pricePerLiter)).toFixed(2)
      : ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!quantity || Number(quantity) <= 0) {
      toast.error("Lütfen geçerli bir miktar girin")
      return
    }
    if (!pricePerLiter || Number(pricePerLiter) <= 0) {
      toast.error("Lütfen geçerli bir birim fiyat girin")
      return
    }
    if (!buyerName.trim()) {
      toast.error("Lütfen alıcı adını girin")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        date: new Date(date).toISOString(),
        quantity: Number(quantity),
        pricePerLiter: Number(pricePerLiter),
        totalAmount: Number(totalAmount),
        buyerName: buyerName.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      const res = await fetch("/api/milk/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Satış kaydı oluşturulurken hata oluştu")
      }

      toast.success("Süt satışı başarıyla kaydedildi")
      router.push("/sut")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Satış kaydı oluşturulurken hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Süt Satışı"
        description="Yeni bir süt satışı kaydı oluşturun."
      >
        <Button render={<Link href="/sut" />} variant="outline">
          <ArrowLeft className="size-4" />
          Geri
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Satış Bilgileri</CardTitle>
          <CardDescription>Süt satış detaylarını girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Tarih</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerName">Alıcı Adı</Label>
                <Input
                  id="buyerName"
                  required
                  placeholder="Ör: Süt Fabrikası A.Ş."
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Miktar (Litre)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  placeholder="Ör: 500"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerLiter">Litre Fiyatı (₺)</Label>
                <Input
                  id="pricePerLiter"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Ör: 12.50"
                  value={pricePerLiter}
                  onChange={(e) => setPricePerLiter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Toplam Tutar (₺)</Label>
                <Input
                  id="totalAmount"
                  type="text"
                  readOnly
                  className="bg-muted"
                  value={
                    totalAmount
                      ? Number(totalAmount).toLocaleString("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        })
                      : ""
                  }
                  placeholder="Otomatik hesaplanır"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Fatura Numarası</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Opsiyonel"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                placeholder="Opsiyonel notlar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor..." : "Satışı Kaydet"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/sut")}
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
