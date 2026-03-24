import Link from "next/link"
import { Plus, Beef } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { AnimalListClient } from "@/components/animals/animal-list-client"

export default async function HayvanlarPage() {
  const animals = await prisma.animal.findMany({
    where: { deletedAt: null },
    include: {
      mother: { select: { id: true, name: true, earTagNumber: true } },
      father: { select: { id: true, name: true, earTagNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const serializedAnimals = animals.map((animal) => ({
    id: animal.id,
    earTagNumber: animal.earTagNumber,
    name: animal.name,
    breed: animal.breed,
    sex: animal.sex,
    status: animal.status,
    dateOfBirth: animal.dateOfBirth?.toISOString() ?? null,
    motherName: animal.mother?.name ?? animal.mother?.earTagNumber ?? null,
    fatherName: animal.father?.name ?? animal.father?.earTagNumber ?? null,
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
