import { NextRequest, NextResponse } from 'next/server'
import { getTestRuns, getTestCases, getHealedCount } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const browser = searchParams.get('browser') ?? undefined
  const runId = searchParams.get('run_id') ?? undefined

  try {
    const [runs, cases, healed_count] = await Promise.all([
      getTestRuns(limit, browser),
      runId ? getTestCases(runId) : Promise.resolve([]),
      getHealedCount(),
    ])
    return NextResponse.json({ runs, cases, healed_count })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
