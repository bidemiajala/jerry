'use client'

import TerminalCard from '@/components/ui/TerminalCard'
import { cn } from '@/lib/utils'

interface MetricWidgetProps {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'green' | 'cyan' | 'orange' | 'purple'
  icon?: string
  loading?: boolean
}

export default function MetricWidget({
  label,
  value,
  unit,
  trend,
  accent = 'green',
  icon,
  loading,
}: MetricWidgetProps) {
  const trendColor = trend === 'up' ? 'text-neon-green' : trend === 'down' ? 'text-neon-orange' : 'text-terminal-dim'
  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'

  return (
    <TerminalCard accent={accent} padding="md" className="h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest uppercase text-terminal-dim">
            {label}
          </span>
          {icon && <span className="text-lg opacity-60">{icon}</span>}
        </div>

        {loading ? (
          <div className="h-8 bg-terminal-muted/30 rounded animate-pulse" />
        ) : (
          <div className="flex items-end gap-2">
            <span className={cn(
              'text-3xl font-mono font-bold leading-none',
              accent === 'green' && 'text-neon-green text-glow-green',
              accent === 'cyan' && 'text-neon-cyan text-glow-cyan',
              accent === 'orange' && 'text-neon-orange text-glow-orange',
              accent === 'purple' && 'text-neon-purple text-glow-purple',
            )}>
              {value}
            </span>
            {unit && (
              <span className="text-terminal-dim text-sm font-mono pb-1">{unit}</span>
            )}
          </div>
        )}

        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-mono', trendColor)}>
            <span>{trendSymbol}</span>
            <span className="text-terminal-dim">vs last 10 runs</span>
          </div>
        )}
      </div>
    </TerminalCard>
  )
}
