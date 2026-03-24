import Link from "next/link"
import {
  Beef,
  Droplets,
  GlassWater,
  TrendingUp,
  Plus,
  Syringe,
  Stethoscope,
  ClipboardList,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/shared/stat-card"
import { PageHeader } from "@/components/shared/page-header"

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title="Hoş Geldiniz"
        description="Çiftlik yönetim panelinize genel bakış."
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Hayvan"
          value="245"
          change={4.5}
          changeType="increase"
          icon={<Beef className="size-5" />}
        />
        <StatCard
          title="Sağmal İnek"
          value="120"
          change={2.1}
          changeType="increase"
          icon={<Droplets className="size-5" />}
        />
        <StatCard
          title="Günlük Süt"
          value="1.850 lt"
          change={1.8}
          changeType="decrease"
          icon={<GlassWater className="size-5" />}
        />
        <StatCard
          title="Aylık Gelir"
          value="₺125.000"
          change={8.2}
          changeType="increase"
          icon={<TrendingUp className="size-5" />}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/milk/new" />}>
                <Plus className="size-5" />
                <span>Süt Kaydı Ekle</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/animals/new" />}>
                <Beef className="size-5" />
                <span>Hayvan Ekle</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/health/vaccination/new" />}>
                <Syringe className="size-5" />
                <span>Aşı Kaydı</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" render={<Link href="/health/examination/new" />}>
                <Stethoscope className="size-5" />
                <span>Muayene Kaydı</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities & Upcoming Tasks */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-4" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
              Henüz aktivite kaydı bulunmuyor.
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-4" />
              Yaklaşan Görevler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
              Yaklaşan görev bulunmuyor.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
