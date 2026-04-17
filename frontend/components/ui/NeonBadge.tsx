'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'green' | 'cyan' | 'orange' | 'purple' | 'muted'
type Size = 'sm' | 'md'

interface NeonBadgeProps {
  children: React.ReactNode
  variant?: Variant
  size?: Size
  glow?: boolean
  pulse?: boolean
  className?: string
}

const variantMap: Record<Variant, string> = {
  green:  'text-neon-green border-neon-green/25 bg-neon-green/8',
  cyan:   'text-neon-cyan border-neon-cyan/25 bg-neon-cyan/8',
  orange: 'text-neon-orange border-neon-orange/25 bg-neon-orange/8',
  purple: 'text-neon-purple border-neon-purple/25 bg-neon-purple/8',
  muted:  'text-terminal-dim border-terminal-border bg-terminal-muted/20',
}

const dotMap: Record<Variant, string> = {
  green:  'bg-neon-green',
  cyan:   'bg-neon-cyan',
  orange: 'bg-neon-orange',
  purple: 'bg-neon-purple',
  muted:  'bg-terminal-dim',
}

export default function NeonBadge({
  children,
  variant = 'green',
  size = 'sm',
  pulse = false,
  className,
}: NeonBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border font-mono tracking-wide uppercase',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        variantMap[variant],
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-70',
          dotMap[variant],
          pulse && 'animate-pulse'
        )}
      />
      {children}
    </span>
  )
}
