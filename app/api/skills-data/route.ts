import { NextRequest, NextResponse } from 'next/server'
import { getMockAdapter } from '@/lib/data/mock-adapter'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const majorGroup = searchParams.get('majorGroup')
  const topN = Math.max(1, Math.min(50, parseInt(searchParams.get('topN') ?? '10', 10)))
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const states = searchParams.getAll('state').filter(Boolean)

  if (!majorGroup || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required params: majorGroup, startDate, endDate' }, { status: 400 })
  }

  try {
    const adapter = getMockAdapter()
    const data = await adapter.getSkillsData({
      majorGroup,
      topN,
      startDate,
      endDate,
      states: states.length ? states : undefined,
    })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/skills-data]', err)
    return NextResponse.json({ error: 'Failed to load skills data' }, { status: 500 })
  }
}
