'use client'

import React from 'react'
import type { LighthouseThresholds } from '@/types'

interface ThresholdConfigProps {
  thresholds: LighthouseThresholds
  onChange: (t: LighthouseThresholds) => void
  disabled?: boolean
}

const CATEGORIES: { key: keyof LighthouseThresholds; label: string }[] = [
  { key: 'performance',    label: 'Performance' },
  { key: 'accessibility',  label: 'Accessibility' },
  { key: 'best_practices', label: 'Best Practices' },
  { key: 'seo',            label: 'SEO' },
]

export default function ThresholdConfig({ thresholds, onChange, disabled }: ThresholdConfigProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {CATEGORIES.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
              {label}
            </label>
            <span className="text-xs font-mono text-[#c9d1d9] tabular-nums w-8 text-right">
              {thresholds[key]}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={thresholds[key]}
            disabled={disabled}
            onChange={(e) => onChange({ ...thresholds, [key]: parseInt(e.target.value) })}
            className="w-full h-1 rounded appearance-none bg-terminal-muted accent-neon-green disabled:opacity-40 cursor-pointer"
          />
        </div>
      ))}
    </div>
  )
}
