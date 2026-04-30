import { NextRequest, NextResponse } from 'next/server'
import { getMockAdapter } from '@/lib/data/mock-adapter'
import type { PostingFilters, MonthlyDataPoint } from '@/lib/data/types'

// Keep in Node.js runtime so @react-pdf/renderer can run server-side
export const runtime = 'nodejs'

export interface ReportItem {
  id: string
  title: string
  type: 'overall' | 'by-occupation' | 'by-skill'
  startDate: string
  endDate: string
  selectedGroups: string[]
  majorGroup?: string
  topN?: number
  states?: string[]
}

export type TrendEntry = { kind: 'trend'; item: ReportItem; data: MonthlyDataPoint[] }
export type SkillsEntry = { kind: 'skills'; item: ReportItem; data: MonthlyDataPoint[] }
export type ChartEntry = TrendEntry | SkillsEntry

function geoLabel(states: string[] | undefined): string {
  if (!states?.length) return 'All States'
  if (states.length === 1) return states[0]
  if (states.length <= 3) return states.join(', ')
  return `${states.length} states`
}

export async function POST(request: NextRequest) {
  let items: ReportItem[]
  let reportTitle: string
  try {
    const body = await request.json()
    items = body.items
    reportTitle = body.reportTitle || 'NLx Labor Market Report'
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const adapter = getMockAdapter()

  const [chartData, meta] = await Promise.all([
    Promise.all(
      items.map(async (item): Promise<ChartEntry> => {
        const states = item.states?.length ? item.states : undefined
        if (item.type === 'by-skill') {
          const data = await adapter.getSkillsData({
            majorGroup: item.majorGroup ?? '',
            topN: item.topN ?? 10,
            startDate: item.startDate,
            endDate: item.endDate,
            states,
          })
          return { kind: 'skills', item, data }
        }
        const filters: PostingFilters = {
          startDate: item.startDate,
          endDate: item.endDate,
          states,
          onetCodes: item.type === 'by-occupation' ? item.selectedGroups : undefined,
        }
        const data = await adapter.getMonthlyPostings(filters)
        return { kind: 'trend', item, data }
      })
    ),
    adapter.getMetadata(),
  ])

  const { renderToBuffer } = await import('@react-pdf/renderer')
  const { buildReportDocument } = await import('@/lib/pdf/report-document')

  // All items share the same global state filter
  const geo = geoLabel(items[0]?.states)

  try {
    const doc = buildReportDocument(chartData, meta.onetTitles, geo, reportTitle)
    const buffer = await renderToBuffer(doc)

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="nlx-report-${Date.now()}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[/api/pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
