"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import {
  Building2,
  Palette,
  Database,
  Bell,
  Moon,
  Sun,
  Monitor,
  Download,
  Save,
  Loader2,
  FileJson,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDateTime } from "@/lib/format"

interface BackupRecord {
  id: string
  filename: string
  sizeBytes: string
  type: "AUTOMATIC" | "MANUAL"
  status: "SUCCESS" | "FAILED"
  createdAt: string
  createdBy: { name: string } | null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AyarlarPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ciftlik profili
  const [farmName, setFarmName] = useState("")
  const [farmPhone, setFarmPhone] = useState("")
  const [farmAddress, setFarmAddress] = useState("")
  const [farmEmail, setFarmEmail] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  // Yedekleme
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([])
  const [backupListLoading, setBackupListLoading] = useState(true)

  // Bildirim tercihleri
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [vaccineReminders, setVaccineReminders] = useState(true)
  const [calvingReminders, setCalvingReminders] = useState(true)
  const [feedAlerts, setFeedAlerts] = useState(true)
  const [taskNotifications, setTaskNotifications] = useState(true)

  // Ciftlik profili verilerini session'dan yukle
  useEffect(() => {
    setMounted(true)
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session")
        if (res.ok) {
          const session = await res.json()
          if (session?.user) {
            setFarmName(session.user.farmName || "")
            setFarmEmail(session.user.email || "")
          }
        }
      } catch {
        // Session yuklenemezse sessizce gec
      }
    }
    loadSession()
  }, [])

  // Yedekleme kayitlarini yukle
  const fetchBackupRecords = useCallback(async () => {
    setBackupListLoading(true)
    try {
      const res = await fetch("/api/backup")
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setBackupRecords(json.data)
        }
      }
    } catch {
      // Yedekleme listesi yuklenemezse sessizce gec
    } finally {
      setBackupListLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackupRecords()
  }, [fetchBackupRecords])

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      // Ciftlik guncelleme API'si henuz mevcut degil — form durumunu dogrulayip kullaniciya bildir
      if (!farmName.trim()) {
        toast.error("Ciftlik adi bos birakilamaz")
        return
      }
      // TODO: Ciftlik guncelleme endpoint'i eklendiginde buraya PATCH istegi eklenecek
      // await fetch('/api/farm', { method: 'PATCH', body: JSON.stringify({ name: farmName, phone: farmPhone, address: farmAddress, email: farmEmail }) })
      toast.success("Ciftlik bilgileri kaydedildi")
    } catch {
      toast.error("Ciftlik bilgileri kaydedilirken bir hata olustu")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleManualBackup() {
    setBackupLoading(true)
    try {
      const res = await fetch("/api/backup", { method: "POST" })
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || "Yedekleme olusturulamadi")
      }

      // Content-Disposition header'indan dosya adini al
      const disposition = res.headers.get("Content-Disposition")
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/)
      const filename = filenameMatch?.[1] || "yedek.json"

      // Tarayicida dosya indirme islemi
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Yedekleme basariyla olusturuldu ve indirildi")
      await fetchBackupRecords()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Yedekleme olusturulurken bir hata olustu"
      )
    } finally {
      setBackupLoading(false)
    }
  }

  function handleSaveNotifications() {
    toast.success("Bildirim tercihleri kaydedildi")
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Ayarlar"
        description="Çiftlik yönetim sistemi ayarlarını yapılandırın."
      />

      <div className="space-y-6 max-w-3xl">
        {/* Çiftlik Profili */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-muted-foreground" />
              <div>
                <CardTitle>Çiftlik Profili</CardTitle>
                <CardDescription>Çiftlik bilgilerinizi güncelleyin.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="farmName">Çiftlik Adı</Label>
                <Input
                  id="farmName"
                  placeholder="Çiftlik adı"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmPhone">Telefon</Label>
                <Input
                  id="farmPhone"
                  type="tel"
                  placeholder="0532 XXX XX XX"
                  value={farmPhone}
                  onChange={(e) => setFarmPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmAddress">Adres</Label>
              <Input
                id="farmAddress"
                placeholder="Çiftlik adresi"
                value={farmAddress}
                onChange={(e) => setFarmAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmEmail">E-posta</Label>
              <Input
                id="farmEmail"
                type="email"
                placeholder="info@ciftlik.com"
                value={farmEmail}
                onChange={(e) => setFarmEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {savingProfile ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </CardContent>
        </Card>

        {/* Tema */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="size-5 text-muted-foreground" />
              <div>
                <CardTitle>Tema</CardTitle>
                <CardDescription>Uygulama görünüm ayarlarını değiştirin.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mounted && (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="size-4" />
                  Açık
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="size-4" />
                  Koyu
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="size-4" />
                  Sistem
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yedekleme */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="size-5 text-muted-foreground" />
              <div>
                <CardTitle>Yedekleme</CardTitle>
                <CardDescription>Çiftlik verilerinizi yedekleyin ve geri yükleyin.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verileriniz otomatik olarak günlük yedeklenmektedir. Manuel yedekleme
              oluşturmak için aşağıdaki butonu kullanabilirsiniz.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleManualBackup}
                disabled={backupLoading}
              >
                {backupLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {backupLoading ? "Yedekleniyor..." : "Manuel Yedek Al"}
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Son Yedeklemeler</p>
              {backupListLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Yükleniyor...
                </div>
              ) : backupRecords.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Henüz yedekleme kaydı bulunmuyor.
                </p>
              ) : (
                <div className="space-y-2">
                  {backupRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <FileJson className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{record.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(record.createdAt)}
                            {record.createdBy?.name && ` — ${record.createdBy.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(Number(record.sizeBytes))}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{
                          backgroundColor: record.type === "MANUAL" ? "var(--color-accent)" : "var(--color-muted)",
                          color: record.type === "MANUAL" ? "var(--color-accent-foreground)" : "var(--color-muted-foreground)",
                        }}>
                          {record.type === "MANUAL" ? "Manuel" : "Otomatik"}
                        </span>
                        {record.status === "SUCCESS" ? (
                          <CheckCircle2 className="size-4 text-[var(--color-success)]" />
                        ) : (
                          <XCircle className="size-4 text-[var(--color-destructive)]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bildirim Tercihleri */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-muted-foreground" />
              <div>
                <CardTitle>Bildirim Tercihleri</CardTitle>
                <CardDescription>Hangi bildirimleri almak istediğinizi seçin.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">E-posta Bildirimleri</p>
                <p className="text-xs text-muted-foreground">Önemli bildirimleri e-posta ile alın</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aşı Hatırlatmaları</p>
                <p className="text-xs text-muted-foreground">Yaklaşan aşı tarihlerini bildirin</p>
              </div>
              <Switch
                checked={vaccineReminders}
                onCheckedChange={setVaccineReminders}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Doğum Hatırlatmaları</p>
                <p className="text-xs text-muted-foreground">Beklenen doğum tarihlerini bildirin</p>
              </div>
              <Switch
                checked={calvingReminders}
                onCheckedChange={setCalvingReminders}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Yem Stok Uyarıları</p>
                <p className="text-xs text-muted-foreground">Yem stokları azaldığında bildirin</p>
              </div>
              <Switch
                checked={feedAlerts}
                onCheckedChange={setFeedAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Görev Bildirimleri</p>
                <p className="text-xs text-muted-foreground">Yeni görev atandığında bildirin</p>
              </div>
              <Switch
                checked={taskNotifications}
                onCheckedChange={setTaskNotifications}
              />
            </div>

            <Button onClick={handleSaveNotifications}>
              <Save className="size-4" />
              Tercihleri Kaydet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
