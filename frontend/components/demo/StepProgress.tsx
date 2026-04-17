'use client'

import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Create Account' },
  { label: 'Verify Email' },
  { label: 'Setup Profile' },
  { label: 'Welcome' },
]

interface StepProgressProps {
  current: number
}

export default function StepProgress({ current }: StepProgressProps) {
  return (
    <div className="flex items-center gap-0 w-full mb-8" data-testid="step-progress">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold transition-all duration-300',
                  done  && 'border-neon-green bg-neon-green/20 text-neon-green shadow-neon-green',
                  active && 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan animate-glow-pulse',
                  !done && !active && 'border-terminal-border bg-terminal-surface text-terminal-dim'
                )}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={cn(
                'mt-1 text-[10px] font-mono tracking-wide whitespace-nowrap',
                active ? 'text-neon-cyan' : done ? 'text-neon-green' : 'text-terminal-dim'
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-2 transition-all duration-500',
                done ? 'bg-neon-green/60' : 'bg-terminal-border'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
