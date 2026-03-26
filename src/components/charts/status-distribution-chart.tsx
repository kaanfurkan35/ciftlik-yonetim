"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ANIMAL_STATUS_LABELS } from "@/lib/constants"

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "hsl(148, 50%, 35%)",
  LACTATING: "hsl(148, 50%, 45%)",
  PREGNANT: "hsl(40, 70%, 50%)",
  DRY: "hsl(195, 45%, 45%)",
  CALF: "hsl(270, 40%, 50%)",
  SOLD: "hsl(220, 10%, 55%)",
  DECEASED: "hsl(10, 70%, 50%)",
}

const FALLBACK_COLOR = "hsl(220, 10%, 55%)"

interface StatusDistributionChartProps {
  data: Record<string, number>
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const entries = Object.entries(data).filter(([, value]) => value > 0)

  if (entries.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Veri yok
      </div>
    )
  }

  const chartData = entries.map(([status, value]) => ({
    name: ANIMAL_STATUS_LABELS[status] || status,
    value,
    status,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry) => (
            <Cell
              key={`cell-${entry.status}`}
              fill={STATUS_COLORS[entry.status] || FALLBACK_COLOR}
            />
          ))}
        </Pie>
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            `${Number(value).toLocaleString("tr-TR")} hayvan`,
            String(name),
          ]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
