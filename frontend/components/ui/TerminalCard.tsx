'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TerminalCardProps {
  children: React.ReactNode
  className?: string
  title?: string
  accent?: 'green' | 'cyan' | 'orange' | 'purple'
  padding?: 'sm' | 'md' | 'lg'
}

const accentDot: Record<string, string> = {
  green:  'bg-neon-green/60',
  cyan:   'bg-neon-cyan/60',
  orange: 'bg-neon-orange/60',
  purple: 'bg-neon-purple/60',
}

const paddingMap = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export default function TerminalCard({
  children,
  className,
  title,
  accent = 'green',
  padding = 'md',
}: TerminalCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-terminal-border bg-terminal-surface overflow-hidden',
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-terminal-border">
          <span className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-terminal-muted/60" />
            <span className="w-2 h-2 rounded-full bg-terminal-muted/60" />
            <span className={cn('w-2 h-2 rounded-full', accentDot[accent])} />
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-terminal-dim opacity-70">
            {title}
          </span>
        </div>
      )}

      <div className={paddingMap[padding]}>
        {children}
      </div>
    </div>
  )
}
