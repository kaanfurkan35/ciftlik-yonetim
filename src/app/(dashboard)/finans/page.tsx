"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Calendar,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_CATEGORY_LABELS,
} from "@/lib/constants"
import { formatCurrency, formatShortDate } from "@/lib/format"
import { CategoryPieChart } from "@/components/charts/category-pie-chart"
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart"

// ============================================================================
// Yardımcı fonksiyonlar
// ============================================================================

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-")
  const date = new Date(Number(year), Number(month) - 1)
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(date)
}

// ============================================================================
// Tip tanımları
// ============================================================================

interface Transaction {
  id: string
  type: string
  category: string
  amount: string | number
  date: string
  description: string | null
  invoiceNumber: string | null
  notes: string | null
  animal: { id: string; name: string | null; earTagNumber: string } | null
  createdBy: { id: string; name: string } | null
}

interface FinanceSummary {
  totalIncome: number
  totalExpense: number
  profit: number
  incomeCount: number
  expenseCount: number
  incomeByCategory: { category: string; total: number; count: number }[]
  expenseByCategory: { category: string; total: number; count: number }[]
  monthlyTrend: { month: string; income: number; expense: number; profit: number }[]
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ============================================================================
// İşlem tablosu componenti
// ============================================================================

function TransactionTable({
  transactions,
  onDelete,
}: {
  transactions: Transaction[]
  onDelete: (id: string) => void
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="size-6" />}
        title="Henüz işlem bulunmuyor"
        description="Yeni gelir veya gider ekleyerek başlayabilirsiniz."
        action={
          <div className="flex gap-2">
            <Button render={<Link href="/finans/gelir/new" />}>
              <Plus className="size-4" />
              Gelir Ekle
            </Button>
            <Button variant="outline" render={<Link href="/finans/gider/new" />}>
              <Plus className="size-4" />
              Gider Ekle
            </Button>
          </div>
        }
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium">Tarih</th>
            <th className="pb-2 pr-4 font-medium">Tür</th>
            <th className="pb-2 pr-4 font-medium">Kategori</th>
            <th className="pb-2 pr-4 font-medium">Açıklama</th>
            <th className="pb-2 pr-4 font-medium text-right">Tutar</th>
            <th className="pb-2 pr-4 font-medium">Fatura No</th>
            <th className="pb-2 font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b last:border-0">
              <td className="py-2 pr-4 whitespace-nowrap">{formatShortDate(tx.date)}</td>
              <td className="py-2 pr-4">
                <Badge
                  className={
                    tx.type === "INCOME"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }
                >
                  {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
                </Badge>
              </td>
              <td className="py-2 pr-4">
                {TRANSACTION_CATEGORY_LABELS[tx.category] ?? tx.category}
              </td>
              <td className="py-2 pr-4 max-w-[200px] truncate">
                {tx.description || "-"}
              </td>
              <td
                className={`py-2 pr-4 text-right font-medium whitespace-nowrap ${
                  tx.type === "INCOME"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {tx.type === "INCOME" ? "+" : "-"}
                {formatCurrency(Number(tx.amount))}
              </td>
              <td className="py-2 pr-4 font-mono text-xs">
                {tx.invoiceNumber || "-"}
              </td>
              <td className="py-2">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(tx.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// Kategori dağılım componenti
// ============================================================================

function CategoryBreakdown({
  title,
  items,
  total,
  colorClass,
}: {
  title: string
  items: { category: string; total: number; count: number }[]
  total: number
  colorClass: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const percentage = total > 0 ? (item.total / total) * 100 : 0
          return (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{TRANSACTION_CATEGORY_LABELS[item.category] ?? item.category}</span>
                <span className="font-medium">{formatCurrency(item.total)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full ${colorClass}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {item.count} işlem - %{percentage.toFixed(1)}
              </p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Ana sayfa componenti
// ============================================================================

export default function FinansPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [activeTab, setActiveTab] = useState("ozet")

  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/finance/summary?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setSummary(json.data)
      }
    } catch {
      console.error("Özet yüklenemedi")
    }
  }, [dateFrom, dateTo])

  const fetchTransactions = useCallback(
    async (type?: string) => {
      try {
        const params = new URLSearchParams()
        if (type) params.set("type", type)
        if (search) params.set("search", search)
        if (dateFrom) params.set("dateFrom", dateFrom)
        if (dateTo) params.set("dateTo", dateTo)
        params.set("limit", "50")

        const res = await fetch(`/api/finance?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          setTransactions(json.data)
          setMeta(json.meta)
        }
      } catch {
        console.error("İşlemler yüklenemedi")
      }
    },
    [search, dateFrom, dateTo]
  )

  useEffect(() => {
    async function load() {
      setLoading(true)
      await Promise.all([fetchSummary(), fetchTransactions()])
      setLoading(false)
    }
    load()
  }, [fetchSummary, fetchTransactions])

  async function handleDelete(id: string) {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return
    try {
      const res = await fetch(`/api/finance/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        toast.success("İşlem başarıyla silindi")
        fetchTransactions()
        fetchSummary()
      } else {
        toast.error(json.error || "İşlem silinirken hata oluştu")
      }
    } catch {
      toast.error("İşlem silinirken bir hata oluştu")
    }
  }

  function handleTabChange(type?: string) {
    fetchTransactions(type)
  }

  const incomeTransactions = transactions.filter((t) => t.type === "INCOME")
  const expenseTransactions = transactions.filter((t) => t.type === "EXPENSE")

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Finansal Yönetim" description="Çiftliğinizin gelir ve giderlerini yönetin.">
        <div className="flex gap-2">
          <Button render={<Link href="/finans/gelir/new" />}>
            <ArrowUpRight className="size-4" />
            Gelir Ekle
          </Button>
          <Button variant="outline" render={<Link href="/finans/gider/new" />}>
            <ArrowDownRight className="size-4" />
            Gider Ekle
          </Button>
        </div>
      </PageHeader>

      {/* Tarih filtresi */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
            placeholder="Başlangıç"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
            placeholder="Bitiş"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İşlem ara..."
            className="w-[200px] pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="ozet"
        onValueChange={(val) => {
          setActiveTab(val as string)
          if (val === "gelirler") handleTabChange("INCOME")
          else if (val === "giderler") handleTabChange("EXPENSE")
          else if (val === "tum") handleTabChange()
          else handleTabChange()
        }}
      >
        <TabsList>
          <TabsTrigger value="ozet">Özet</TabsTrigger>
          <TabsTrigger value="gelirler">Gelirler</TabsTrigger>
          <TabsTrigger value="giderler">Giderler</TabsTrigger>
          <TabsTrigger value="tum">Tüm İşlemler</TabsTrigger>
        </TabsList>

        {/* Özet Tab */}
        <TabsContent value="ozet">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
              Yükleniyor...
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* Özet kartları */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Toplam Gelir"
                  value={formatCurrency(summary.totalIncome)}
                  icon={<TrendingUp className="size-4" />}
                  className="border-l-4 border-l-green-500"
                />
                <StatCard
                  title="Toplam Gider"
                  value={formatCurrency(summary.totalExpense)}
                  icon={<TrendingDown className="size-4" />}
                  className="border-l-4 border-l-red-500"
                />
                <StatCard
                  title="Kar / Zarar"
                  value={formatCurrency(summary.profit)}
                  icon={<Wallet className="size-4" />}
                  className={`border-l-4 ${
                    summary.profit >= 0 ? "border-l-green-500" : "border-l-red-500"
                  }`}
                />
                <StatCard
                  title="Toplam İşlem"
                  value={summary.incomeCount + summary.expenseCount}
                  icon={<Calendar className="size-4" />}
                />
              </div>

              {/* Kategori dağılımı */}
              <div className="grid gap-4 md:grid-cols-2">
                <CategoryBreakdown
                  title="Gelir Dağılımı"
                  items={summary.incomeByCategory}
                  total={summary.totalIncome}
                  colorClass="bg-green-500"
                />
                <CategoryBreakdown
                  title="Gider Dağılımı"
                  items={summary.expenseByCategory}
                  total={summary.totalExpense}
                  colorClass="bg-red-500"
                />
              </div>

              {/* Kategori pasta grafikleri */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Gelir Da\u011f\u0131l\u0131m\u0131</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CategoryPieChart
                      data={summary.incomeByCategory.map((c) => ({
                        name: TRANSACTION_CATEGORY_LABELS[c.category] ?? c.category,
                        value: c.total,
                      }))}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Gider Da\u011f\u0131l\u0131m\u0131</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CategoryPieChart
                      data={summary.expenseByCategory.map((c) => ({
                        name: TRANSACTION_CATEGORY_LABELS[c.category] ?? c.category,
                        value: c.total,
                      }))}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Aylık trend grafik */}
              {summary.monthlyTrend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      6 Ayl\u0131k Gelir/Gider Trendi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MonthlyTrendChart data={summary.monthlyTrend} />
                  </CardContent>
                </Card>
              )}

              {/* Aylık trend tablo */}
              {summary.monthlyTrend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Ayl\u0131k Trend (Son 6 Ay)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 pr-4 font-medium">Ay</th>
                            <th className="pb-2 pr-4 font-medium text-right">Gelir</th>
                            <th className="pb-2 pr-4 font-medium text-right">Gider</th>
                            <th className="pb-2 font-medium text-right">Kar/Zarar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.monthlyTrend.map((item) => (
                            <tr key={item.month} className="border-b last:border-0">
                              <td className="py-2 pr-4">{formatMonthLabel(item.month)}</td>
                              <td className="py-2 pr-4 text-right text-green-600 dark:text-green-400">
                                {formatCurrency(item.income)}
                              </td>
                              <td className="py-2 pr-4 text-right text-red-600 dark:text-red-400">
                                {formatCurrency(item.expense)}
                              </td>
                              <td
                                className={`py-2 text-right font-medium ${
                                  item.profit >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {formatCurrency(item.profit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Wallet className="size-6" />}
              title="Finansal veri bulunamadı"
              description="Gelir veya gider ekleyerek başlayabilirsiniz."
            />
          )}
        </TabsContent>

        {/* Gelirler Tab */}
        <TabsContent value="gelirler">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4 text-green-600" />
                Gelirler
                {meta && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({incomeTransactions.length} kayıt)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={incomeTransactions}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Giderler Tab */}
        <TabsContent value="giderler">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="size-4 text-red-600" />
                Giderler
                {meta && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({expenseTransactions.length} kayıt)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={expenseTransactions}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tüm İşlemler Tab */}
        <TabsContent value="tum">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-4" />
                Tüm İşlemler
                {meta && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({meta.total} kayıt)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={transactions}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
