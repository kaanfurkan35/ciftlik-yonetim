import {
  BarChart3,
  Milk,
  Wallet,
  ShieldCheck,
  Users,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_COLORS,
  ANIMAL_SEX_LABELS,
  TRANSACTION_CATEGORY_LABELS,
} from "@/lib/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { ExportButtons } from "./export-buttons"
import { formatCurrency } from "@/lib/format"
import { StatusDistributionChart } from "@/components/charts/status-distribution-chart"
import { BreedDistributionChart } from "@/components/charts/breed-distribution-chart"
import { MilkProductionChart } from "@/components/charts/milk-production-chart"
import { CategoryPieChart } from "@/components/charts/category-pie-chart"

// ============================================================================
// Veri yükleme fonksiyonları
// ============================================================================

async function getHerdSummary(farmId: string) {
  const animals = await prisma.animal.findMany({
    where: { farmId, deletedAt: null },
    select: { status: true, breed: true, sex: true },
  })

  const byStatus: Record<string, number> = {}
  const byBreed: Record<string, number> = {}
  const bySex: Record<string, number> = {}

  for (const a of animals) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1
    if (a.breed) byBreed[a.breed] = (byBreed[a.breed] || 0) + 1
    bySex[a.sex] = (bySex[a.sex] || 0) + 1
  }

  return { total: animals.length, byStatus, byBreed, bySex }
}

