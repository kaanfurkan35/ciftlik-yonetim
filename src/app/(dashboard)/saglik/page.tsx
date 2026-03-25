import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Heart, Syringe, AlertTriangle } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HEALTH_RECORD_TYPE_LABELS } from "@/lib/constants"
import { formatShortDate, formatCurrency } from "@/lib/format"

function isOverdue(nextDueDate: Date | null | undefined): boolean {
  if (!nextDueDate) return false
  return new Date(nextDueDate) < new Date()
}

export default async function SaglikPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [healthRecords, vaccinationRecords] = await Promise.all([
    prisma.healthRecord.findMany({
      where: { deletedAt: null, animal: { farmId: session.user.farmId } },
      include: {
        animal: { select: { id: true, name: true, earTagNumber: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.vaccinationRecord.findMany({
      where: { deletedAt: null, animal: { farmId: session.user.farmId } },
      include: {
        animal: { select: { id: true, name: true, earTagNumber: true } },
        vaccinationType: { select: { id: true, name: true, intervalDays: true } },
      },
      orderBy: { date: "desc" },
    }),
  ])

  const serializedHealthRecords = healthRecords.map((record) => ({
    id: record.id,
    animalName: record.animal.name || record.animal.earTagNumber,
    animalId: record.animal.id,
    type: record.type,
    date: record.date.toISOString(),
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    medication: record.medication,
    vetName: record.vetName,
    cost: record.cost ? Number(record.cost) : null,
  }))

  const serializedVaccinationRecords = vaccinationRecords.map((record) => ({
    id: record.id,
    animalName: record.animal.name || record.animal.earTagNumber,
    animalId: record.animal.id,
    vaccinationTypeName: record.vaccinationType.name,
    date: record.date.toISOString(),
    nextDueDate: record.nextDueDate?.toISOString() ?? null,
    batchNumber: record.batchNumber,
    cost: record.cost ? Number(record.cost) : null,
    isOverdue: isOverdue(record.nextDueDate),
  }))

  const overdueCount = serializedVaccinationRecords.filter((r) => r.isOverdue).length

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Sağlık Yönetimi"
        description="Hayvanlarınızın sağlık ve aşı kayıtlarını yönetin."
      >
        <Button render={<Link href="/saglik/asi/new" />}>
          <Syringe className="size-4" />
          Yeni Aşı Kaydı
        </Button>
        <Button render={<Link href="/saglik/muayene/new" />}>
          <Plus className="size-4" />
          Yeni Kayıt Ekle
        </Button>
      </PageHeader>

      {overdueCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            <strong>{overdueCount}</strong> adet gecikmiş aşı kaydı bulunmaktadır.
          </span>
        </div>
      )}

      <Tabs defaultValue="saglik">
        <TabsList>
          <TabsTrigger value="saglik">Sağlık Kayıtları</TabsTrigger>
          <TabsTrigger value="asi">
            Aşı Kayıtları
            {overdueCount > 0 && (
              <Badge className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                {overdueCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Sağlık Kayıtları */}
        <TabsContent value="saglik">
          {serializedHealthRecords.length === 0 ? (
            <EmptyState
              icon={<Heart className="size-6" />}
              title="Henüz sağlık kaydı eklenmemiş"
              description="Hayvanlarınız için sağlık kaydı ekleyerek başlayabilirsiniz."
              action={
                <Button render={<Link href="/saglik/muayene/new" />}>
                  <Plus className="size-4" />
                  Yeni Kayıt Ekle
                </Button>
              }
            />
          ) : (
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-4 font-medium">Hayvan</th>
                      <th className="p-4 font-medium">Tür</th>
                      <th className="p-4 font-medium">Tarih</th>
                      <th className="p-4 font-medium">Teşhis</th>
                      <th className="p-4 font-medium">Tedavi</th>
                      <th className="p-4 font-medium">İlaç</th>
                      <th className="p-4 font-medium">Veteriner</th>
                      <th className="p-4 font-medium">Maliyet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serializedHealthRecords.map((record) => (
                      <tr key={record.id} className="border-b last:border-0">
                        <td className="p-4">
                          <Link
                            href={`/hayvanlar/${record.animalId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {record.animalName}
                          </Link>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">
                            {HEALTH_RECORD_TYPE_LABELS[record.type] ?? record.type}
                          </Badge>
                        </td>
                        <td className="p-4">{formatShortDate(record.date)}</td>
                        <td className="p-4">{record.diagnosis || "-"}</td>
                        <td className="p-4">{record.treatment || "-"}</td>
                        <td className="p-4">{record.medication || "-"}</td>
                        <td className="p-4">{record.vetName || "-"}</td>
                        <td className="p-4">{record.cost != null ? formatCurrency(record.cost) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Aşı Kayıtları */}
        <TabsContent value="asi">
          {serializedVaccinationRecords.length === 0 ? (
            <EmptyState
              icon={<Syringe className="size-6" />}
              title="Henüz aşı kaydı eklenmemiş"
              description="Hayvanlarınız için aşı kaydı ekleyerek başlayabilirsiniz."
              action={
                <Button render={<Link href="/saglik/asi/new" />}>
                  <Syringe className="size-4" />
                  Yeni Aşı Kaydı
                </Button>
              }
            />
          ) : (
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-4 font-medium">Hayvan</th>
                      <th className="p-4 font-medium">Aşı Türü</th>
                      <th className="p-4 font-medium">Tarih</th>
                      <th className="p-4 font-medium">Sonraki Tarih</th>
                      <th className="p-4 font-medium">Parti No</th>
                      <th className="p-4 font-medium">Maliyet</th>
                      <th className="p-4 font-medium">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serializedVaccinationRecords.map((record) => (
                      <tr
                        key={record.id}
                        className={`border-b last:border-0 ${
                          record.isOverdue
                            ? "bg-orange-50 dark:bg-orange-950/30"
                            : ""
                        }`}
                      >
                        <td className="p-4">
                          <Link
                            href={`/hayvanlar/${record.animalId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {record.animalName}
                          </Link>
                        </td>
                        <td className="p-4">{record.vaccinationTypeName}</td>
                        <td className="p-4">{formatShortDate(record.date)}</td>
                        <td className="p-4">
                          {record.nextDueDate
                            ? formatShortDate(record.nextDueDate)
                            : "-"}
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {record.batchNumber || "-"}
                        </td>
                        <td className="p-4">{record.cost != null ? formatCurrency(record.cost) : "-"}</td>
                        <td className="p-4">
                          {record.isOverdue ? (
                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              <AlertTriangle className="mr-1 size-3" />
                              Gecikmiş
                            </Badge>
                          ) : record.nextDueDate ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Güncel
                            </Badge>
                          ) : (
                            <Badge variant="outline">-</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
