'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { SkillCount } from '@/lib/data/types'

interface Props {
  data: SkillCount[] | null
  loading: boolean
}

export function SkillsBarChart({ data, loading }: Props) {
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

  // Recharts renders vertical-layout bars bottom-to-top, so reverse for descending display
  const reversed = [...data].reverse()
  const chartHeight = Math.max(240, reversed.length * 36)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={reversed}
        layout="vertical"
        margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => v.toLocaleString()}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="skill"
          width={190}
          tick={{ fontSize: 11, fill: '#374151' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [Number(value).toLocaleString(), 'Job postings']}
          contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="count" fill="#2563eb" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
