'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { MonthlyDataPoint } from '@/lib/data/types'

const CHART_COLORS = [
  '#4c2a9d', // purple
  '#1fb8ab', // teal
  '#b81f3d', // crimson
  '#b87814', // gold
  '#82b814', // chartreuse
  '#191e3f', // navy
  '#036a49', // dark green
  '#05d350', // bright green
]

function formatMonthTick(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })
}

function pivotData(data: MonthlyDataPoint[], labelMap: Record<string, string>) {
  const groups = [...new Set(data.map((d) => d.group))].sort()
  const labels = groups.map((g) => labelMap[g] ?? g)
  const byDate = new Map<string, Record<string, number | string>>()
  for (const pt of data) {
    if (!byDate.has(pt.date)) byDate.set(pt.date, { date: pt.date })
    const label = labelMap[pt.group] ?? pt.group
    byDate.get(pt.date)![label] = pt.n_postings
  }
  const rows = [...byDate.values()].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  )
  return { rows, labels }
}

interface Props {
  data: MonthlyDataPoint[] | null
  loading: boolean
  labelMap?: Record<string, string>
}

export function TrendLineChart({ data, loading, labelMap = {} }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        <span className="animate-pulse">Loading chart…</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-gray-400 text-sm">
        Click <strong className="mx-1 text-gray-600">Preview</strong> to generate the chart.
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg bg-gray-50 text-gray-400 text-sm">
        No data for the selected filters.
      </div>
    )
  }

  const { rows, labels } = pivotData(data, labelMap)

  const allValues = rows.flatMap((r) =>
    labels.map((l) => (typeof r[l] === 'number' ? (r[l] as number) : 0))
  ).filter((v) => v > 0)
  const minVal = allValues.length ? Math.min(...allValues) : 0
  const maxVal = allValues.length ? Math.max(...allValues) : 0
  const spread = maxVal - minVal
  const yMin   = Math.max(0, Math.floor(minVal - spread * 0.12))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={formatMonthTick}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[yMin, 'auto']}
          tickFormatter={(v: number) => v.toLocaleString()}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <Tooltip
          labelFormatter={(label) =>
            new Date(String(label)).toLocaleString('en-US', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            })
          }
          formatter={(value, name) => [value != null ? Number(value).toLocaleString() : '', String(name)]}
          contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
        />
        {labels.length > 1 && (
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        )}
        {labels.map((label: string, i: number) => (
          <Line
            key={label}
            type="monotone"
            dataKey={label}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
