'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ScoreGaugeProps {
  label: string
  score: number | null
  threshold: number
  loading?: boolean
}

function scoreColor(score: number, threshold: number) {
  if (score >= threshold) return { text: 'text-neon-green', stroke: '#4ade80' }
  if (score >= threshold - 10) return { text: 'text-neon-orange', stroke: '#fb923c' }
  return { text: 'text-red-400', stroke: '#f87171' }
}

export default function ScoreGauge({ label, score, threshold, loading = false }: ScoreGaugeProps) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const pct = score != null ? Math.min(score, 100) / 100 : 0
  const offset = circumference - pct * circumference
  const colors = score != null ? scoreColor(score, threshold) : { text: 'text-terminal-dim', stroke: '#30363d' }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="#21262d" strokeWidth="5" />
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke={loading ? '#21262d' : colors.stroke}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference : offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <span className="text-terminal-dim text-xs">—</span>
          ) : score != null ? (
            <span className={cn('text-base font-bold leading-none tabular-nums', colors.text)}>
              {Math.round(score)}
            </span>
          ) : (
            <span className="text-terminal-dim text-xs">—</span>
          )}
        </div>
      </div>

      <div className="text-center space-y-0.5">
        <div className="text-xs font-mono text-[#c9d1d9]">{label}</div>
        <div className="text-[10px] font-mono text-terminal-dim">
          threshold: <span className="text-terminal-dim">{threshold}</span>
        </div>
        {score != null && !loading && (
          <div className={cn('text-[10px] font-mono font-semibold', colors.text)}>
            {score >= threshold ? '✓ pass' : '✗ fail'}
          </div>
        )}
      </div>
    </div>
  )
}
