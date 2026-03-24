"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Syringe,
  Baby,
  Flame,
  Wheat,
  CreditCard,
  ClipboardList,
  Info,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  relatedEntityId: string | null
  relatedEntityType: string | null
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  VACCINATION_DUE: "Aşı Hatırlatma",
  CALVING_EXPECTED: "Doğum Bekleniyor",
  HEAT_PREDICTED: "Kızgınlık Tahmini",
  FEED_LOW: "Yem Azalıyor",
  PAYMENT_DUE: "Ödeme Vadesi",
  TASK_ASSIGNED: "Görev Atandı",
  GENERAL: "Genel",
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  VACCINATION_DUE: <Syringe className="size-4" />,
  CALVING_EXPECTED: <Baby className="size-4" />,
  HEAT_PREDICTED: <Flame className="size-4" />,
  FEED_LOW: <Wheat className="size-4" />,
  PAYMENT_DUE: <CreditCard className="size-4" />,
  TASK_ASSIGNED: <ClipboardList className="size-4" />,
  GENERAL: <Info className="size-4" />,
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (notifDate.getTime() === today.getTime()) return "Bugün"
  if (notifDate.getTime() === yesterday.getTime()) return "Dün"
  return "Daha Eski"
}

function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr))
}

function formatFullDate(dateStr: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr))
}

export default function BildirimlerPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("ALL")

  const fetchNotifications = useCallback(async () => {
    try {
      const url = typeFilter === "ALL"
        ? "/api/notifications?limit=100"
        : `/api/notifications?type=${typeFilter}&limit=100`

      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        setNotifications(result.data.notifications)
        setUnreadCount(result.data.unreadCount)
      }
    } catch {
      console.error("Bildirimler yüklenemedi")
    } finally {
      setIsLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
      toast.error("Bildirim güncellenirken bir hata oluştu")
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        )
        setUnreadCount(0)
        toast.success("Tüm bildirimler okundu olarak işaretlendi")
      }
    } catch {
      toast.error("Bildirimler güncellenirken bir hata oluştu")
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const removed = notifications.find((n) => n.id === notificationId)
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        if (removed && !removed.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
        toast.success("Bildirim silindi")
      }
    } catch {
      toast.error("Bildirim silinirken bir hata oluştu")
    }
  }

  // Bildirimleri tarihe göre grupla
  const grouped = notifications.reduce(
    (acc, notification) => {
      const group = getDateGroup(notification.createdAt)
      if (!acc[group]) acc[group] = []
      acc[group].push(notification)
      return acc
    },
    {} as Record<string, Notification[]>
  )

  const groupOrder = ["Bugün", "Dün", "Daha Eski"]

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Bildirimler" description="Bildirimlerinizi görüntüleyin." />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Bildirimler" description="Çiftlik bildirimlerinizi görüntüleyin ve yönetin.">
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="size-4" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </PageHeader>

      {/* Filtre */}
      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "ALL")}>
          <SelectTrigger>
            <SelectValue placeholder="Tür seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tümü</SelectItem>
            {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} okunmamış</Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-6" />}
          title="Bildirim bulunmuyor"
          description="Henüz bildiriminiz yok. Yeni bildirimler burada görünecektir."
        />
      ) : (
        <div className="space-y-6">
          {groupOrder.map((group) => {
            const items = grouped[group]
            if (!items || items.length === 0) return null

            return (
              <div key={group} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {group}
                </h2>

                {items.map((notification) => (
                  <Card
                    key={notification.id}
                    size="sm"
                    className={
                      notification.isRead
                        ? "opacity-70"
                        : "ring-2 ring-primary/20 bg-primary/5"
                    }
                  >
                    <CardContent className="flex items-start gap-3 py-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {NOTIFICATION_ICONS[notification.type] ?? <Bell className="size-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm ${notification.isRead ? "" : "font-semibold"}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {group === "Daha Eski"
                              ? formatFullDate(notification.createdAt)
                              : formatTime(notification.createdAt)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {NOTIFICATION_TYPE_LABELS[notification.type] ?? notification.type}
                          </Badge>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="size-3" />
                              Okundu
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className="h-6 px-2 text-xs text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="size-3" />
                            Sil
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
