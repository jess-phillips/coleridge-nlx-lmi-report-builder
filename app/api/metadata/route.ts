import { NextResponse } from 'next/server'
import { getMockAdapter } from '@/lib/data/mock-adapter'

export async function GET() {
  try {
    const adapter = getMockAdapter()
    const metadata = await adapter.getMetadata()
    return NextResponse.json(metadata)
  } catch (err) {
    console.error('[/api/metadata]', err)
    return NextResponse.json({ error: 'Failed to load metadata' }, { status: 500 })
  }
}
