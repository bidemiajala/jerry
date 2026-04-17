import { NextRequest, NextResponse } from 'next/server'
import { getTestRuns, getTestCases } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const browser = searchParams.get('browser') ?? undefined
  const runId = searchParams.get('run_id') ?? undefined

  try {
    const runs = await getTestRuns(limit, browser)
    const cases = runId ? await getTestCases(runId) : []
    return NextResponse.json({ runs, cases })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
