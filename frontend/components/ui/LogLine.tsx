'use client'

import { cn } from '@/lib/utils'

type LogLevel = 'info' | 'success' | 'error' | 'warn' | 'dim'

interface LogLineProps {
  text: string
  level?: LogLevel
  timestamp?: string
  index?: number
}

const levelMap: Record<LogLevel, string> = {
  info:    'text-neon-cyan',
  success: 'text-neon-green',
  error:   'text-neon-orange',
  warn:    'text-yellow-400',
  dim:     'text-terminal-dim',
}

function detectLevel(text: string): LogLevel {
  const lower = text.toLowerCase()
  if (lower.includes('error') || lower.includes('failed') || lower.includes('✗')) return 'error'
  if (lower.includes('passed') || lower.includes('✓') || lower.includes('success')) return 'success'
  if (lower.includes('warn')) return 'warn'
  if (lower.startsWith('[qe lab]') || lower.startsWith('running')) return 'info'
  return 'dim'
}

export default function LogLine({ text, level, timestamp, index }: LogLineProps) {
  const lvl = level ?? detectLevel(text)

  return (
    <div className={cn('flex gap-3 py-0.5 font-mono text-xs leading-relaxed', levelMap[lvl])}>
      {index !== undefined && (
        <span className="text-terminal-muted w-6 text-right flex-shrink-0 select-none">
          {String(index).padStart(3, ' ')}
        </span>
      )}
      {timestamp && (
        <span className="text-terminal-dim flex-shrink-0">{timestamp}</span>
      )}
      <span className="break-all">{text}</span>
    </div>
  )
}
