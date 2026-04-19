'use client'

import { useState, useEffect } from 'react'
import TerminalCard from '@/components/ui/TerminalCard'
import GlowButton from '@/components/ui/GlowButton'
import NeonBadge from '@/components/ui/NeonBadge'
import ScoreGauge from '@/components/lighthouse/ScoreGauge'
import ThresholdConfig from '@/components/lighthouse/ThresholdConfig'
import type { LighthouseReport, LighthouseThresholds } from '@/types'
import HowItWorks, { HowItWorksSection, HowItWorksCallout } from '@/components/ui/HowItWorks'

const PRESET_URLS = [
  { label: 'example.com', url: 'https://example.com' },
  { label: 'web.dev', url: 'https://web.dev' },
  { label: 'bbc.co.uk', url: 'https://www.bbc.co.uk' },
  ...(process.env.NEXT_PUBLIC_APP_URL
    ? [{ label: 'this app', url: process.env.NEXT_PUBLIC_APP_URL }]
    : []),
]

const DEFAULT_THRESHOLDS: LighthouseThresholds = {
  performance: 80,
  accessibility: 90,
  best_practices: 85,
  seo: 80,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function LighthousePage() {
  const [url, setUrl] = useState('')
  const [thresholds, setThresholds] = useState<LighthouseThresholds>(DEFAULT_THRESHOLDS)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<LighthouseReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<LighthouseReport[]>([])

  useEffect(() => {
    fetch('/api/lighthouse')
      .then((r) => r.json())
      .then((d) => setHistory(d.reports ?? []))
      .catch(() => null)
  }, [])

  async function runAudit() {
    if (!url.trim() || running) return
    setRunning(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/lighthouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, thresholds }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Audit failed')
        return
      }
      setResult(data as LighthouseReport)
      setHistory((prev) => [data as LighthouseReport, ...prev.slice(0, 19)])
    } catch (err) {
      setError(String(err))
    } finally {
      setRunning(false)
    }
  }

  const categories = result
    ? [
        { label: 'Performance',    score: result.performance,    key: 'performance'    as keyof LighthouseThresholds },
        { label: 'Accessibility',  score: result.accessibility,  key: 'accessibility'  as keyof LighthouseThresholds },
        { label: 'Best Practices', score: result.best_practices, key: 'best_practices' as keyof LighthouseThresholds },
        { label: 'SEO',            score: result.seo,            key: 'seo'            as keyof LighthouseThresholds },
      ]
    : null

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[#c9d1d9]">Lighthouse Audit</h1>
          {running && <NeonBadge variant="cyan" pulse>Running</NeonBadge>}
          {result && !running && (
            <NeonBadge variant={result.passed ? 'green' : 'orange'}>
              {result.passed ? 'All gates passed' : 'Gates failed'}
            </NeonBadge>
          )}
        </div>
        <p className="text-sm text-terminal-dim">
          Run a live Lighthouse audit against any URL and enforce score thresholds as quality gates.
        </p>
      </div>

      <HowItWorks>
        <HowItWorksSection title="Mechanism">
          Jerry launches a headless Chromium browser with <code>--remote-debugging-port</code> so Chrome exposes its native CDP HTTP server. The Lighthouse npm package connects to that port and runs a full audit — the same engine used in Chrome DevTools. Results are checked against your threshold sliders.
        </HowItWorksSection>
        <HowItWorksSection title="Quality gates">
          Each score category (Performance, Accessibility, Best Practices, SEO) is compared against its threshold. If any score falls below its threshold, the overall audit is marked as failed. Results are persisted to Supabase and appear in the history panel.
        </HowItWorksSection>
        <HowItWorksCallout>
          Why this matters for QE: Lighthouse scores are objective, reproducible performance and accessibility metrics. Gating deploys on them means accessibility regressions and performance degradations are caught in CI, not in production.
        </HowItWorksCallout>
      </HowItWorks>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-4">
          <TerminalCard title="audit_config" accent="green" padding="md">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                  Target URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-app.com"
                  className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-[#c9d1d9] placeholder:text-terminal-muted focus:outline-none focus:border-terminal-muted transition-all"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {PRESET_URLS.map((p) => (
                    <button
                      key={p.url}
                      onClick={() => setUrl(p.url)}
                      className="text-[10px] font-mono px-2 py-1 rounded border border-terminal-border text-terminal-dim hover:text-[#c9d1d9] hover:border-terminal-muted transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                  Score Thresholds
                </span>
                <ThresholdConfig thresholds={thresholds} onChange={setThresholds} disabled={running} />
              </div>

              <GlowButton
                variant="green"
                size="md"
                loading={running}
                disabled={!url.trim()}
                onClick={runAudit}
                className="w-full justify-center"
              >
                {running ? 'Auditing...' : 'Run Audit'}
              </GlowButton>

              {error && (
                <p className="text-xs font-mono text-red-400 bg-red-400/5 border border-red-400/20 rounded px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          </TerminalCard>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-3 space-y-4">
          <TerminalCard
            title="audit_results"
            accent={result ? (result.passed ? 'green' : 'orange') : 'cyan'}
            padding="md"
          >
            {!result && !running && (
              <div className="flex items-center justify-center h-48 text-terminal-dim text-sm font-mono">
                Enter a URL and run an audit to see results
              </div>
            )}

            {running && (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-terminal-dim">
                <div className="w-6 h-6 rounded-full border border-terminal-muted border-t-neon-green animate-spin" />
                <span className="text-xs font-mono">Running Lighthouse audit...</span>
                <span className="text-[10px] font-mono opacity-60">This can take 15–30 seconds</span>
              </div>
            )}

            {result && !running && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-mono text-terminal-dim">Audited URL</p>
                    <p className="text-sm font-mono text-[#c9d1d9] break-all">{result.url}</p>
                  </div>
                  <div className={`text-xs font-mono font-semibold px-3 py-1 rounded border ${
                    result.passed
                      ? 'text-neon-green border-neon-green/30 bg-neon-green/8'
                      : 'text-neon-orange border-neon-orange/30 bg-neon-orange/8'
                  }`}>
                    {result.passed ? '✓ PASS' : '✗ FAIL'}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  {categories?.map(({ label, score, key }) => (
                    <ScoreGauge
                      key={key}
                      label={label}
                      score={score}
                      threshold={thresholds[key]}
                    />
                  ))}
                </div>
              </div>
            )}
          </TerminalCard>

          {/* History */}
          {history.length > 0 && (
            <TerminalCard title="audit_history" accent="cyan" padding="sm">
              <div className="divide-y divide-terminal-border">
                {history.slice(0, 8).map((r, i) => (
                  <div
                    key={r.id ?? i}
                    className="flex items-center gap-3 px-2 py-2.5 cursor-pointer hover:bg-terminal-muted/10 transition-colors"
                    onClick={() => setResult(r)}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.passed ? 'bg-neon-green' : 'bg-neon-orange'}`} />
                    <span className="text-xs font-mono text-[#c9d1d9] flex-1 truncate">{r.url}</span>
                    <div className="flex gap-2 text-[10px] font-mono text-terminal-dim tabular-nums">
                      <span title="Performance">P:{r.performance ?? '—'}</span>
                      <span title="Accessibility">A:{r.accessibility ?? '—'}</span>
                    </div>
                    {r.created_at && (
                      <span className="text-[10px] font-mono text-terminal-dim/60 hidden sm:block">
                        {formatDate(r.created_at)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </TerminalCard>
          )}
        </div>
      </div>

    </div>
  )
}
