import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Beef,
  Heart,
  Droplets,
  Scale,
  GitBranch,
  Calendar,
  Tag,
  Palette,
  StickyNote,
  ShoppingCart,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_COLORS,
  ANIMAL_SEX_LABELS,
  HEALTH_RECORD_TYPE_LABELS,
  MILK_SESSION_LABELS,
} from "@/lib/constants"
import { Syringe, Pill } from "lucide-react"
import { formatShortDate, formatCurrency, formatAge } from "@/lib/format"

interface DetailItemProps {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && (
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value ?? "-"}</p>
      </div>
    </div>
  )
}

export default async function HayvanDetayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      mother: { select: { id: true, name: true, earTagNumber: true } },
      father: { select: { id: true, name: true, earTagNumber: true } },
      motherChildren: {
        where: { deletedAt: null },
        select: { id: true, name: true, earTagNumber: true, sex: true, dateOfBirth: true },
        orderBy: { dateOfBirth: "desc" },
      },
      fatherChildren: {
        where: { deletedAt: null },
        select: { id: true, name: true, earTagNumber: true, sex: true, dateOfBirth: true },
        orderBy: { dateOfBirth: "desc" },
      },
      healthRecords: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        take: 10,
      },
      vaccinationRecords: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        take: 10,
        include: {
          vaccinationType: { select: { name: true } },
        },
      },
      milkRecords: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        take: 10,
      },
      weightRecords: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  })

  if (!animal) {
    notFound()
  }

  const offspring = [
    ...animal.motherChildren,
    ...animal.fatherChildren,
  ].sort((a, b) => {
    if (!a.dateOfBirth || !b.dateOfBirth) return 0
    return b.dateOfBirth.getTime() - a.dateOfBirth.getTime()
  })

  const acquisitionTypeLabels: Record<string, string> = {
    BORN: "Doğum",
    PURCHASED: "Satın Alma",
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/hayvanlar" className="hover:text-foreground transition-colors">
          Hayvanlar
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {animal.name || animal.earTagNumber}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/hayvanlar" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-4">
            {/* Photo placeholder */}
            <div className="flex size-20 items-center justify-center rounded-xl bg-muted">
              <Beef className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {animal.name || animal.earTagNumber}
                </h1>
                <Badge className={ANIMAL_STATUS_COLORS[animal.status] ?? ""}>
                  {ANIMAL_STATUS_LABELS[animal.status] ?? animal.status}
                </Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">
                {animal.earTagNumber}
              </p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {animal.breed && <span>{animal.breed}</span>}
                <span>{ANIMAL_SEX_LABELS[animal.sex] ?? animal.sex}</span>
                {animal.dateOfBirth && (
                  <span>{formatAge(animal.dateOfBirth)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={<Link href={`/hayvanlar/${animal.id}/edit`} />}
          >
            <Pencil className="size-4" />
            Düzenle
          </Button>
          <Button variant="destructive">
            <Trash2 className="size-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="genel">
        <TabsList>
          <TabsTrigger value="genel">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="saglik">Sağlık Kayıtları</TabsTrigger>
          <TabsTrigger value="sut">Süt Kayıtları</TabsTrigger>
          <TabsTrigger value="agirlik">Ağırlık Geçmişi</TabsTrigger>
          <TabsTrigger value="soyagaci">Soy Ağacı</TabsTrigger>
        </TabsList>

        {/* Genel Bilgiler */}
        <TabsContent value="genel">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <DetailItem
                  icon={<Calendar className="size-4" />}
                  label="Doğum Tarihi"
                  value={animal.dateOfBirth ? formatShortDate(animal.dateOfBirth) : "-"}
                />
                <DetailItem
                  icon={<Tag className="size-4" />}
                  label="Irk"
                  value={animal.breed || "-"}
                />
                <DetailItem
                  icon={<Palette className="size-4" />}
                  label="Renk"
                  value={animal.color || "-"}
                />
                <DetailItem
                  icon={<Beef className="size-4" />}
                  label="Cinsiyet"
                  value={ANIMAL_SEX_LABELS[animal.sex] ?? animal.sex}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Edinme Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <DetailItem
                  icon={<ShoppingCart className="size-4" />}
                  label="Edinme Türü"
                  value={
                    animal.acquisitionType
                      ? acquisitionTypeLabels[animal.acquisitionType] ?? animal.acquisitionType
                      : "-"
                  }
                />
                <DetailItem
                  icon={<Calendar className="size-4" />}
                  label="Edinme Tarihi"
                  value={animal.acquisitionDate ? formatShortDate(animal.acquisitionDate) : "-"}
                />
                <DetailItem
                  icon={<Tag className="size-4" />}
                  label="Edinme Fiyatı"
                  value={animal.acquisitionPrice != null ? formatCurrency(Number(animal.acquisitionPrice)) : "-"}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ebeveyn Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <DetailItem
                  label="Anne"
                  value={
                    animal.mother ? (
                      <Link
                        href={`/hayvanlar/${animal.mother.id}`}
                        className="text-primary hover:underline"
                      >
                        {animal.mother.name || animal.mother.earTagNumber}
                      </Link>
                    ) : (
                      "-"
                    )
                  }
                />
                <DetailItem
                  label="Baba"
                  value={
                    animal.father ? (
                      <Link
                        href={`/hayvanlar/${animal.father.id}`}
                        className="text-primary hover:underline"
                      >
                        {animal.father.name || animal.father.earTagNumber}
                      </Link>
                    ) : (
                      "-"
                    )
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notlar</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailItem
                  icon={<StickyNote className="size-4" />}
                  label="Notlar"
                  value={animal.notes || "Not eklenmemiş."}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sağlık Kayıtları */}
        <TabsContent value="saglik">
          <div className="space-y-4">
            {/* Muayene / Tedavi Kayıtları */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="size-4" />
                  Muayene &amp; Tedavi Kayıtları
                </CardTitle>
              </CardHeader>
              <CardContent>
                {animal.healthRecords.length === 0 ? (
                  <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
                    Henüz sağlık kaydı bulunmuyor.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 pr-4 font-medium">Tarih</th>
                          <th className="pb-2 pr-4 font-medium">Tür</th>
                          <th className="pb-2 pr-4 font-medium">Teşhis</th>
                          <th className="pb-2 pr-4 font-medium">Tedavi</th>
                          <th className="pb-2 pr-4 font-medium">İlaç</th>
                          <th className="pb-2 pr-4 font-medium">Doz</th>
                          <th className="pb-2 pr-4 font-medium">Veteriner</th>
                          <th className="pb-2 font-medium">Maliyet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {animal.healthRecords.map((record) => (
                          <tr key={record.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 whitespace-nowrap">{formatShortDate(record.date)}</td>
                            <td className="py-2 pr-4">
                              <Badge variant="outline" className="font-normal">
                                {HEALTH_RECORD_TYPE_LABELS[record.type] ?? record.type}
                              </Badge>
                            </td>
                            <td className="py-2 pr-4">{record.diagnosis || "-"}</td>
                            <td className="py-2 pr-4">{record.treatment || "-"}</td>
                            <td className="py-2 pr-4">
                              {record.medication ? (
                                <span className="flex items-center gap-1">
                                  <Pill className="size-3 text-muted-foreground" />
                                  {record.medication}
                                </span>
                              ) : "-"}
                            </td>
                            <td className="py-2 pr-4">{record.dosage || "-"}</td>
                            <td className="py-2 pr-4">{record.vetName || "-"}</td>
                            <td className="py-2 whitespace-nowrap">
                              {record.cost != null ? formatCurrency(Number(record.cost)) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aşı Kayıtları */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="size-4" />
                  Aşı Kayıtları
                </CardTitle>
              </CardHeader>
              <CardContent>
                {animal.vaccinationRecords.length === 0 ? (
                  <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
                    Henüz aşı kaydı bulunmuyor.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 pr-4 font-medium">Tarih</th>
                          <th className="pb-2 pr-4 font-medium">Aşı Türü</th>
                          <th className="pb-2 pr-4 font-medium">Parti No</th>
                          <th className="pb-2 pr-4 font-medium">Sonraki Tarih</th>
                          <th className="pb-2 pr-4 font-medium">Durum</th>
                          <th className="pb-2 font-medium">Maliyet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {animal.vaccinationRecords.map((record) => {
                          const isOverdue = record.nextDueDate && new Date(record.nextDueDate) < new Date()
                          return (
                            <tr key={record.id} className="border-b last:border-0">
                              <td className="py-2 pr-4 whitespace-nowrap">{formatShortDate(record.date)}</td>
                              <td className="py-2 pr-4 font-medium">{record.vaccinationType.name}</td>
                              <td className="py-2 pr-4 font-mono text-xs">{record.batchNumber || "-"}</td>
                              <td className="py-2 pr-4 whitespace-nowrap">
                                {record.nextDueDate ? formatShortDate(record.nextDueDate) : "-"}
                              </td>
                              <td className="py-2 pr-4">
                                {record.nextDueDate ? (
                                  isOverdue ? (
                                    <Badge variant="destructive" className="text-xs">Gecikmiş</Badge>
                                  ) : (
                                    <Badge className="bg-success/10 text-success text-xs">Güncel</Badge>
                                  )
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="py-2 whitespace-nowrap">
                                {record.cost != null ? formatCurrency(Number(record.cost)) : "-"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Süt Kayıtları */}
        <TabsContent value="sut">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="size-4" />
                Süt Kayıtları
              </CardTitle>
            </CardHeader>
            <CardContent>
              {animal.milkRecords.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                  Henüz süt kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium">Tarih</th>
                        <th className="pb-2 pr-4 font-medium">Oturum</th>
                        <th className="pb-2 pr-4 font-medium">Miktar (lt)</th>
                        <th className="pb-2 pr-4 font-medium">Yağ %</th>
                        <th className="pb-2 font-medium">Protein %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animal.milkRecords.map((record) => (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{formatShortDate(record.date)}</td>
                          <td className="py-2 pr-4">
                            {MILK_SESSION_LABELS[record.session] ?? record.session}
                          </td>
                          <td className="py-2 pr-4">{String(record.quantity)}</td>
                          <td className="py-2 pr-4">
                            {record.fatPercentage != null
                              ? `%${record.fatPercentage}`
                              : "-"}
                          </td>
                          <td className="py-2">
                            {record.proteinPercentage != null
                              ? `%${record.proteinPercentage}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ağırlık Geçmişi */}
        <TabsContent value="agirlik">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="size-4" />
                Ağırlık Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {animal.weightRecords.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                  Henüz ağırlık kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium">Tarih</th>
                        <th className="pb-2 pr-4 font-medium">Ağırlık (kg)</th>
                        <th className="pb-2 font-medium">Notlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animal.weightRecords.map((record) => (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{formatShortDate(record.date)}</td>
                          <td className="py-2 pr-4">{String(record.weight)}</td>
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

        {/* Soy Ağacı */}
        <TabsContent value="soyagaci">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="size-4" />
                  Ebeveynler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Anne</p>
                  {animal.mother ? (
                    <Link
                      href={`/hayvanlar/${animal.mother.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {animal.mother.name || animal.mother.earTagNumber}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">Bilinmiyor</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Baba</p>
                  {animal.father ? (
                    <Link
                      href={`/hayvanlar/${animal.father.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {animal.father.name || animal.father.earTagNumber}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">Bilinmiyor</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Yavrular ({offspring.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {offspring.length === 0 ? (
                  <div className="flex min-h-[100px] items-center justify-center text-sm text-muted-foreground">
                    Yavru kaydı bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {offspring.map((child) => (
                      <Link
                        key={child.id}
                        href={`/hayvanlar/${child.id}`}
                        className="flex items-center justify-between rounded-lg border p-2 transition-colors hover:bg-muted"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {child.name || child.earTagNumber}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {child.earTagNumber}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{ANIMAL_SEX_LABELS[child.sex] ?? child.sex}</p>
                          {child.dateOfBirth && (
                            <p>{child.dateOfBirth ? formatShortDate(child.dateOfBirth) : "-"}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
