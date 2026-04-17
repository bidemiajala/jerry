'use client'

import TerminalCard from '@/components/ui/TerminalCard'
import NeonBadge from '@/components/ui/NeonBadge'
import type { TestCase } from '@/types'

interface HealingReportProps {
  cases: TestCase[]
}

export default function HealingReport({ cases }: HealingReportProps) {
  const healed = cases.filter((c) => c.selector_healed)

  if (healed.length === 0) {
    return (
      <TerminalCard title="healing_report" accent="cyan" padding="md">
        <p className="text-terminal-dim text-xs font-mono">
          No selector healing occurred in this run — all primary selectors resolved.
        </p>
      </TerminalCard>
    )
  }

  return (
    <TerminalCard title="healing_report" accent="cyan" padding="sm">
      <div className="space-y-2">
        <div className="text-xs font-mono text-terminal-dim px-2">
          {healed.length} selector{healed.length > 1 ? 's' : ''} auto-healed
        </div>
        {healed.map((c) => (
          <div
            key={c.id}
            className="border border-neon-cyan/20 rounded p-3 bg-neon-cyan/5 space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-neon-cyan text-xs font-mono font-bold break-all">{c.test_name}</span>
              <NeonBadge variant="cyan" size="sm">HEALED</NeonBadge>
            </div>
            <div className="text-[10px] font-mono space-y-0.5">
              <div className="text-terminal-dim">
                Strategy:{' '}
                <span className="text-neon-green">{c.fallback_strategy ?? 'unknown'}</span>
              </div>
              <div className="text-terminal-dim break-all">
                Fallback:{' '}
                <span className="text-neon-cyan">{c.fallback_selector ?? '--'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </TerminalCard>
  )
}
