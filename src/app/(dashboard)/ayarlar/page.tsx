"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function AyarlarPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Bildirim tercihleri
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [vaccineReminders, setVaccineReminders] = useState(true)
  const [calvingReminders, setCalvingReminders] = useState(true)
  const [feedAlerts, setFeedAlerts] = useState(true)
  const [taskNotifications, setTaskNotifications] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

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
                <Input id="farmName" placeholder="Çiftlik adı" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmPhone">Telefon</Label>
                <Input id="farmPhone" type="tel" placeholder="0532 XXX XX XX" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmAddress">Adres</Label>
              <Input id="farmAddress" placeholder="Çiftlik adresi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmEmail">E-posta</Label>
              <Input id="farmEmail" type="email" placeholder="info@ciftlik.com" />
            </div>
            <Button>
              <Save className="size-4" />
              Kaydet
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
              <Button variant="outline">
                <Download className="size-4" />
                Manuel Yedek Al
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Son Yedeklemeler</p>
              <p className="text-xs text-muted-foreground">
                Henüz yedekleme kaydı bulunmuyor.
              </p>
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
