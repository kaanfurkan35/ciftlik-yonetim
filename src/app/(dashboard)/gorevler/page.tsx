import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, ClipboardList } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "./kanban-board"

export default async function GorevlerPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const tasks = await prisma.task.findMany({
    where: {
      farmId: session.user.farmId,
      deletedAt: null,
      status: { in: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      assignedTo: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
    ],
  })

  const serialized = tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
  }))

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Görevler" description="Görevleri sürükle-bırak ile yönetin.">
        <Button render={<Link href="/gorevler/new" />}>
          <Plus className="size-4" />
          Yeni Görev
        </Button>
      </PageHeader>

      {serialized.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-6" />}
          title="Henüz görev eklenmemiş"
          description="Çiftliğiniz için görevler oluşturarak işlerinizi takip edebilirsiniz."
          action={
            <Button render={<Link href="/gorevler/new" />}>
              <Plus className="size-4" />
              Yeni Görev
            </Button>
          }
        />
      ) : (
        <KanbanBoard tasks={serialized} />
      )}
    </div>
  )
}
