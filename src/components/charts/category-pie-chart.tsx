"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const CHART_COLORS_ARRAY = [
  "hsl(148, 50%, 35%)",  // green
  "hsl(40, 70%, 50%)",   // gold
  "hsl(195, 45%, 45%)",  // teal
  "hsl(10, 70%, 50%)",   // red
  "hsl(270, 40%, 50%)",  // purple
]

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCustomLabel(props: any) {
  const cx = props.cx as number
  const cy = props.cy as number
  const midAngle = (props.midAngle as number) ?? 0
  const innerRadius = props.innerRadius as number
  const outerRadius = props.outerRadius as number
  const percent = (props.percent as number) ?? 0

  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      className="fill-foreground"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function CategoryPieChart({ data, title }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Veri yok
      </div>
    )
  }

  return (
    <div>
      {title && (
        <p className="mb-2 text-center text-sm font-medium text-muted-foreground">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={renderCustomLabel}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS_ARRAY[index % CHART_COLORS_ARRAY.length]}
              />
            ))}
          </Pie>
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
              Number(value).toLocaleString("tr-TR"),
              String(name),
            ]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 13,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
