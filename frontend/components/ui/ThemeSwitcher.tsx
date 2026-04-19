'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const THEMES = ['dark', 'light', 'system'] as const
type Theme = typeof THEMES[number]

const ICONS: Record<Theme, string> = {
  dark:   '☾',
  light:  '☀',
  system: '⬡',
}

const LABELS: Record<Theme, string> = {
  dark:   'Dark',
  light:  'Light',
  system: 'System',
}

export default function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid SSR mismatch — only render after mount
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-16 h-7" />

  const current = (theme as Theme) ?? 'dark'

  function cycle() {
    const idx = THEMES.indexOf(current)
    setTheme(THEMES[(idx + 1) % THEMES.length])
  }

  return (
    <button
      onClick={cycle}
      title={`Theme: ${LABELS[current]} — click to switch`}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-terminal-border text-terminal-dim hover:text-[#c9d1d9] hover:border-terminal-muted transition-all text-xs font-mono"
    >
      <span>{ICONS[resolvedTheme === 'light' ? 'light' : current === 'system' ? 'system' : 'dark']}</span>
      <span className="hidden sm:inline">{LABELS[current]}</span>
    </button>
  )
}
