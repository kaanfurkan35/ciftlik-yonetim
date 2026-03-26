"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const CHART_COLORS = {
  green: "hsl(148, 50%, 35%)",
  gold: "hsl(40, 70%, 50%)",
}

interface MilkProductionChartProps {
  data: Array<{ month: string; label: string; total: number }>
}

function formatMonthLabel(monthKey: string): string {
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
  const [, m] = monthKey.split("-")
  return months[parseInt(m) - 1] || monthKey
}

export function MilkProductionChart({ data }: MilkProductionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Veri yok
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: d.label || formatMonthLabel(d.month),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="milkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickFormatter={(v) => `${v} Lt`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${Number(value).toLocaleString("tr-TR")} Lt`, "Üretim"]}
          labelFormatter={(label) => `Ay: ${label}`}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke={CHART_COLORS.green}
          strokeWidth={2}
          fill="url(#milkGradient)"
          name="Süt Üretimi"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
