"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const CHART_COLORS = {
  green: "hsl(148, 50%, 35%)",
  red: "hsl(10, 70%, 50%)",
  gold: "hsl(40, 70%, 50%)",
}

interface MonthlyTrendChartProps {
  data: Array<{ month: string; income: number; expense: number; profit: number }>
}

function formatMonthLabel(monthKey: string): string {
  const months = ["Oca", "\u015eub", "Mar", "Nis", "May", "Haz", "Tem", "A\u011fu", "Eyl", "Eki", "Kas", "Ara"]
  const [, m] = monthKey.split("-")
  return months[parseInt(m) - 1] || monthKey
}

function formatCurrency(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 })
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Veri yok
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.month),
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickFormatter={(v) => formatCurrency(v)}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => {
            const labels: Record<string, string> = {
              income: "Gelir",
              expense: "Gider",
              profit: "Kar/Zarar",
            }
            return [formatCurrency(Number(value)), labels[String(name)] || String(name)]
          }}
          labelFormatter={(label) => `Ay: ${label}`}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 13,
          }}
        />
        <Legend
          formatter={(value) => {
            const labels: Record<string, string> = {
              income: "Gelir",
              expense: "Gider",
              profit: "Kar/Zarar",
            }
            return labels[value] || value
          }}
        />
        <Line
          type="monotone"
          dataKey="income"
          stroke={CHART_COLORS.green}
          strokeWidth={2}
          dot={{ r: 4 }}
          name="income"
        />
        <Line
          type="monotone"
          dataKey="expense"
          stroke={CHART_COLORS.red}
          strokeWidth={2}
          dot={{ r: 4 }}
          name="expense"
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke={CHART_COLORS.gold}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 4 }}
          name="profit"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
