import React from 'react'
import { View, Text, Svg, Rect, Line, Polyline, Circle, StyleSheet } from '@react-pdf/renderer'
import type { SkillCount } from '@/lib/data/types'

const PLOT_W = 465

const s = StyleSheet.create({
  plotRow: { flexDirection: 'row', alignItems: 'flex-start' },
  yAxis: { width: 55, position: 'relative' },
  yLabel: { position: 'absolute', right: 6, fontSize: 7, color: '#374151' },
  xNumbers: { marginLeft: 55, height: 14, position: 'relative', width: PLOT_W },
  xNumber: { position: 'absolute', fontSize: 6, color: '#6b7280', textAlign: 'center', width: 10 },
  legendGrid: { marginLeft: 55, marginTop: 5, flexDirection: 'row', flexWrap: 'wrap' },
  legendItem: { width: '33%', flexDirection: 'row', marginBottom: 2 },
  legendNum: { fontSize: 6, color: '#6b7280', width: 12 },
  legendLabel: { fontSize: 6, color: '#374151', flex: 1 },
})

function niceMax(raw: number): number {
  if (raw <= 0) return 10
  const exp = Math.floor(Math.log10(raw))
  const mag = Math.pow(10, exp)
  const norm = raw / mag
  const ceil = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return ceil * mag
}

interface Props {
  data: SkillCount[]
  plotHeight?: number
}

export function PdfSkillsLineChart({ data, plotHeight = 140 }: Props) {
  const PLOT_H = plotHeight

  if (!data.length) {
    return (
      <View style={{ height: PLOT_H + 40 }}>
        <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 20 }}>No data to display.</Text>
      </View>
    )
  }

  const n = data.length
  const yMax = niceMax(data[0].count) // data sorted descending

  const xScale = (i: number) =>
    n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W
  const yScale = (v: number) => PLOT_H - (v / yMax) * PLOT_H

  const yTicks = [0, 1, 2, 3, 4].map((i) => Math.round((yMax / 4) * i))

  const points = data
    .map((d, i) => `${xScale(i).toFixed(1)},${yScale(d.count).toFixed(1)}`)
    .join(' ')

  // Show every other number label if many skills, to avoid crowding
  const numStep = n > 15 ? 2 : 1

  return (
    <View>
      {/* Plot */}
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
          <Polyline points={points} stroke="#2563eb" strokeWidth={2} fill="none" />
          {data.map((_, i) => (
            <Circle key={i} cx={xScale(i)} cy={yScale(data[i].count)} r={3} fill="#2563eb" />
          ))}
        </Svg>
      </View>

      {/* X-axis: sequential numbers below each dot */}
      <View style={s.xNumbers}>
        {data.map((_, i) => {
          if (i % numStep !== 0) return null
          return (
            <Text key={i} style={[s.xNumber, { left: xScale(i) - 5 }]}>
              {i + 1}
            </Text>
          )
        })}
      </View>

      {/* Legend: numbered skill names in 3-column grid */}
      <View style={s.legendGrid}>
        {data.map((d, i) => (
          <View key={i} style={s.legendItem}>
            <Text style={s.legendNum}>{i + 1}.</Text>
            <Text style={s.legendLabel}>{d.skill}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
