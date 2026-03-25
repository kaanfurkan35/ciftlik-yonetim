import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Beef } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { AnimalListClient } from "@/components/animals/animal-list-client"

export default async function HayvanlarPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const animals = await prisma.animal.findMany({
    where: { farmId: session.user.farmId, deletedAt: null },
    select: {
      id: true,
      earTagNumber: true,
      name: true,
      breed: true,
      sex: true,
      status: true,
      dateOfBirth: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const serializedAnimals = animals.map((a) => ({
    ...a,
    dateOfBirth: a.dateOfBirth?.toISOString() ?? null,
  }))

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Hayvanlar" description="Çiftlikteki tüm hayvanları yönetin.">
        <Button render={<Link href="/hayvanlar/new" />}>
          <Plus className="size-4" />
          Yeni Hayvan Ekle
        </Button>
      </PageHeader>

      {serializedAnimals.length === 0 ? (
        <EmptyState
          icon={<Beef className="size-6" />}
          title="Henüz hayvan eklenmemiş"
          description="Çiftliğinize hayvan ekleyerek başlayabilirsiniz."
          action={
            <Button render={<Link href="/hayvanlar/new" />}>
              <Plus className="size-4" />
              Yeni Hayvan Ekle
            </Button>
          }
        />
      ) : (
        <AnimalListClient animals={serializedAnimals} />
      )}
    </div>
  )
}
