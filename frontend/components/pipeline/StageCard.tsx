'use client'

import { cn } from '@/lib/utils'
import type { PipelineStatus } from '@/types'

interface StageCardProps {
  name: string
  status: PipelineStatus
  duration_ms?: number
  coverage_actual?: number
  gate_passed?: boolean
}

const statusConfig: Record<PipelineStatus, { color: string; bg: string; icon: string; label: string }> = {
  pending: { color: 'text-terminal-dim',   bg: 'border-terminal-border',    icon: '○', label: 'PENDING' },
  running: { color: 'text-neon-cyan',      bg: 'border-neon-cyan/40',       icon: '◉', label: 'RUNNING' },
  passed:  { color: 'text-neon-green',     bg: 'border-neon-green/40',      icon: '✓', label: 'PASSED' },
  failed:  { color: 'text-neon-orange',    bg: 'border-neon-orange/40',     icon: '✗', label: 'FAILED' },
  skipped: { color: 'text-terminal-muted', bg: 'border-terminal-muted/30',  icon: '—', label: 'SKIPPED' },
}

const stageIcons: Record<string, string> = {
  Install: '📦',
  Lint:    '🔍',
  Unit:    '🧪',
  E2E:     '🎭',
  Deploy:  '🚀',
}

export default function StageCard({ name, status, duration_ms, coverage_actual, gate_passed }: StageCardProps) {
  const cfg = statusConfig[status]

  return (
    <div className={cn(
      'flex flex-col gap-2 p-4 rounded-lg border bg-terminal-surface/80 transition-all duration-300',
      cfg.bg,
      status === 'running' && 'animate-glow-pulse',
      status === 'passed' && 'shadow-neon-green',
      status === 'failed' && 'shadow-neon-orange',
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{stageIcons[name] ?? '⚙️'}</span>
          <div>
            <div className="text-sm font-mono font-bold text-neon-green">{name}</div>
            <div className={cn('text-[10px] font-mono tracking-widest', cfg.color)}>
              {status === 'running' ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping inline-block" />
                  {cfg.label}
                </span>
              ) : cfg.label}
            </div>
          </div>
        </div>
        <span className={cn('text-xl', cfg.color)}>{cfg.icon}</span>
      </div>

      {duration_ms !== undefined && (
        <div className="text-[10px] font-mono text-terminal-dim">
          ⏱ {(duration_ms / 1000).toFixed(1)}s
        </div>
      )}

      {coverage_actual !== undefined && (
        <div className={cn(
          'text-[10px] font-mono',
          gate_passed ? 'text-neon-green' : 'text-neon-orange'
        )}>
          Coverage: {coverage_actual.toFixed(1)}%
          {gate_passed !== undefined && (
            <span className="ml-2">{gate_passed ? '✓ Gate passed' : '✗ Gate failed'}</span>
          )}
        </div>
      )}
    </div>
  )
}
