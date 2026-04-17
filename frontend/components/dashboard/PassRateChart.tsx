'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import TerminalCard from '@/components/ui/TerminalCard'
import type { TestRun } from '@/types'
import { truncateRunId } from '@/lib/utils'

interface PassRateChartProps {
  runs: TestRun[]
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded px-3 py-2 text-xs font-mono">
      <p className="text-terminal-dim mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function PassRateChart({ runs }: PassRateChartProps) {
  const data = [...runs].reverse().map((r) => ({
    name: truncateRunId(r.run_id),
    passed: r.passed ?? 0,
    failed: r.failed ?? 0,
  }))

  return (
    <TerminalCard title="pass_rate_trend" accent="green" padding="md" className="h-full">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,41,55,0.8)" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', paddingTop: '8px' }}
              formatter={(value) => <span style={{ color: '#6b7280' }}>{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="passed"
              stroke="#00ff88"
              strokeWidth={2}
              dot={{ fill: '#00ff88', r: 3 }}
              activeDot={{ r: 5, fill: '#00ff88' }}
            />
            <Line
              type="monotone"
              dataKey="failed"
              stroke="#ff6b35"
              strokeWidth={2}
              dot={{ fill: '#ff6b35', r: 3 }}
              activeDot={{ r: 5, fill: '#ff6b35' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </TerminalCard>
  )
}
