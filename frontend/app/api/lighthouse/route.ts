import { NextRequest, NextResponse } from 'next/server'
import { insertLighthouseReport, getLighthouseReports } from '@/lib/supabase'
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from '@/lib/rate-limiter'
import { guardUrl } from '@/lib/input-guard'
import type { LighthouseThresholds } from '@/types'

export const maxDuration = 60 // Lighthouse can take up to ~30s

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
    const { chromium } = await import('playwright')
    const lighthouse = (await import('lighthouse')).default
    const net = await import('net')

    // Find a free port for Chrome's CDP remote debugging
    const cdpPort = await new Promise<number>((resolve, reject) => {
      const srv = net.createServer()
      srv.listen(0, () => {
        const port = (srv.address() as { port: number }).port
        srv.close(() => resolve(port))
      })
      srv.on('error', reject)
    })

    // Launch with --remote-debugging-port so Lighthouse can attach via standard CDP
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', `--remote-debugging-port=${cdpPort}`],
    })

    let scores: { performance: number; accessibility: number; best_practices: number; seo: number } | null = null

    try {
      const result = await lighthouse(parsedUrl.href, {
        port: cdpPort,
        output: 'json',
        logLevel: 'silent',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      })

      if (!result) throw new Error('Lighthouse returned no result')

      const cats = result.lhr.categories
      scores = {
        performance:    Math.round((cats['performance']?.score    ?? 0) * 100),
        accessibility:  Math.round((cats['accessibility']?.score  ?? 0) * 100),
        best_practices: Math.round((cats['best-practices']?.score ?? 0) * 100),
        seo:            Math.round((cats['seo']?.score            ?? 0) * 100),
      }
    } finally {
      await browser.close()
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
      // DB not configured — still return scores
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
