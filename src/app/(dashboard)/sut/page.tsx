"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Plus, Milk, ShoppingCart, Calendar, TrendingUp, DollarSign } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MILK_SESSION_LABELS } from "@/lib/constants"
import { formatShortDate, formatCurrency } from "@/lib/format"
import { DeleteButton } from "@/components/shared/delete-button"

interface MilkRecord {
  id: string
  date: string
  session: string
  quantity: string | number
  fatPercentage: number | null
  proteinPercentage: number | null
  somaticCellCount: number | null
  notes: string | null
  animal: {
    id: string
    name: string | null
    earTagNumber: string
  }
}

interface MilkSale {
  id: string
  date: string
  quantity: string | number
  pricePerLiter: string | number
  totalAmount: string | number
  buyerName: string | null
  invoiceNumber: string | null
  notes: string | null
}

interface Stats {
  todayTotal: number
  weeklyAverage: number
  monthlyTotal: number
  totalSalesRevenue: number
}

function formatNumber(value: string | number, decimals = 1) {
  return Number(value).toFixed(decimals)
}

export default function SutPage() {
  const [records, setRecords] = useState<MilkRecord[]>([])
  const [todayRecords, setTodayRecords] = useState<MilkRecord[]>([])
  const [sales, setSales] = useState<MilkSale[]>([])
  const [stats, setStats] = useState<Stats>({
    todayTotal: 0,
    weeklyAverage: 0,
    monthlyTotal: 0,
    totalSalesRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterAnimalId, setFilterAnimalId] = useState("")
  const [filterSession, setFilterSession] = useState<string>("ALL")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]

      // Haftalık ortalama için 7 gün öncesini hesapla
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = weekAgo.toISOString().split("T")[0]

      // Aylık toplam için ayın başını hesapla
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthStartStr = monthStart.toISOString().split("T")[0]

      // Tüm kayıtlar için filtreli sorgu
      const allParams = new URLSearchParams({ limit: "100" })
      if (filterAnimalId) allParams.set("animalId", filterAnimalId)
      if (filterSession && filterSession !== "ALL") allParams.set("session", filterSession)
      if (filterStartDate) allParams.set("startDate", filterStartDate)
      if (filterEndDate) allParams.set("endDate", filterEndDate)

      const [allRes, todayRes, weekRes, monthRes, salesRes] = await Promise.all([
        fetch(`/api/milk?${allParams.toString()}`),
        fetch(`/api/milk?startDate=${todayStr}&endDate=${todayStr}T23:59:59.999Z&limit=100`),
        fetch(`/api/milk?startDate=${weekAgoStr}&limit=100`),
        fetch(`/api/milk?startDate=${monthStartStr}&limit=100`),
        fetch("/api/milk/sales?limit=100"),
      ])

      const [allData, todayData, weekData, monthData, salesData] = await Promise.all([
        allRes.json(),
        todayRes.json(),
        weekRes.json(),
        monthRes.json(),
        salesRes.json(),
      ])

      setRecords(allData.data || [])
      setTodayRecords(todayData.data || [])
      setSales(salesData.data || [])

      // İstatistikleri hesapla
      const todayTotal = (todayData.data || []).reduce(
        (sum: number, r: MilkRecord) => sum + Number(r.quantity),
        0
      )

      const weekTotal = (weekData.data || []).reduce(
        (sum: number, r: MilkRecord) => sum + Number(r.quantity),
        0
      )
      const weeklyAverage = weekTotal / 7

      const monthlyTotal = (monthData.data || []).reduce(
        (sum: number, r: MilkRecord) => sum + Number(r.quantity),
        0
      )

      const totalSalesRevenue = (salesData.data || []).reduce(
        (sum: number, s: MilkSale) => sum + Number(s.totalAmount),
        0
      )

      setStats({ todayTotal, weeklyAverage, monthlyTotal, totalSalesRevenue })
    } catch (error) {
      console.error("Veri yükleme hatası:", error)
    } finally {
      setLoading(false)
    }
  }, [filterAnimalId, filterSession, filterStartDate, filterEndDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Süt Yönetimi" description="Süt üretimi ve satış kayıtlarını yönetin.">
        <Button render={<Link href="/sut/satis/new" />} variant="outline">
          <ShoppingCart className="size-4" />
          Yeni Satış
        </Button>
        <Button render={<Link href="/sut/kayit/new" />}>
          <Plus className="size-4" />
          Yeni Kayıt
        </Button>
      </PageHeader>

      {/* Özet İstatistikler */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bugünkü Toplam"
          value={`${formatNumber(stats.todayTotal)} L`}
          icon={<Calendar className="size-4" />}
        />
        <StatCard
          title="Bu Haftaki Ortalama"
          value={`${formatNumber(stats.weeklyAverage)} L/gün`}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          title="Bu Ayki Toplam"
          value={`${formatNumber(stats.monthlyTotal)} L`}
          icon={<Milk className="size-4" />}
        />
        <StatCard
          title="Toplam Satış Geliri"
          value={formatCurrency(stats.totalSalesRevenue)}
          icon={<DollarSign className="size-4" />}
        />
      </div>

      {/* Sekmeler */}
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Günlük Kayıt</TabsTrigger>
          <TabsTrigger value="all">Tüm Kayıtlar</TabsTrigger>
          <TabsTrigger value="sales">Satışlar</TabsTrigger>
        </TabsList>

        {/* Günlük Kayıt Sekmesi */}
        <TabsContent value="daily">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Bugünkü Kayıtlar ({formatShortDate(new Date().toISOString())})
              </h3>
              <div className="text-sm text-muted-foreground">
                Toplam: <span className="font-bold text-foreground">{formatNumber(stats.todayTotal)} L</span>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
            ) : todayRecords.length === 0 ? (
              <EmptyState
                icon={<Milk className="size-6" />}
                title="Bugün kayıt yok"
                description="Bugün henüz süt kaydı eklenmemiş. Yeni kayıt ekleyerek başlayabilirsiniz."
                action={
                  <Button render={<Link href="/sut/kayit/new" />}>
                    <Plus className="size-4" />
                    Yeni Kayıt Ekle
                  </Button>
                }
              />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hayvan</TableHead>
                      <TableHead>Kulak No</TableHead>
                      <TableHead>Sağım</TableHead>
                      <TableHead className="text-right">Miktar (L)</TableHead>
                      <TableHead className="text-right">Yağ %</TableHead>
                      <TableHead className="text-right">Protein %</TableHead>
                      <TableHead>Not</TableHead>
                      <TableHead>İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.animal.name || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.animal.earTagNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {MILK_SESSION_LABELS[record.session] || record.session}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatNumber(record.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.fatPercentage != null ? `${record.fatPercentage}%` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.proteinPercentage != null ? `${record.proteinPercentage}%` : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {record.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <DeleteButton id={record.id} apiUrl="/api/milk" entityName="Süt kaydı" onDeleted={fetchData} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tüm Kayıtlar Sekmesi */}
        <TabsContent value="all">
          <div className="space-y-4">
            {/* Filtreler */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Sağım Zamanı</label>
                <select
                  value={filterSession}
                  onChange={(e) => setFilterSession(e.target.value)}
                  className="h-9 w-[140px] cursor-pointer rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="ALL">Tümü</option>
                  <option value="MORNING">Sabah</option>
                  <option value="EVENING">Akşam</option>
                  <option value="TOTAL">Toplam</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Başlangıç</label>
                <Input
                  type="date"
                  className="w-[160px]"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Bitiş</label>
                <Input
                  type="date"
                  className="w-[160px]"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
            ) : records.length === 0 ? (
              <EmptyState
                icon={<Milk className="size-6" />}
                title="Süt kaydı bulunamadı"
                description="Henüz süt kaydı eklenmemiş veya filtrelerinize uygun kayıt yok."
                action={
                  <Button render={<Link href="/sut/kayit/new" />}>
                    <Plus className="size-4" />
                    Yeni Kayıt Ekle
                  </Button>
                }
              />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Hayvan</TableHead>
                      <TableHead>Kulak No</TableHead>
                      <TableHead>Sağım</TableHead>
                      <TableHead className="text-right">Miktar (L)</TableHead>
                      <TableHead className="text-right">Yağ %</TableHead>
                      <TableHead className="text-right">Protein %</TableHead>
                      <TableHead className="text-right">SHS</TableHead>
                      <TableHead>Not</TableHead>
                      <TableHead>İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatShortDate(record.date)}</TableCell>
                        <TableCell className="font-medium">
                          {record.animal.name || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.animal.earTagNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {MILK_SESSION_LABELS[record.session] || record.session}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatNumber(record.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.fatPercentage != null ? `${record.fatPercentage}%` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.proteinPercentage != null ? `${record.proteinPercentage}%` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.somaticCellCount != null
                            ? record.somaticCellCount.toLocaleString("tr-TR")
                            : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {record.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <DeleteButton id={record.id} apiUrl="/api/milk" entityName="Süt kaydı" onDeleted={fetchData} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Satışlar Sekmesi */}
        <TabsContent value="sales">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Süt Satışları</h3>
              <Button render={<Link href="/sut/satis/new" />} variant="outline" size="sm">
                <Plus className="size-4" />
                Yeni Satış
              </Button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
            ) : sales.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="size-6" />}
                title="Satış kaydı bulunamadı"
                description="Henüz süt satışı kaydı eklenmemiş."
                action={
                  <Button render={<Link href="/sut/satis/new" />}>
                    <Plus className="size-4" />
                    Yeni Satış Ekle
                  </Button>
                }
              />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Alıcı</TableHead>
                      <TableHead className="text-right">Miktar (L)</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead className="text-right">Toplam Tutar</TableHead>
                      <TableHead>Fatura No</TableHead>
                      <TableHead>Not</TableHead>
                      <TableHead>İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{formatShortDate(sale.date)}</TableCell>
                        <TableCell className="font-medium">
                          {sale.buyerName || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(sale.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(sale.pricePerLiter) || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(sale.totalAmount) || 0)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {sale.invoiceNumber || "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {sale.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <DeleteButton id={sale.id} apiUrl="/api/milk/sales" entityName="Süt satışı" onDeleted={fetchData} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
