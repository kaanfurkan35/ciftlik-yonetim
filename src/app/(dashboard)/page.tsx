"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Beef,
  Droplets,
  GlassWater,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Syringe,
  Stethoscope,
  ClipboardList,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/shared/stat-card"
import { formatCurrency, formatNumber, formatShortDate } from "@/lib/format"

interface DashboardStats {
  totalAnimals: number
  lactatingAnimals: number
  todayMilk: number
  monthlyIncome: number
}

interface TaskItem {
  id: string
  title: string
  status: string
  dueDate: string
}

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
  isRead: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url)
          if (!res.ok) return { success: false, data: null, meta: null }
          return await res.json()
        } catch {
          return { success: false, data: null, meta: null }
        }
      }

      const [animalsData, lactatingData, milkData, financeData, tasksData, notifData] = await Promise.all([
        safeFetch("/api/animals?limit=1&page=1"),
        safeFetch("/api/animals?limit=1&status=LACTATING"),
        safeFetch("/api/milk?limit=1&page=1"),
        safeFetch("/api/finance/summary"),
        safeFetch("/api/tasks?limit=5&sortOrder=asc"),
        safeFetch("/api/notifications?limit=5"),
      ])

      setStats({
        totalAnimals: animalsData?.meta?.total ?? 0,
        lactatingAnimals: lactatingData?.meta?.total ?? 0,
        todayMilk: milkData?.meta?.total ?? 0,
        monthlyIncome: financeData?.data?.totalIncome ?? 0,
      })

      const taskList = tasksData?.data
      setTasks(Array.isArray(taskList) ? taskList : [])

      const notifList = notifData?.data?.notifications ?? notifData?.data
      setNotifications(Array.isArray(notifList) ? notifList : [])
    } catch (err) {
      console.error("Dashboard veri hatası:", err)
      setStats({ totalAnimals: 0, lactatingAnimals: 0, todayMilk: 0, monthlyIncome: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-24 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-52 rounded-lg" />
          <Skeleton className="h-52 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hoş Geldiniz</h1>
        <p className="text-sm text-muted-foreground">
          Çiftlik yönetim panelinize genel bakış.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/hayvanlar" className="block">
          <StatCard
            title="Toplam Hayvan"
            value={formatNumber(stats?.totalAnimals ?? 0)}
            icon={<Beef className="size-5" />}
            borderColor="border-l-primary"
          />
        </Link>
        <Link href="/hayvanlar" className="block">
          <StatCard
            title="Sağmal İnek"
            value={formatNumber(stats?.lactatingAnimals ?? 0)}
            icon={<Droplets className="size-5" />}
            borderColor="border-l-success"
          />
        </Link>
        <Link href="/sut" className="block">
          <StatCard
            title="Süt Kayıtları"
            value={formatNumber(stats?.todayMilk ?? 0)}
            icon={<GlassWater className="size-5" />}
            borderColor="border-l-accent"
          />
        </Link>
        <Link href="/finans" className="block">
          <StatCard
            title="Toplam Gelir"
            value={formatCurrency(stats?.monthlyIncome ?? 0)}
            icon={<TrendingUp className="size-5" />}
            borderColor="border-l-warning"
          />
        </Link>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/hayvanlar/new" />}>
              <Plus className="size-5" />
              <span className="text-xs">Hayvan Ekle</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/sut/kayit/new" />}>
              <Droplets className="size-5" />
              <span className="text-xs">Süt Kaydı</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/saglik/asi/new" />}>
              <Syringe className="size-5" />
              <span className="text-xs">Aşı Kaydı</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/saglik/muayene/new" />}>
              <Stethoscope className="size-5" />
              <span className="text-xs">Muayene</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/gorevler/new" />}>
              <ClipboardList className="size-5" />
              <span className="text-xs">Görev Ekle</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/raporlar" />}>
              <TrendingUp className="size-5" />
              <span className="text-xs">Raporlar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two columns: Tasks + Notifications */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pending Tasks */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-muted-foreground" />
              Bekleyen Görevler
            </CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/gorevler" />}>
              Tümü <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {tasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Bekleyen görev yok.</p>
            ) : (
              tasks.map((task) => (
                <Link
                  key={task.id}
                  href="/gorevler"
                  className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
                >
                  {task.status === "COMPLETED" ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className="flex-1 truncate text-sm">{task.title}</span>
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      {formatShortDate(task.dueDate)}
                    </span>
                  )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-muted-foreground" />
              Son Bildirimler
            </CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/bildirimler" />}>
              Tümü <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Bildirim yok.</p>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href="/bildirimler"
                  className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className={`size-2 shrink-0 rounded-full ${notif.isRead ? "bg-muted-foreground/30" : "bg-primary"}`} />
                    <span className="truncate text-sm">{notif.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatShortDate(notif.createdAt)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
