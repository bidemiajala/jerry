'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import MetricWidget from '@/components/dashboard/MetricWidget'
import PassRateChart from '@/components/dashboard/PassRateChart'
import BrowserBreakdownChart from '@/components/dashboard/BrowserBreakdownChart'
import DurationTrendChart from '@/components/dashboard/DurationTrendChart'
import RecentRunsWidget from '@/components/dashboard/RecentRunsWidget'
import NeonBadge from '@/components/ui/NeonBadge'
import GlowButton from '@/components/ui/GlowButton'
import { getSupabaseClient } from '@/lib/supabase'
import type { TestRun, DashboardMetrics } from '@/types'
import { formatDuration } from '@/lib/utils'

const FEATURE_CARDS = [
  {
    title: 'Self-Healing Tests',
    desc: 'Playwright tests that auto-recover from selector changes using fallback strategies',
    icon: '🔧',
    href: '/test-runner',
    accent: 'text-neon-green border-neon-green/20',
    badge: 'green' as const,
    badgeLabel: 'ACTIVE',
  },
  {
    title: 'AI Test Generator',
    desc: 'Convert natural language requirements into executable Playwright TypeScript',
    icon: '✨',
    href: '/test-generator',
    accent: 'text-neon-cyan border-neon-cyan/20',
    badge: 'cyan' as const,
    badgeLabel: 'CLAUDE',
  },
  {
    title: 'Playwright MCP',
    desc: 'AI-driven browser automation using Model Context Protocol',
    icon: '🤖',
    href: '/test-runner',
    accent: 'text-neon-orange border-neon-orange/20',
    badge: 'orange' as const,
    badgeLabel: 'MCP',
  },
  {
    title: 'CI/CD Pipeline',
    desc: 'Automated quality gates with coverage threshold enforcement',
    icon: '🚀',
    href: '/pipeline',
    accent: 'text-neon-purple border-neon-purple/20',
    badge: 'purple' as const,
    badgeLabel: 'GATING',
  },
  {
    title: 'LLM-as-a-Judge',
    desc: 'Semantic similarity evaluation for non-deterministic AI outputs',
    icon: '⚖',
    href: '/validation',
    accent: 'text-neon-green border-neon-green/20',
    badge: 'green' as const,
    badgeLabel: 'JUDGE',
  },
  {
    title: 'Observability',
    desc: 'Real-time test metrics, duration trends, and browser coverage charts',
    icon: '📊',
    href: '#dashboard',
    accent: 'text-neon-cyan border-neon-cyan/20',
    badge: 'cyan' as const,
    badgeLabel: 'LIVE',
  },
]

export default function DashboardPage() {
  const [runs, setRuns] = useState<TestRun[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/tests/results?limit=20')
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      const runsData: TestRun[] = data.runs ?? []
      setRuns(runsData)

      const totalRuns = runsData.length
      const passedRuns = runsData.filter((r) => r.status === 'passed').length
      const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0
      const durations = runsData.map((r) => r.duration_ms).filter(Boolean) as number[]
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0
      setMetrics({ totalRuns, passRate, avgDuration, healedTests: 0 })
    } catch {
      // Supabase not configured — show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    // Real-time subscription
    let channel: ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null = null
    try {
      const client = getSupabaseClient()
      channel = client
        .channel('test_runs_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'test_runs' },
          (payload) => {
            setRuns((prev) => [payload.new as TestRun, ...prev.slice(0, 19)])
            loadData()
          }
        )
        .subscribe()
    } catch {
      // Supabase not configured yet — real-time disabled
    }

    return () => {
      if (channel) {
        try { getSupabaseClient().removeChannel(channel) } catch { /* noop */ }
      }
    }
  }, [loadData])

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8 space-y-8">
      {/* Hero header */}
      <div className="relative space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-mono font-bold text-neon-green">
            QE Lab
          </h1>
          <NeonBadge variant="green" pulse size="md">SYSTEM ONLINE</NeonBadge>
          <NeonBadge variant="muted" size="md">claude-haiku-4-5</NeonBadge>
        </div>
        <p className="text-terminal-dim font-mono text-sm max-w-2xl">
          AI-driven quality engineering platform // self-healing tests // LLM test generation // MCP automation // real-time observability
        </p>
        <div className="flex gap-3 pt-2">
          <Link href="/test-runner">
            <GlowButton variant="green" size="sm">▶ Run Tests</GlowButton>
          </Link>
          <Link href="/test-generator">
            <GlowButton variant="cyan" size="sm">✨ Generate Test</GlowButton>
          </Link>
          <Link href="/pipeline">
            <GlowButton variant="ghost" size="sm">🚀 Pipeline</GlowButton>
          </Link>
        </div>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {FEATURE_CARDS.map((card) => (
          <Link key={card.title} href={card.href}>
            <div className="border border-terminal-border rounded-lg p-4 bg-terminal-surface hover:bg-terminal-muted/20 transition-colors cursor-pointer group h-full space-y-2">
              <div className="text-xl">{card.icon}</div>
              <div className="text-xs font-mono font-semibold text-[#c9d1d9] group-hover:text-neon-green transition-colors leading-tight">
                {card.title}
              </div>
              <p className="text-[10px] font-mono text-terminal-dim leading-relaxed hidden lg:block">
                {card.desc}
              </p>
              <NeonBadge variant={card.badge} size="sm">{card.badgeLabel}</NeonBadge>
            </div>
          </Link>
        ))}
      </div>

      {/* Metrics row */}
      <div id="dashboard" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          label="Total Test Runs"
          value={metrics?.totalRuns ?? '--'}
          icon="🎭"
          accent="green"
          loading={loading}
        />
        <MetricWidget
          label="Pass Rate"
          value={metrics?.passRate ?? '--'}
          unit="%"
          icon="✓"
          accent="cyan"
          trend={metrics ? (metrics.passRate >= 80 ? 'up' : 'down') : undefined}
          loading={loading}
        />
        <MetricWidget
          label="Avg Duration"
          value={metrics ? formatDuration(metrics.avgDuration) : '--'}
          icon="⏱"
          accent="orange"
          loading={loading}
        />
        <MetricWidget
          label="Healed Tests"
          value={metrics?.healedTests ?? '--'}
          icon="🔧"
          accent="purple"
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PassRateChart runs={runs} />
        </div>
        <BrowserBreakdownChart runs={runs} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentRunsWidget runs={runs.slice(0, 8)} loading={loading} />
        </div>
        <DurationTrendChart runs={runs} />
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] font-mono text-terminal-dim/60 py-4 border-t border-terminal-border">
        QE Lab · Quality Engineering Platform · Claude Haiku 4.5 + Playwright + Supabase
      </div>
    </div>
  )
}
