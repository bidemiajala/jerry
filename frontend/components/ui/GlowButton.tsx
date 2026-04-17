'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'green' | 'cyan' | 'orange' | 'purple' | 'ghost'

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const variantMap: Record<Variant, string> = {
  green:  'bg-neon-green/10 border-neon-green/30 text-neon-green hover:bg-neon-green/20 hover:border-neon-green/50',
  cyan:   'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan/50',
  orange: 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange hover:bg-neon-orange/20 hover:border-neon-orange/50',
  purple: 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20 hover:border-neon-purple/50',
  ghost:  'bg-transparent border-terminal-border text-terminal-dim hover:text-[#c9d1d9] hover:border-terminal-muted',
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export default function GlowButton({
  variant = 'green',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded border font-mono tracking-wide transition-all duration-150',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-neon-green/40',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin flex-shrink-0" />
      )}
      {children}
    </button>
  )
}
