"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Calendar, User, AlertTriangle, GripVertical } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants"
import { formatShortDate } from "@/lib/format"

interface TaskItem {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignedTo: { id: string; name: string }
}

const STATUS_COLUMNS = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const

const COLUMN_COLORS: Record<string, string> = {
  PENDING: "border-t-warning",
  IN_PROGRESS: "border-t-primary",
  COMPLETED: "border-t-success",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-primary/10 text-primary",
  HIGH: "bg-warning/10 text-warning",
  URGENT: "bg-destructive/10 text-destructive",
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "COMPLETED" || status === "CANCELLED") return false
  return new Date(dueDate) < new Date()
}

interface KanbanBoardProps {
  tasks: TaskItem[]
}

export function KanbanBoard({ tasks: initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)

  const tasksByStatus = STATUS_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status)
      return acc
    },
    {} as Record<string, TaskItem[]>
  )

  async function handleDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId
    const taskId = draggableId

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Görev "${TASK_STATUS_LABELS[newStatus]}" durumuna taşındı`)
    } catch {
      // Rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: source.droppableId } : t))
      )
      toast.error("Görev durumu güncellenemedi")
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {STATUS_COLUMNS.map((status) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {TASK_STATUS_LABELS[status]}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {tasksByStatus[status]?.length ?? 0}
              </Badge>
            </div>

            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[120px] space-y-3 rounded-lg border-t-2 p-2 transition-colors ${COLUMN_COLORS[status]} ${
                    snapshot.isDraggingOver ? "bg-muted/50" : ""
                  }`}
                >
                  {tasksByStatus[status]?.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Görev sürükleyerek buraya bırakın
                    </div>
                  ) : (
                    tasksByStatus[status]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${snapshot.isDragging ? "rotate-2 shadow-lg" : ""}`}
                          >
                            <Card size="sm" className="transition-shadow hover:shadow-md">
                              <CardHeader className="flex flex-row items-start gap-2 pb-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
                                >
                                  <GripVertical className="size-4" />
                                </div>
                                <CardTitle className="flex-1 text-sm leading-snug">
                                  {task.title}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 pl-10">
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
                                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
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
                                      <span>{formatShortDate(task.dueDate)}</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
