import React from 'react'
import { View, Text, Svg, Rect, Line, Polyline, StyleSheet } from '@react-pdf/renderer'
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

const PLOT_W = 465

const s = StyleSheet.create({
  plotRow: { flexDirection: 'row', alignItems: 'flex-start' },
  yAxis: { width: 55, position: 'relative' },
  yLabel: { position: 'absolute', right: 6, fontSize: 7, color: '#374151' },
  xLabels: {
    marginLeft: 55,
    height: 18,
    position: 'relative',
    width: PLOT_W,
  },
  xLabel: {
    position: 'absolute',
    fontSize: 7,
    color: '#374151',
    textAlign: 'center',
    width: 44,
  },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5, marginLeft: 55 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 3 },
  legendSwatch: { width: 12, height: 3, marginRight: 4, borderRadius: 1 },
  legendLabel: { fontSize: 7, color: '#374151' },
})

function niceMax(raw: number): number {
  if (raw <= 0) return 10
  const exp = Math.floor(Math.log10(raw))
  const magnitude = Math.pow(10, exp)
  const norm = raw / magnitude
  const ceil = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return ceil * magnitude
}

function formatMonthLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
}

interface Props {
  data: MonthlyDataPoint[]
  plotHeight?: number
  labelMap?: Record<string, string>
}

export function PdfLineChart({ data, plotHeight = 140, labelMap = {} }: Props) {
  const PLOT_H = plotHeight

  if (!data.length) {
    return (
      <View style={{ height: PLOT_H + 40 }}>
        <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 20 }}>No data to display.</Text>
      </View>
    )
  }

  const groups = [...new Set(data.map((d) => d.group))].sort()
  const dates = [...new Set(data.map((d) => d.date))].sort()

  const lookup = new Map<string, Map<string, number>>()
  for (const g of groups) lookup.set(g, new Map())
  for (const pt of data) {
    lookup.get(pt.group)?.set(pt.date, pt.n_postings)
  }

  const rawMin = Math.min(...data.map((d) => d.n_postings))
  const rawMax = Math.max(...data.map((d) => d.n_postings))
  const spread = rawMax - rawMin
  const yMin   = Math.max(0, Math.floor(rawMin - spread * 0.12))
  const yMax   = niceMax(rawMax + spread * 0.05)

  const xScale = (i: number) =>
    dates.length === 1 ? PLOT_W / 2 : (i / (dates.length - 1)) * PLOT_W
  const yScale = (v: number) =>
    PLOT_H - ((v - yMin) / Math.max(yMax - yMin, 1)) * PLOT_H

  const yTicks = [0, 1, 2, 3, 4].map((i) => Math.round(yMin + ((yMax - yMin) / 4) * i))

  const N = dates.length
  const xTickCount = Math.min(N, 6)
  const xTickIndices = Array.from({ length: xTickCount }, (_, k) =>
    Math.round((k * (N - 1)) / Math.max(xTickCount - 1, 1))
  )

  const polylines = groups.map((group, gi) => {
    const pts = dates
      .map((date, di) => {
        const v = lookup.get(group)?.get(date) ?? 0
        return `${xScale(di).toFixed(1)},${yScale(v).toFixed(1)}`
      })
      .join(' ')
    return { group, pts, color: CHART_COLORS[gi % CHART_COLORS.length] }
  })

  const showLegend = groups.length > 1 || groups[0] !== 'Overall'

  return (
    <View>
      <View style={s.plotRow}>
        <View style={[s.yAxis, { height: PLOT_H }]}>
          {yTicks.map((tick) => (
            <Text key={tick} style={[s.yLabel, { top: yScale(tick) - 4 }]}>
              {tick.toLocaleString()}
            </Text>
          ))}
        </View>

        <Svg width={PLOT_W} height={PLOT_H}>
          <Rect x={0} y={0} width={PLOT_W} height={PLOT_H} fill="#f9fafb" />
          {yTicks.map((tick) => (
            <Line
              key={tick}
              x1={0} y1={yScale(tick)} x2={PLOT_W} y2={yScale(tick)}
              stroke={tick === 0 ? '#374151' : '#e5e7eb'}
              strokeWidth={tick === 0 ? 1.5 : 0.5}
            />
          ))}
          <Line x1={0} y1={0} x2={0} y2={PLOT_H} stroke="#374151" strokeWidth={1.5} />
          {polylines.map(({ group, pts, color }) => (
            <Polyline
              key={group}
              points={pts}
              stroke={color}
              strokeWidth={2}
              fill="none"
            />
          ))}
        </Svg>
      </View>

      <View style={s.xLabels}>
        {xTickIndices.map((di) => (
          <Text
            key={di}
            style={[s.xLabel, { left: Math.max(0, xScale(di) - 22) }]}
          >
            {formatMonthLabel(dates[di])}
          </Text>
        ))}
      </View>

      {showLegend && (
        <View style={s.legendRow}>
          {groups.map((group, i) => (
            <View key={group} style={s.legendItem}>
              <View style={[s.legendSwatch, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
              <Text style={s.legendLabel}>{labelMap[group] ?? group}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
