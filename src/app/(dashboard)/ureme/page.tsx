import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Heart, Syringe, Baby, Stethoscope, CalendarClock } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  HEAT_INTENSITY_LABELS,
  INSEMINATION_TYPE_LABELS,
  PREGNANCY_RESULT_LABELS,
  GESTATION_DAYS,
} from "@/lib/constants"
import { formatShortDate, formatCurrency } from "@/lib/format"

const HEAT_INTENSITY_COLORS: Record<string, string> = {
  WEAK: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  MODERATE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  STRONG: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const PREGNANCY_RESULT_COLORS: Record<string, string> = {
  POSITIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  NEGATIVE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  INCONCLUSIVE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

export default async function UremePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // İstatistikleri ve kayıtları paralel olarak getir
  const [
    pregnantAnimals,
    upcomingCalvingChecks,
    inseminationsThisMonthList,
    heatRecords,
    inseminationRecords,
    pregnancyChecks,
    calvingRecords,
  ] = await Promise.all([
    // Gebe hayvanlar (detaylı)
    prisma.animal.findMany({
      where: { farmId: session.user.farmId, status: "PREGNANT", deletedAt: null },
      select: { id: true, name: true, earTagNumber: true },
      orderBy: { name: "asc" },
      take: 10,
    }),
    // Yaklaşan doğumlar (30 gün içinde, detaylı)
    prisma.pregnancyCheck.findMany({
      where: {
        deletedAt: null,
        animal: { farmId: session.user.farmId },
        result: "POSITIVE",
        expectedCalvingDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      select: {
        id: true,
        expectedCalvingDate: true,
        animal: { select: { id: true, name: true, earTagNumber: true } },
      },
      orderBy: { expectedCalvingDate: "asc" },
      take: 10,
    }),
    // Bu ay tohumlama (detaylı)
    prisma.inseminationRecord.findMany({
      where: {
        deletedAt: null,
        animal: { farmId: session.user.farmId },
        date: { gte: startOfMonth },
      },
      select: {
        id: true,
        date: true,
        type: true,
        animal: { select: { id: true, name: true, earTagNumber: true } },
      },
      orderBy: { date: "desc" },
      take: 10,
    }),
    // Son kızgınlık kayıtları
    prisma.heatRecord.findMany({
      where: { deletedAt: null, animal: { farmId: session.user.farmId } },
      orderBy: { date: "desc" },
      take: 20,
      include: {
        animal: { select: { id: true, name: true, earTagNumber: true } },
        observedBy: { select: { id: true, name: true } },
      },
    }),
    // Son tohumlama kayıtları
    prisma.inseminationRecord.findMany({
      where: { deletedAt: null, animal: { farmId: session.user.farmId } },
      orderBy: { date: "desc" },
      take: 20,
      include: {
        animal: { select: { id: true, name: true, earTagNumber: true } },
        bull: { select: { id: true, name: true, earTagNumber: true } },
      },
    }),
    // Son gebelik kontrolleri
    prisma.pregnancyCheck.findMany({
      where: { deletedAt: null, animal: { farmId: session.user.farmId } },
      orderBy: { checkDate: "desc" },
      take: 20,
      include: {
        animal: { select: { id: true, name: true, earTagNumber: true } },
        checkedBy: { select: { id: true, name: true } },
      },
    }),
    // Son doğum kayıtları
    prisma.calvingRecord.findMany({
      where: { deletedAt: null, animal: { farmId: session.user.farmId } },
      orderBy: { date: "desc" },
      take: 20,
      include: {
        animal: { select: { id: true, name: true, earTagNumber: true } },
        calf: { select: { id: true, name: true, earTagNumber: true, sex: true } },
        assistedBy: { select: { id: true, name: true } },
      },
    }),
  ])

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Üreme Yönetimi"
        description="Kızgınlık, tohumlama, gebelik ve doğum kayıtlarını yönetin."
      >
        <Button render={<Link href="/ureme/tohumlama/new" />}>
          <Plus className="size-4" />
          Yeni Tohumlama
        </Button>
      </PageHeader>

      {/* Özet İstatistikler — tıklanabilir, hayvan detayları ile */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-[3px] border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Heart className="size-4" />
              Gebe Sayısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pregnantAnimals.length}</div>
            {pregnantAnimals.length > 0 && (
              <div className="mt-3 space-y-1 border-t pt-3">
                {pregnantAnimals.map((a) => (
                  <Link
                    key={a.id}
                    href={`/hayvanlar/${a.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="font-medium">{a.name || a.earTagNumber}</span>
                    <span className="text-xs text-muted-foreground font-mono">{a.earTagNumber}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-[3px] border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarClock className="size-4" />
              Yaklaşan Doğumlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCalvingChecks.length}</div>
            {upcomingCalvingChecks.length > 0 && (
              <div className="mt-3 space-y-1 border-t pt-3">
                {upcomingCalvingChecks.map((c) => (
                  <Link
                    key={c.id}
                    href={`/hayvanlar/${c.animal.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-accent" />
                      <span className="font-medium">{c.animal.name || c.animal.earTagNumber}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {c.expectedCalvingDate ? formatShortDate(c.expectedCalvingDate) : ""}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-[3px] border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Syringe className="size-4" />
              Bu Ay Tohumlama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inseminationsThisMonthList.length}</div>
            {inseminationsThisMonthList.length > 0 && (
              <div className="mt-3 space-y-1 border-t pt-3">
                {inseminationsThisMonthList.map((ins) => (
                  <Link
                    key={ins.id}
                    href={`/hayvanlar/${ins.animal.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-success" />
                      <span className="font-medium">{ins.animal.name || ins.animal.earTagNumber}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatShortDate(ins.date)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sekmeli İçerik */}
      <Tabs defaultValue="kizginlik">
        <TabsList>
          <TabsTrigger value="kizginlik">Kızgınlık</TabsTrigger>
          <TabsTrigger value="tohumlama">Tohumlama</TabsTrigger>
          <TabsTrigger value="gebelik">Gebelik</TabsTrigger>
          <TabsTrigger value="dogum">Doğum</TabsTrigger>
        </TabsList>

        {/* Kızgınlık Kayıtları */}
        <TabsContent value="kizginlik">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="size-4" />
                Kızgınlık Kayıtları
              </CardTitle>
            </CardHeader>
            <CardContent>
              {heatRecords.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                  Henüz kızgınlık kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium">Hayvan</th>
                        <th className="pb-2 pr-4 font-medium">Tarih</th>
                        <th className="pb-2 pr-4 font-medium">Şiddet</th>
                        <th className="pb-2 pr-4 font-medium">Gözlemleyen</th>
                        <th className="pb-2 font-medium">Notlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatRecords.map((record) => (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            <Link
                              href={`/hayvanlar/${record.animal.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {record.animal.name || record.animal.earTagNumber}
                            </Link>
                          </td>
                          <td className="py-2 pr-4">{formatShortDate(record.date)}</td>
                          <td className="py-2 pr-4">
                            <Badge className={HEAT_INTENSITY_COLORS[record.intensity] ?? ""}>
                              {HEAT_INTENSITY_LABELS[record.intensity] ?? record.intensity}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4">{record.observedBy?.name ?? "-"}</td>
                          <td className="py-2">{record.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tohumlama Kayıtları */}
        <TabsContent value="tohumlama">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Syringe className="size-4" />
                Tohumlama Kayıtları
              </CardTitle>
              <Button variant="outline" size="sm" render={<Link href="/ureme/tohumlama/new" />}>
                <Plus className="size-4" />
                Yeni Tohumlama
              </Button>
            </CardHeader>
            <CardContent>
              {inseminationRecords.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                  Henüz tohumlama kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium">Hayvan</th>
                        <th className="pb-2 pr-4 font-medium">Tarih</th>
                        <th className="pb-2 pr-4 font-medium">Tür</th>
                        <th className="pb-2 pr-4 font-medium">Boğa/Semen</th>
                        <th className="pb-2 pr-4 font-medium">Teknisyen</th>
                        <th className="pb-2 font-medium">Maliyet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inseminationRecords.map((record) => (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            <Link
                              href={`/hayvanlar/${record.animal.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {record.animal.name || record.animal.earTagNumber}
                            </Link>
                          </td>
                          <td className="py-2 pr-4">{formatShortDate(record.date)}</td>
                          <td className="py-2 pr-4">
                            {INSEMINATION_TYPE_LABELS[record.type] ?? record.type}
                          </td>
                          <td className="py-2 pr-4">
                            {record.bull
                              ? record.bull.name || record.bull.earTagNumber
                              : record.semenBatchNumber || "-"}
                          </td>
                          <td className="py-2 pr-4">{record.technicianName || "-"}</td>
                          <td className="py-2">{record.cost != null ? formatCurrency(Number(record.cost)) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gebelik Kontrolleri */}
        <TabsContent value="gebelik">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="size-4" />
                Gebelik Kontrolleri
              </CardTitle>
              <Button variant="outline" size="sm" render={<Link href="/ureme/gebelik/new" />}>
                <Plus className="size-4" />
                Yeni Gebelik Kontrolü
              </Button>
            </CardHeader>
            <CardContent>
              {pregnancyChecks.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                  Henüz gebelik kontrolü bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium">Hayvan</th>
                        <th className="pb-2 pr-4 font-medium">Kontrol Tarihi</th>
                        <th className="pb-2 pr-4 font-medium">Sonuç</th>
                        <th className="pb-2 pr-4 font-medium">Yöntem</th>
                        <th className="pb-2 pr-4 font-medium">Beklenen Doğum</th>
                        <th className="pb-2 font-medium">Kontrol Eden</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pregnancyChecks.map((record) => (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            <Link
                              href={`/hayvanlar/${record.animal.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {record.animal.name || record.animal.earTagNumber}
                            </Link>
                          </td>
                          <td className="py-2 pr-4">{formatShortDate(record.checkDate)}</td>
                          <td className="py-2 pr-4">
                            <Badge className={PREGNANCY_RESULT_COLORS[record.result] ?? ""}>
                              {PREGNANCY_RESULT_LABELS[record.result] ?? record.result}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4">{record.method || "-"}</td>
                          <td className="py-2 pr-4">{record.expectedCalvingDate ? formatShortDate(record.expectedCalvingDate) : "-"}</td>
                          <td className="py-2">{record.checkedBy?.name ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Doğum Kayıtları */}
        <TabsContent value="dogum">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Baby className="size-4" />
                Doğum Kayıtları
              </CardTitle>
              <Button variant="outline" size="sm" render={<Link href="/ureme/dogum/new" />}>
                <Plus className="size-4" />
                Yeni Doğum Kaydı
              </Button>
            </CardHeader>
            <CardContent>
              {calvingRecords.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                  Henüz doğum kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium">Anne</th>
                        <th className="pb-2 pr-4 font-medium">Tarih</th>
                        <th className="pb-2 pr-4 font-medium">Buzağı</th>
                        <th className="pb-2 pr-4 font-medium">Güçlü Doğum Skoru</th>
                        <th className="pb-2 pr-4 font-medium">Komplikasyonlar</th>
                        <th className="pb-2 font-medium">Yardim Eden</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calvingRecords.map((record) => (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            <Link
                              href={`/hayvanlar/${record.animal.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {record.animal.name || record.animal.earTagNumber}
                            </Link>
                          </td>
                          <td className="py-2 pr-4">{formatShortDate(record.date)}</td>
                          <td className="py-2 pr-4">
                            {record.calf ? (
                              <Link
                                href={`/hayvanlar/${record.calf.id}`}
                                className="text-primary hover:underline"
                              >
                                {record.calf.name || record.calf.earTagNumber}
                              </Link>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            {record.dystociaScore != null ? `${record.dystociaScore}/5` : "-"}
                          </td>
                          <td className="py-2 pr-4">{record.complications || "-"}</td>
                          <td className="py-2">{record.assistedBy?.name ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
