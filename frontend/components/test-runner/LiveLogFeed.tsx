'use client'

import { useEffect, useRef } from 'react'
import LogLine from '@/components/ui/LogLine'
import type { MCPAction } from '@/types'

interface LogEntry {
  id: string
  text: string
  timestamp: string
}

interface MCPEntry {
  id: string
  action: MCPAction
}

interface LiveLogFeedProps {
  logs?: LogEntry[]
  mcpActions?: MCPEntry[]
  mode?: 'logs' | 'mcp'
  empty?: string
}

function formatTime(): string {
  return new Date().toISOString().slice(11, 19)
}

const actionIcon: Record<string, string> = {
  browser_navigate: '🌐',
  browser_click: '👆',
  browser_fill: '⌨️',
  browser_select: '📋',
  browser_screenshot: '📸',
  browser_wait: '⏳',
  thinking: '💭',
  complete: '✅',
  error: '❌',
}

export default function LiveLogFeed({ logs = [], mcpActions = [], mode = 'logs', empty }: LiveLogFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length, mcpActions.length])

  const isEmpty = mode === 'logs' ? logs.length === 0 : mcpActions.length === 0

  return (
    <div className="h-80 overflow-y-auto bg-terminal-bg rounded-lg border border-terminal-border p-3 font-mono text-xs">
      {isEmpty ? (
        <div className="flex items-center justify-center h-full text-terminal-dim">
          {empty ?? 'Waiting for output...'}
          <span className="ml-1 animate-terminal-cursor">█</span>
        </div>
      ) : mode === 'logs' ? (
        <div className="space-y-0.5">
          {logs.map((entry, i) => (
            <LogLine
              key={entry.id}
              text={entry.text}
              timestamp={entry.timestamp}
              index={i + 1}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {mcpActions.map((entry) => {
            const { action } = entry
            const icon = actionIcon[action.action] ?? '⚡'
            const color = action.action === 'error' ? 'text-neon-orange'
              : action.action === 'complete' ? 'text-neon-green'
              : action.action === 'thinking' ? 'text-terminal-dim'
              : 'text-neon-cyan'
            return (
              <div key={entry.id} className={`flex gap-2 py-0.5 ${color}`}>
                <span className="flex-shrink-0">{icon}</span>
                <span className="flex-shrink-0 text-terminal-dim">{formatTime()}</span>
                <div className="flex-1 break-all">
                  <span className="font-bold">{action.action}</span>
                  {action.selector && (
                    <span className="text-terminal-dim ml-2">→ {action.selector}</span>
                  )}
                  {action.value && (
                    <span className="text-neon-green ml-2">= &quot;{action.value.slice(0, 60)}&quot;</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
