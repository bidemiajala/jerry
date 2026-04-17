'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'green' | 'cyan' | 'orange' | 'purple'
  size?: 'xs' | 'sm' | 'md'
  animated?: boolean
  showLabel?: boolean
  className?: string
}

const colorMap = {
  green:  'bg-neon-green',
  cyan:   'bg-neon-cyan',
  orange: 'bg-neon-orange',
  purple: 'bg-neon-purple',
}

const glowMap = {
  green:  'shadow-[0_0_6px_#00ff88]',
  cyan:   'shadow-[0_0_6px_#00d4ff]',
  orange: 'shadow-[0_0_6px_#ff6b35]',
  purple: 'shadow-[0_0_6px_#a855f7]',
}

const sizeMap = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
}

export default function ProgressBar({
  value,
  max = 100,
  color = 'green',
  size = 'sm',
  animated = false,
  showLabel = false,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-[10px] text-terminal-dim font-mono">
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-terminal-muted/30', sizeMap[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            colorMap[color],
            glowMap[color],
            animated && 'animate-glow-pulse'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
