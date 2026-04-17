'use client'

import TerminalCard from '@/components/ui/TerminalCard'
import NeonBadge from '@/components/ui/NeonBadge'
import type { TestRun } from '@/types'
import { formatDuration, timeAgo, truncateRunId } from '@/lib/utils'

interface RecentRunsWidgetProps {
  runs: TestRun[]
  loading?: boolean
}

const statusVariant = {
  passed: 'green' as const,
  failed: 'orange' as const,
  running: 'cyan' as const,
}

const browserIcon: Record<string, string> = {
  chromium: '🔵',
  firefox:  '🦊',
  webkit:   '🍎',
}

export default function RecentRunsWidget({ runs, loading }: RecentRunsWidgetProps) {
  return (
    <TerminalCard title="recent_test_runs" accent="green" padding="sm" className="h-full">
      {loading ? (
        <div className="space-y-2 p-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-terminal-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-terminal-dim text-xs font-mono">
          No test runs yet — trigger a run to see results
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-terminal-border text-terminal-dim">
                <th className="text-left pb-2 px-2 font-normal tracking-widest uppercase text-[10px]">Run ID</th>
                <th className="text-left pb-2 px-2 font-normal tracking-widest uppercase text-[10px]">Status</th>
                <th className="text-right pb-2 px-2 font-normal tracking-widest uppercase text-[10px]">Tests</th>
                <th className="text-right pb-2 px-2 font-normal tracking-widest uppercase text-[10px]">Duration</th>
                <th className="text-right pb-2 px-2 font-normal tracking-widest uppercase text-[10px]">Time</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-terminal-border/50 hover:bg-terminal-muted/10 transition-colors"
                >
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-terminal-dim">
                        {browserIcon[run.browser ?? ''] ?? '🌐'}
                      </span>
                      <span className="text-neon-cyan">{truncateRunId(run.run_id)}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <NeonBadge
                      variant={statusVariant[run.status] ?? 'muted'}
                      pulse={run.status === 'running'}
                    >
                      {run.status}
                    </NeonBadge>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className="text-neon-green">{run.passed ?? 0}</span>
                    <span className="text-terminal-dim">/</span>
                    <span className="text-neon-orange">{run.failed ?? 0}</span>
                    <span className="text-terminal-dim"> ({run.total_tests ?? 0})</span>
                  </td>
                  <td className="py-2 px-2 text-right text-terminal-dim">
                    {formatDuration(run.duration_ms)}
                  </td>
                  <td className="py-2 px-2 text-right text-terminal-dim">
                    {timeAgo(run.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TerminalCard>
  )
}
