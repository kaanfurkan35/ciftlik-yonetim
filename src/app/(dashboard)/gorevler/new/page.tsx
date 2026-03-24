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
import { TASK_PRIORITY_LABELS } from "@/lib/constants"

interface UserOption {
  id: string
  name: string
}

export default function YeniGorevPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("MEDIUM")
  const [dueDate, setDueDate] = useState("")
  const [assignedToId, setAssignedToId] = useState("")

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/users")
        if (response.ok) {
          const result = await response.json()
          setUsers(result.data)
        }
      } catch {
        console.error("Kullanıcılar yüklenemedi")
      }
    }
    fetchUsers()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Görev başlığı zorunludur")
      return
    }

    if (!assignedToId) {
      toast.error("Görevi atayacağınız kişiyi seçin")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          assignedToId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Görev eklenirken bir hata oluştu")
      }

      toast.success("Görev başarıyla oluşturuldu")
      router.push("/gorevler")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Görev eklenirken bir hata oluştu"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Görev Oluştur"
        description="Çiftlik için yeni bir görev tanımlayın."
      />

      <Card>
        <CardHeader>
          <CardTitle>Görev Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Görev başlığını girin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Görev açıklamasını girin"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Öncelik</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Bitiş Tarihi</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Atanan Kişi *</Label>
              <Select value={assignedToId} onValueChange={(v) => setAssignedToId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kişi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Oluşturuluyor..." : "Görev Oluştur"}
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
