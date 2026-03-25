"use client"

import { ReactNode } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease"
  icon: ReactNode
  className?: string
  borderColor?: string
}

export function StatCard({
  title,
  value,
  change,
  changeType,
  icon,
  className,
  borderColor = "border-l-primary",
}: StatCardProps) {
  return (
    <Card className={cn("border-l-[3px] shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer", borderColor, className)}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div
                className={cn(
                  "mt-1 flex items-center gap-1 text-xs font-medium",
                  change >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {change >= 0 ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                <span>{change >= 0 ? "+" : ""}{change}% geçen ay</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
