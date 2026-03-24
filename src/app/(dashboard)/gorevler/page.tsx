import Link from "next/link"
import { Plus, ClipboardList, Calendar, User, AlertTriangle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants"

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const STATUS_COLUMNS = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const

function formatDate(date: Date | null): string {
  if (!date) return ""
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(date)
}

function isOverdue(dueDate: Date | null, status: string): boolean {
  if (!dueDate || status === "COMPLETED" || status === "CANCELLED") return false
  return new Date(dueDate) < new Date()
}

export default async function GorevlerPage() {
  const session = await auth()
  if (!session?.user) return null

  const tasks = await prisma.task.findMany({
    where: {
      farmId: session.user.farmId,
      deletedAt: null,
      status: { in: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  })

  const tasksByStatus = STATUS_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status)
      return acc
    },
    {} as Record<string, typeof tasks>
  )

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Görevler" description="Çiftlik görevlerini yönetin ve takip edin.">
        <Button render={<Link href="/gorevler/new" />}>
          <Plus className="size-4" />
          Yeni Görev
        </Button>
      </PageHeader>

      {tasks.length === 0 ? (
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {STATUS_COLUMNS.map((status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {TASK_STATUS_LABELS[status]}
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {tasksByStatus[status]?.length ?? 0}
                </Badge>
              </div>

              <div className="space-y-3">
                {tasksByStatus[status]?.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Bu durumda görev yok
                  </div>
                ) : (
                  tasksByStatus[status]?.map((task) => (
                    <Card key={task.id} size="sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm leading-snug">
                          {task.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}
                          >
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </span>

                          {isOverdue(task.dueDate, task.status) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                              <AlertTriangle className="size-3" />
                              Gecikmiş
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="size-3" />
                            <span>{task.assignedTo.name}</span>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
