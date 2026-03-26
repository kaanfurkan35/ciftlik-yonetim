"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const CHART_COLOR_GREEN = "hsl(148, 50%, 35%)"

interface BreedDistributionChartProps {
  data: Record<string, number>
}

export function BreedDistributionChart({ data }: BreedDistributionChartProps) {
  const entries = Object.entries(data).filter(([, value]) => value > 0)

  if (entries.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Veri yok
      </div>
    )
  }

  const chartData = entries
    .sort((a, b) => b[1] - a[1])
    .map(([breed, count]) => ({
      breed,
      count,
    }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40 + 40)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="breed"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          width={100}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [
            `${Number(value).toLocaleString("tr-TR")} hayvan`,
            "Adet",
          ]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 13,
          }}
        />
        <Bar
          dataKey="count"
          fill={CHART_COLOR_GREEN}
          radius={[0, 4, 4, 0]}
          name="Adet"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
