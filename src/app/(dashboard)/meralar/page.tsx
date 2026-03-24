import Link from "next/link"
import { Plus, TreePine, Droplets, MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PASTURE_CONDITION_LABELS } from "@/lib/constants"

const CONDITION_COLORS: Record<string, string> = {
  EXCELLENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  GOOD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  FAIR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  POOR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export default async function MeralarPage() {
  const session = await auth()
  if (!session?.user) return null

  const pastures = await prisma.pasture.findMany({
    where: {
      farmId: session.user.farmId,
      deletedAt: null,
    },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { grazingRecords: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Meralar" description="Çiftlik meralarını yönetin.">
        <Button render={<Link href="/meralar/new" />}>
          <Plus className="size-4" />
          Yeni Mera Ekle
        </Button>
      </PageHeader>

      {pastures.length === 0 ? (
        <EmptyState
          icon={<TreePine className="size-6" />}
          title="Henüz mera eklenmemiş"
          description="Çiftliğinize mera ekleyerek otlak alanlarınızı yönetebilirsiniz."
          action={
            <Button render={<Link href="/meralar/new" />}>
              <Plus className="size-4" />
              Yeni Mera Ekle
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pastures.map((pasture) => (
            <Card key={pasture.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    {pasture.name}
                  </CardTitle>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONDITION_COLORS[pasture.condition]}`}
                  >
                    {PASTURE_CONDITION_LABELS[pasture.condition]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Büyüklük</span>
                    <p className="font-medium">{Number(pasture.sizeDekar)} dönüm</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kapasite</span>
                    <p className="font-medium">{pasture.capacity} hayvan</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pasture.hasWaterSource ? (
                    <Badge variant="secondary" className="text-xs">
                      <Droplets className="mr-1 size-3 text-blue-500" />
                      Su Kaynağı Var
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Su Kaynağı Yok
                    </Badge>
                  )}
                </div>

                {pasture.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {pasture.notes}
                  </p>
                )}

                <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                  <span>Otlatma: {pasture._count.grazingRecords} kayıt</span>
                  <span>Ekleyen: {pasture.createdBy.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
