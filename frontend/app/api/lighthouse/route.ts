import { NextRequest, NextResponse } from 'next/server'
import { insertLighthouseReport, getLighthouseReports } from '@/lib/supabase'
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from '@/lib/rate-limiter'
import { guardUrl } from '@/lib/input-guard'
import type { LighthouseThresholds } from '@/types'

export const maxDuration = 60

const PSI_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(ip, 'lighthouse', LIMITS.lighthouse)
  if (!rl.allowed) return NextResponse.json(
    { error: `Rate limit exceeded. Try again in ${rl.retryAfterSeconds}s.` },
    { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
  )

  const body = await req.json().catch(() => ({}))
  const urlGuard = guardUrl(body.url)
  if (!urlGuard.ok) return NextResponse.json({ error: urlGuard.error }, { status: urlGuard.status })
  const parsedUrl = urlGuard.value

  const thresholds = body.thresholds as LighthouseThresholds

  try {
    const psiUrl = new URL(PSI_API)
    psiUrl.searchParams.set('url', parsedUrl.href)
    psiUrl.searchParams.set('strategy', 'desktop')
    ;['performance', 'accessibility', 'best-practices', 'seo'].forEach(c =>
      psiUrl.searchParams.append('category', c)
    )
    if (process.env.PAGESPEED_API_KEY) {
      psiUrl.searchParams.set('key', process.env.PAGESPEED_API_KEY)
    }

    const res = await fetch(psiUrl.toString())
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `PageSpeed API returned ${res.status}`)
    }
    const data = await res.json()
    const cats = data.lighthouseResult?.categories

    if (!cats) throw new Error('No Lighthouse data returned from PageSpeed API')

    const scores = {
      performance:    Math.round((cats['performance']?.score    ?? 0) * 100),
      accessibility:  Math.round((cats['accessibility']?.score  ?? 0) * 100),
      best_practices: Math.round((cats['best-practices']?.score ?? 0) * 100),
      seo:            Math.round((cats['seo']?.score            ?? 0) * 100),
    }

    const passed =
      scores.performance    >= thresholds.performance    &&
      scores.accessibility  >= thresholds.accessibility  &&
      scores.best_practices >= thresholds.best_practices &&
      scores.seo            >= thresholds.seo

    const report = { url: parsedUrl.href, ...scores, thresholds, passed }

    try {
      const saved = await insertLighthouseReport(report)
      return NextResponse.json({ ...report, id: saved.id, created_at: saved.created_at })
    } catch {
      return NextResponse.json(report)
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const reports = await getLighthouseReports(20)
    return NextResponse.json({ reports })
  } catch {
    return NextResponse.json({ reports: [] })
  }
}