async function getMilkSummary(farmId: string) {
  const animals = await prisma.animal.findMany({
    where: { farmId, deletedAt: null, status: "LACTATING" },
    select: { id: true, name: true, earTagNumber: true },
  })

  const animalIds = animals.map((a) => a.id)

  // Son 6 aylık süt verileri
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const milkRecords = await prisma.milkRecord.findMany({
    where: {
      animalId: { in: animalIds },
      deletedAt: null,
      date: { gte: sixMonthsAgo },
    },
    select: {
      animalId: true,
      date: true,
      quantity: true,
      session: true,
    },
  })

  // Aylık özet
  const monthlyMap: Record<string, number> = {}
  // Hayvan bazlı toplam
  const animalTotals: Record<string, number> = {}

  for (const r of milkRecords) {
    const month = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`
    const qty = Number(r.quantity)
    monthlyMap[month] = (monthlyMap[month] || 0) + qty
    animalTotals[r.animalId] = (animalTotals[r.animalId] || 0) + qty
  }

  const monthlySummary = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({
      month,
      label: formatMonthLabel(month),
      total: Math.round(total * 100) / 100,
    }))

  // En çok süt veren ilk 10
  const topProducers = Object.entries(animalTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([animalId, total]) => {
      const animal = animals.find((a) => a.id === animalId)
      return {
        name: animal?.name || "-",
        earTag: animal?.earTagNumber || "-",
        total: Math.round(total * 100) / 100,
      }
    })

  const totalMilk = milkRecords.reduce((sum, r) => sum + Number(r.quantity), 0)

  return {
    totalMilk: Math.round(totalMilk * 100) / 100,
    lactatingCount: animals.length,
    monthlySummary,
    topProducers,
  }
}

async function getFinanceSummary(farmId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { farmId, deletedAt: null },
    select: { type: true, category: true, amount: true },
  })

  let totalIncome = 0
  let totalExpense = 0
  const incomeByCategory: Record<string, number> = {}
  const expenseByCategory: Record<string, number> = {}

  for (const tx of transactions) {
    const amount = Number(tx.amount)
    if (tx.type === "INCOME") {
      totalIncome += amount
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + amount
    } else {
      totalExpense += amount
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + amount
    }
  }

  return {
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    incomeByCategory: Object.entries(incomeByCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([category, total]) => ({ category, total })),
    expenseByCategory: Object.entries(expenseByCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([category, total]) => ({ category, total })),
  }
}

async function getHealthSummary(farmId: string) {
  const animals = await prisma.animal.findMany({
    where: { farmId, deletedAt: null },
    select: { id: true },
  })

  const animalIds = animals.map((a) => a.id)

  // Toplam aşı kayıtları
  const totalVaccinations = await prisma.vaccinationRecord.count({
    where: { animalId: { in: animalIds }, deletedAt: null },
  })

  // Yaklaşmakta olan aşılar (sonraki 30 gün)
  const now = new Date()
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

  const upcomingVaccinations = await prisma.vaccinationRecord.count({
    where: {
      animalId: { in: animalIds },
      deletedAt: null,
      nextDueDate: { gte: now, lte: thirtyDaysLater },
    },
  })

  // Geçmiş aşılar (zamanı geçmiş)
  const overdueVaccinations = await prisma.vaccinationRecord.count({
    where: {
      animalId: { in: animalIds },
      deletedAt: null,
      nextDueDate: { lt: now },
    },
  })

  // Aşı türleri bazında sayılar
  const vaccinationTypes = await prisma.vaccinationType.findMany({
    where: { farmId, deletedAt: null },
    select: { id: true, name: true, _count: { select: { vaccinationRecords: true } } },
  })

  // Son sağlık kayıtları
  const recentHealthRecords = await prisma.healthRecord.count({
    where: {
      animalId: { in: animalIds },
      deletedAt: null,
      date: { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) },
    },
  })

  return {
    totalVaccinations,
    upcomingVaccinations,
    overdueVaccinations,
    vaccinationTypes: vaccinationTypes.map((vt) => ({
      name: vt.name,
      count: vt._count.vaccinationRecords,
    })),
    recentHealthRecords,
    totalAnimals: animals.length,
  }
}

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-")
  const date = new Date(Number(year), Number(month) - 1)
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(date)
}

// ============================================================================
// Sayfa bileşeni
// ============================================================================

export default async function RaporlarPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const farmId = session.user.farmId
  const [herd, milk, finance, health] = await Promise.all([
    getHerdSummary(farmId),
    getMilkSummary(farmId),
    getFinanceSummary(farmId),
    getHealthSummary(farmId),
  ])

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Raporlar"
        description="Çiftliğinizin genel durumu ve istatistikleri."
      >
        <ExportButtons
          reportData={{
            herd: { total: herd.total, byStatus: herd.byStatus, byBreed: herd.byBreed },
            milk: { totalMilk: milk.totalMilk, monthlySummary: milk.monthlySummary },
            finance: { totalIncome: finance.totalIncome, totalExpense: finance.totalExpense, profit: finance.profit, incomeByCategory: finance.incomeByCategory, expenseByCategory: finance.expenseByCategory },
            health: { totalRecords: health.totalVaccinations, vaccinationCompliance: health.totalVaccinations > 0 ? Math.round(((health.totalVaccinations - health.overdueVaccinations) / health.totalVaccinations) * 100) : 0 },
          }}
        />
      </PageHeader>

      <Tabs defaultValue="suru">
        <TabsList>
          <TabsTrigger value="suru">
            <Users className="mr-1 size-4" />
            Sürü Özeti
          </TabsTrigger>
          <TabsTrigger value="sut">
            <Milk className="mr-1 size-4" />
            Süt Üretimi
          </TabsTrigger>
          <TabsTrigger value="finans">
            <Wallet className="mr-1 size-4" />
            Finansal Özet
          </TabsTrigger>
          <TabsTrigger value="saglik">
            <ShieldCheck className="mr-1 size-4" />
            Sağlık
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* Sürü Özeti */}
        {/* ================================================================ */}
        <TabsContent value="suru">
          <div className="space-y-6 pt-4">
            {/* Duruma göre sayılar */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Duruma Göre Hayvan Sayıları
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Toplam Hayvan"
                  value={herd.total}
                  icon={<BarChart3 className="size-4" />}
                  className="border-l-4 border-l-primary"
                />
                {Object.entries(herd.byStatus).map(([status, count]) => (
                  <Card key={status}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {ANIMAL_STATUS_LABELS[status] || status}
                      </CardTitle>
                      <Badge className={ANIMAL_STATUS_COLORS[status] || ""}>
                        {count}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground">
                        %{herd.total > 0 ? ((count / herd.total) * 100).toFixed(1) : 0}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Grafik dağılımları */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Durum Dağılımı</CardTitle></CardHeader>
                <CardContent><StatusDistributionChart data={herd.byStatus} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Irk Dağılımı</CardTitle></CardHeader>
                <CardContent><BreedDistributionChart data={herd.byBreed} /></CardContent>
              </Card>
            </div>

            {/* Irka göre dağılım */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Irka Göre Dağılım
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Irk</TableHead>
                        <TableHead className="text-right">Sayı</TableHead>
                        <TableHead className="text-right">Oran</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(herd.byBreed)
                        .sort(([, a], [, b]) => b - a)
                        .map(([breed, count]) => (
                          <TableRow key={breed}>
                            <TableCell className="font-medium">{breed}</TableCell>
                            <TableCell className="text-right">{count}</TableCell>
                            <TableCell className="text-right">
                              %{((count / herd.total) * 100).toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Cinsiyete göre dağılım */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Cinsiyete Göre Dağılım
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cinsiyet</TableHead>
                        <TableHead className="text-right">Sayı</TableHead>
                        <TableHead className="text-right">Oran</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(herd.bySex).map(([sex, count]) => (
                        <TableRow key={sex}>
                          <TableCell className="font-medium">
                            {ANIMAL_SEX_LABELS[sex] || sex}
                          </TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                          <TableCell className="text-right">
                            %{((count / herd.total) * 100).toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* Süt Üretimi */}
        {/* ================================================================ */}
        <TabsContent value="sut">
          <div className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="Toplam Süt (Son 6 Ay)"
                value={`${milk.totalMilk.toLocaleString("tr-TR")} lt`}
                icon={<Milk className="size-4" />}
                className="border-l-4 border-l-success"
              />
              <StatCard
                title="Sağımlak Hayvan"
                value={milk.lactatingCount}
                icon={<Users className="size-4" />}
                className="border-l-4 border-l-primary"
              />
              <StatCard
                title="Ortalama Günlük"
                value={`${milk.lactatingCount > 0 ? Math.round((milk.totalMilk / 180) * 100) / 100 : 0} lt`}
                icon={<BarChart3 className="size-4" />}
                className="border-l-4 border-l-accent"
              />
            </div>

            {/* Aylık süt üretimi grafiği */}
            <Card>
              <CardHeader><CardTitle>Aylık Süt Üretimi Trendi</CardTitle></CardHeader>
              <CardContent><MilkProductionChart data={milk.monthlySummary} /></CardContent>
            </Card>

            {/* Aylık özet tablosu */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Aylık Süt Üretimi (Son 6 Ay)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {milk.monthlySummary.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ay</TableHead>
                        <TableHead className="text-right">Toplam (lt)</TableHead>
                        <TableHead className="text-right">Günlük Ort. (lt)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {milk.monthlySummary.map((m) => (
                        <TableRow key={m.month}>
                          <TableCell className="font-medium">{m.label}</TableCell>
                          <TableCell className="text-right">
                            {m.total.toLocaleString("tr-TR")}
                          </TableCell>
                          <TableCell className="text-right">
                            {(m.total / 30).toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Henüz süt kaydı bulunmuyor.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* En iyi üreticiler */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  En Çok Süt Veren Hayvanlar (Son 6 Ay)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {milk.topProducers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sıra</TableHead>
                        <TableHead>Kulak No</TableHead>
                        <TableHead>İsim</TableHead>
                        <TableHead className="text-right">Toplam (lt)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {milk.topProducers.map((p, idx) => (
                        <TableRow key={p.earTag}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {p.earTag}
                          </TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell className="text-right font-medium">
                            {p.total.toLocaleString("tr-TR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Henüz süt kaydı bulunmuyor.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* Finansal Özet */}
        {/* ================================================================ */}
        <TabsContent value="finans">
          <div className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="Toplam Gelir"
                value={formatCurrency(finance.totalIncome)}
                icon={<Wallet className="size-4" />}
                className="border-l-4 border-l-success"
              />
              <StatCard
                title="Toplam Gider"
                value={formatCurrency(finance.totalExpense)}
                icon={<Wallet className="size-4" />}
                className="border-l-4 border-l-destructive"
              />
              <StatCard
                title="Kar / Zarar"
                value={formatCurrency(finance.profit)}
                icon={<BarChart3 className="size-4" />}
                className={`border-l-4 ${finance.profit >= 0 ? "border-l-success" : "border-l-destructive"}`}
              />
            </div>

            {/* Gelir/Gider grafikleri */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Gelir Dağılımı</CardTitle></CardHeader>
                <CardContent>
                  <CategoryPieChart data={finance.incomeByCategory.map((item) => ({
                    name: TRANSACTION_CATEGORY_LABELS[item.category] || item.category,
                    value: item.total,
                  }))} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Gider Dağılımı</CardTitle></CardHeader>
                <CardContent>
                  <CategoryPieChart data={finance.expenseByCategory.map((item) => ({
                    name: TRANSACTION_CATEGORY_LABELS[item.category] || item.category,
                    value: item.total,
                  }))} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Gelir kategorileri */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Gelir Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {finance.incomeByCategory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Tutar</TableHead>
                          <TableHead className="text-right">Oran</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finance.incomeByCategory.map((item) => (
                          <TableRow key={item.category}>
                            <TableCell className="font-medium">
                              {TRANSACTION_CATEGORY_LABELS[item.category] || item.category}
                            </TableCell>
                            <TableCell className="text-right text-success">
                              {formatCurrency(item.total)}
                            </TableCell>
                            <TableCell className="text-right">
                              %{finance.totalIncome > 0 ? ((item.total / finance.totalIncome) * 100).toFixed(1) : 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Henüz gelir kaydı yok.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Gider kategorileri */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Gider Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {finance.expenseByCategory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Tutar</TableHead>
                          <TableHead className="text-right">Oran</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finance.expenseByCategory.map((item) => (
                          <TableRow key={item.category}>
                            <TableCell className="font-medium">
                              {TRANSACTION_CATEGORY_LABELS[item.category] || item.category}
                            </TableCell>
                            <TableCell className="text-right text-destructive">
                              {formatCurrency(item.total)}
                            </TableCell>
                            <TableCell className="text-right">
                              %{finance.totalExpense > 0 ? ((item.total / finance.totalExpense) * 100).toFixed(1) : 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Henüz gider kaydı yok.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* Sağlık */}
        {/* ================================================================ */}
        <TabsContent value="saglik">
          <div className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Toplam Aşı Kaydı"
                value={health.totalVaccinations}
                icon={<ShieldCheck className="size-4" />}
                className="border-l-4 border-l-primary"
              />
              <StatCard
                title="Yaklaşan Aşılar (30 Gün)"
                value={health.upcomingVaccinations}
                icon={<ShieldCheck className="size-4" />}
                className="border-l-4 border-l-warning"
              />
              <StatCard
                title="Geciken Aşılar"
                value={health.overdueVaccinations}
                icon={<ShieldCheck className="size-4" />}
                className="border-l-4 border-l-destructive"
              />
              <StatCard
                title="Son 3 Ay Sağlık Kaydı"
                value={health.recentHealthRecords}
                icon={<ShieldCheck className="size-4" />}
                className="border-l-4 border-l-success"
              />
            </div>

            {/* Aşı uyum oranı */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Aşı Uyum Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Toplam hayvan sayısı</span>
                    <span className="font-medium">{health.totalAnimals}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Zamanında yapılan aşılar</span>
                    <span className="font-medium text-success">
                      {health.totalVaccinations - health.overdueVaccinations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Geciken aşılar</span>
                    <span className="font-medium text-destructive">
                      {health.overdueVaccinations}
                    </span>
                  </div>
                  {health.totalVaccinations > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uyum oranı</span>
                        <span className="font-medium">
                          %
                          {(
                            ((health.totalVaccinations - health.overdueVaccinations) /
                              health.totalVaccinations) *
                            100
                          ).toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-success"
                          style={{
                            width: `${Math.min(
                              ((health.totalVaccinations - health.overdueVaccinations) /
                                health.totalVaccinations) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aşı türleri bazında dağılım */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Aşı Türleri ve Uygulama Sayıları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aşı Türü</TableHead>
                      <TableHead className="text-right">Uygulama Sayısı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {health.vaccinationTypes.map((vt) => (
                      <TableRow key={vt.name}>
                        <TableCell className="font-medium">{vt.name}</TableCell>
                        <TableCell className="text-right">{vt.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
