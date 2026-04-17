'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import TerminalCard from '@/components/ui/TerminalCard'
import type { TestRun } from '@/types'
import { truncateRunId } from '@/lib/utils'

interface DurationTrendChartProps {
  runs: TestRun[]
}

export default function DurationTrendChart({ runs }: DurationTrendChartProps) {
  const data = [...runs].reverse().map((r) => ({
    name: truncateRunId(r.run_id),
    duration: r.duration_ms ? Math.round(r.duration_ms / 1000) : 0,
  }))

  return (
    <TerminalCard title="duration_trend_s" accent="purple" padding="md" className="h-full">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="durationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,41,55,0.8)" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: '4px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: '#a855f7',
              }}
              formatter={(v: number) => [`${v}s`, 'Duration']}
            />
            <Area
              type="monotone"
              dataKey="duration"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#durationGradient)"
              dot={{ fill: '#a855f7', r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </TerminalCard>
  )
}
