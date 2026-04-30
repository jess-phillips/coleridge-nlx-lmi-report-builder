import { NextRequest, NextResponse } from 'next/server'
import { getMockAdapter } from '@/lib/data/mock-adapter'
import type { PostingFilters } from '@/lib/data/types'

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams

  const startDate = p.get('startDate')
  const endDate = p.get('endDate')
  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
  }

  const filters: PostingFilters = {
    startDate,
    endDate,
    states: p.getAll('state').filter(Boolean) || undefined,
    onetCodes: p.getAll('onetCode').filter(Boolean) || undefined,
  }
  // Treat empty arrays as "no filter"
  if (!filters.states?.length) filters.states = undefined
  if (!filters.onetCodes?.length) filters.onetCodes = undefined

  try {
    const adapter = getMockAdapter()
    const data = await adapter.getMonthlyPostings(filters)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/chart-data]', err)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}
