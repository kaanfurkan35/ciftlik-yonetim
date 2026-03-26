"use client"

import {
  BarChart,
  Bar,
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
}

interface IncomeExpenseChartProps {
  data: Array<{ month: string; income: number; expense: number; profit: number }>
}

function formatMonthLabel(monthKey: string): string {
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
  const [, m] = monthKey.split("-")
  return months[parseInt(m) - 1] || monthKey
}

function formatCurrency(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 })
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          formatter={(value: any, name: any) => [
            formatCurrency(Number(value)),
            String(name) === "income" ? "Gelir" : "Gider",
          ]}
          labelFormatter={(label) => `Ay: ${label}`}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 13,
          }}
        />
        <Legend
          formatter={(value) => (value === "income" ? "Gelir" : "Gider")}
        />
        <Bar dataKey="income" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} name="income" />
        <Bar dataKey="expense" fill={CHART_COLORS.red} radius={[4, 4, 0, 0]} name="expense" />
      </BarChart>
    </ResponsiveContainer>
  )
}
