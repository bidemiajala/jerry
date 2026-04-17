'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import TerminalCard from '@/components/ui/TerminalCard'
import type { TestRun } from '@/types'

interface BrowserBreakdownChartProps {
  runs: TestRun[]
}

const BROWSER_COLORS: Record<string, string> = {
  chromium: '#00ff88',
  firefox: '#00d4ff',
  webkit: '#ff6b35',
  unknown: '#a855f7',
}

interface CustomLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.1) return null
  return (
    <text x={x} y={y} fill="#0a0a0f" textAnchor="middle" dominantBaseline="central" fontSize={10} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function BrowserBreakdownChart({ runs }: BrowserBreakdownChartProps) {
  const counts: Record<string, number> = {}
  for (const run of runs) {
    const b = run.browser ?? 'unknown'
    counts[b] = (counts[b] ?? 0) + 1
  }

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <TerminalCard title="browser_distribution" accent="cyan" padding="md" className="h-full">
      <div className="h-52">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-terminal-dim text-xs font-mono">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                labelLine={false}
                label={CustomLabel}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={BROWSER_COLORS[entry.name] ?? '#6b7280'}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: '4px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: '#00ff88',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
                formatter={(value) => <span style={{ color: BROWSER_COLORS[value] ?? '#6b7280' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </TerminalCard>
  )
}
