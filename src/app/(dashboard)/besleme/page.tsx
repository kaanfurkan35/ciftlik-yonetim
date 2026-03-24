import Link from "next/link"
import { Plus, Wheat, AlertTriangle, ShoppingCart, ClipboardList } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FEED_UNIT_LABELS } from "@/lib/constants"

export default async function BeslemePage() {
  // Yem türleri
  const feedTypes = await prisma.feedType.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  })

  // Son satın alma kayıtları
  const purchases = await prisma.feedPurchase.findMany({
    where: { deletedAt: null },
    include: {
      feedType: { select: { id: true, name: true, unit: true } },
    },
    orderBy: { date: "desc" },
    take: 50,
  })

  // Son yemleme kayıtları
  const feedingRecords = await prisma.feedingRecord.findMany({
    where: { deletedAt: null },
    include: {
      feedType: { select: { id: true, name: true, unit: true } },
      animal: { select: { id: true, name: true, earTagNumber: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 50,
  })

  // İstatistikler
  const totalFeedTypes = feedTypes.length
  const lowStockTypes = feedTypes.filter(
    (ft) => Number(ft.currentStock) <= Number(ft.minimumStock)
  )

  // Bu ayki harcama
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyPurchases = purchases.filter(
    (p) => new Date(p.date) >= firstDayOfMonth
  )
  const monthlyExpense = monthlyPurchases.reduce(
    (sum, p) => sum + Number(p.totalCost),
    0
  )

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Besleme Yönetimi"
        description="Yem stoku, satın alma ve yemleme kayıtlarını yönetin."
      >
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/besleme/stok/new" />}>
            <Plus className="size-4" />
            Yeni Yem Türü
          </Button>
          <Button variant="outline" render={<Link href="/besleme/satin-alma/new" />}>
            <ShoppingCart className="size-4" />
            Satın Alma
          </Button>
          <Button render={<Link href="/besleme/kayit/new" />}>
            <ClipboardList className="size-4" />
            Yemleme Kaydı
          </Button>
        </div>
      </PageHeader>

      {/* İstatistik kartları */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wheat className="size-4" />
              Toplam Yem Çeşidi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedTypes}</div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="size-4 text-red-500" />
              Düşük Stoklu Yemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockTypes.length}
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShoppingCart className="size-4" />
              Bu Ayki Harcama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyExpense.toLocaleString("tr-TR", {
                style: "currency",
                currency: "TRY",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sekmeli içerik */}
      <Tabs defaultValue="stok">
        <TabsList>
          <TabsTrigger value="stok">Yem Stoku</TabsTrigger>
          <TabsTrigger value="satin-alma">Satın Alma</TabsTrigger>
          <TabsTrigger value="kayitlar">Besleme Kayıtları</TabsTrigger>
        </TabsList>

        {/* Yem Stoku Sekmesi */}
        <TabsContent value="stok">
          <Card>
            <CardContent className="pt-4">
              {feedTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wheat className="mb-4 size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Henüz yem türü eklenmemiş.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    render={<Link href="/besleme/stok/new" />}
                  >
                    <Plus className="size-4" />
                    Yeni Yem Türü Ekle
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Yem Adı</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead className="text-right">Mevcut Stok</TableHead>
                      <TableHead className="text-right">Minimum Stok</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedTypes.map((ft) => {
                      const isLowStock =
                        Number(ft.currentStock) <= Number(ft.minimumStock)
                      return (
                        <TableRow
                          key={ft.id}
                          className={isLowStock ? "bg-red-50 dark:bg-red-950/20" : ""}
                        >
                          <TableCell className="font-medium">{ft.name}</TableCell>
                          <TableCell>
                            {FEED_UNIT_LABELS[ft.unit] || ft.unit}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              isLowStock ? "font-bold text-red-600 dark:text-red-400" : ""
                            }`}
                          >
                            {Number(ft.currentStock).toLocaleString("tr-TR")}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(ft.minimumStock).toLocaleString("tr-TR")}
                          </TableCell>
                          <TableCell className="text-right">
                            {ft.costPerUnit
                              ? Number(ft.costPerUnit).toLocaleString("tr-TR", {
                                  style: "currency",
                                  currency: "TRY",
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {isLowStock ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="mr-1 size-3" />
                                Düşük Stok
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Yeterli</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Satın Alma Sekmesi */}
        <TabsContent value="satin-alma">
          <Card>
            <CardContent className="pt-4">
              {purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart className="mb-4 size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Henüz satın alma kaydı yok.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    render={<Link href="/besleme/satin-alma/new" />}
                  >
                    <Plus className="size-4" />
                    Yeni Satın Alma
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Yem Türü</TableHead>
                      <TableHead className="text-right">Miktar</TableHead>
                      <TableHead className="text-right">Toplam Maliyet</TableHead>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead>Fatura No</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {new Date(p.date).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.feedType.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(p.quantity).toLocaleString("tr-TR")}{" "}
                          {FEED_UNIT_LABELS[p.feedType.unit] || p.feedType.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(p.totalCost).toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}
                        </TableCell>
                        <TableCell>{p.supplier || "-"}</TableCell>
                        <TableCell>{p.invoiceNumber || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Besleme Kayıtları Sekmesi */}
        <TabsContent value="kayitlar">
          <Card>
            <CardContent className="pt-4">
              {feedingRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="mb-4 size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Henüz yemleme kaydı yok.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    render={<Link href="/besleme/kayit/new" />}
                  >
                    <Plus className="size-4" />
                    Yeni Yemleme Kaydı
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Yem Türü</TableHead>
                      <TableHead className="text-right">Miktar</TableHead>
                      <TableHead>Hayvan / Grup</TableHead>
                      <TableHead>Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedingRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {new Date(r.date).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.feedType.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(r.quantity).toLocaleString("tr-TR")}{" "}
                          {FEED_UNIT_LABELS[r.feedType.unit] || r.feedType.unit}
                        </TableCell>
                        <TableCell>
                          {r.animal
                            ? r.animal.name || r.animal.earTagNumber
                            : r.group
                              ? r.group.name
                              : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {r.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
