'use client'

import { cn } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'

interface CoverageGateProps {
  threshold: number
  actual: number | null
  passed: boolean | null
}

export default function CoverageGate({ threshold, actual, passed }: CoverageGateProps) {
  return (
    <div className={cn(
      'rounded-lg border p-4 transition-all duration-500',
      passed === null  && 'border-terminal-border bg-terminal-surface/50',
      passed === true  && 'border-neon-green/40 bg-neon-green/5 shadow-neon-green',
      passed === false && 'border-neon-orange/40 bg-neon-orange/5 shadow-neon-orange',
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono text-terminal-dim tracking-widest uppercase">
          Coverage Gate
        </div>
        <div className={cn(
          'text-xs font-mono font-bold',
          passed === true  && 'text-neon-green',
          passed === false && 'text-neon-orange',
          passed === null  && 'text-terminal-dim',
        )}>
          Threshold: {threshold}%
        </div>
      </div>

      <div className="space-y-2">
        <ProgressBar
          value={actual ?? 0}
          max={100}
          color={passed === false ? 'orange' : 'green'}
          size="md"
          animated={passed === null && actual !== null}
        />
        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-terminal-dim">0%</span>
          <span className={cn(
            'font-bold',
            passed === true  && 'text-neon-green',
            passed === false && 'text-neon-orange',
            passed === null  && 'text-terminal-dim',
          )}>
            {actual !== null ? `${actual.toFixed(1)}%` : '--'}
          </span>
          <span className="text-terminal-dim">100%</span>
        </div>
      </div>

      {passed !== null && (
        <div className={cn(
          'mt-3 text-xs font-mono text-center font-bold',
          passed ? 'text-neon-green' : 'text-neon-orange'
        )}>
          {passed
            ? '✓ Coverage threshold met — pipeline continues'
            : `✗ Coverage ${actual?.toFixed(1)}% below threshold ${threshold}% — pipeline halted`}
        </div>
      )}
    </div>
  )
}
