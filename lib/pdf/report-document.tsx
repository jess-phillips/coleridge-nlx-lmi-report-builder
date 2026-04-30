import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Line,
  Svg,
} from '@react-pdf/renderer'
import { PdfLineChart } from './pdf-chart'
import type { ChartEntry } from '@/app/api/pdf/route'

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#4c2a9d',
  },
  reportDate: {
    fontSize: 9,
    color: '#6b7280',
  },
  dividerNavy: { marginBottom: 4 },
  dividerGreen: { marginBottom: 10 },
  chartSection: { marginBottom: 8 },
  chartTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#191e3f',
    marginBottom: 2,
  },
  chartMeta: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  footerText: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
  },
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function buildReportDocument(
  chartData: ChartEntry[],
  onetTitles: Record<string, string> = {},
  geoLabel = 'All States',
  title = 'NLx Labor Market Report'
) {
  const generated = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const n = chartData.length

  // LETTER page: 612×792pt, padding 36 each side → content 540×720pt
  // Header (title + two dividers): ~56pt; footer is absolute
  const AVAIL_H = 664
  const sectionH = Math.floor(AVAIL_H / Math.max(n, 1))
  const plotH = Math.min(400, Math.max(60, sectionH - 85))

  return (
    <Document title={title} author="Coleridge Initiative">
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.reportTitle}>{title}</Text>
          <Text style={s.reportDate}>Generated {generated}</Text>
        </View>

        {/* Navy rule */}
        <View style={s.dividerNavy}>
          <Svg width={540} height={1}>
            <Line x1={0} y1={0} x2={540} y2={0} stroke="#191e3f" strokeWidth={1.5} />
          </Svg>
        </View>

        {/* Green accent rule (mirrors brand logo underline) */}
        <View style={s.dividerGreen}>
          <Svg width={540} height={2}>
            <Line x1={0} y1={0} x2={540} y2={0} stroke="#05d350" strokeWidth={2} />
          </Svg>
        </View>

        {/* Charts */}
        {chartData.map((entry) => {
          const { item } = entry
          return (
            <View key={item.id} style={s.chartSection}>
              <Text style={s.chartTitle}>{item.title}</Text>
              <Text style={s.chartMeta}>
                {formatDate(item.startDate)} – {formatDate(item.endDate)} · {geoLabel}
              </Text>
              <PdfLineChart
                data={entry.data}
                plotHeight={plotH}
                labelMap={item.type === 'by-occupation' ? onetTitles : {}}
              />
            </View>
          )
        })}

        <Text style={s.footerText}>
          Coleridge Initiative · Data for Impact · coleridgeinitiative.org
        </Text>
      </Page>
    </Document>
  )
}
