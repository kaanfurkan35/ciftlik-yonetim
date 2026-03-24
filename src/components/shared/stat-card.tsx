"use client"

import { ReactNode } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease"
  icon: ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeType,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && changeType && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              changeType === "increase"
                ? "text-success"
                : "text-destructive"
            )}
          >
            {changeType === "increase" ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            )}
            <span>%{change} geçen aya göre</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
