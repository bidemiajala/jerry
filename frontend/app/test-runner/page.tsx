'use client'

import { useState, useCallback } from 'react'
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
import TerminalCard from '@/components/ui/TerminalCard'
import GlowButton from '@/components/ui/GlowButton'
import NeonBadge from '@/components/ui/NeonBadge'
import LiveLogFeed from '@/components/test-runner/LiveLogFeed'
import HealingReport from '@/components/test-runner/HealingReport'
import type { TestCase, MCPAction } from '@/types'

type RunMode = 'playwright' | 'mcp'
type Browser = 'chromium' | 'firefox' | 'webkit'

interface LogEntry {
  id: string
  text: string
  timestamp: string
}

interface MCPEntry {
  id: string
  action: MCPAction
}

interface RunSummary {
  total_tests: number
  passed: number
  failed: number
  duration_ms: number
  status: 'passed' | 'failed'
}

export default function TestRunnerPage() {
  const [mode, setMode] = useState<RunMode>('playwright')
  const [browser, setBrowser] = useState<Browser>('chromium')
  const [mcpInstruction, setMcpInstruction] = useState('Fill out the sign-up form with email test@example.com and password TestPass123, then advance to the verification step')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [mcpActions, setMcpActions] = useState<MCPEntry[]>([])
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [healedCases, setHealedCases] = useState<TestCase[]>([])
  const [activeTab, setActiveTab] = useState<'output' | 'healing'>('output')

  function addLog(text: string) {
    const ts = new Date().toISOString().slice(11, 19)
    setLogs((prev) => [...prev, { id: uid(), text, timestamp: ts }])
  }

  function addMCPAction(action: MCPAction) {
    setMcpActions((prev) => [...prev, { id: uid(), action }])
  }

  const runPlaywright = useCallback(async () => {
    setRunning(true)
    setLogs([])
    setSummary(null)
    setHealedCases([])

    try {
      const res = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ browser }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      let runId = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'log') addLog(event.line)
            if (event.type === 'complete') {
              setSummary(event.summary)
              runId = event.run_id
            }
            if (event.type === 'error') addLog(`[ERROR] ${event.line}`)
          } catch { /* skip malformed */ }
        }
      }

      if (runId) {
        const r = await fetch(`/api/tests/results?run_id=${runId}`)
        const data = await r.json()
        setHealedCases((data.cases ?? []).filter((c: TestCase) => c.selector_healed))
      }
    } finally {
      setRunning(false)
    }
  }, [browser])

  const runMCP = useCallback(async () => {
    setRunning(true)
    setMcpActions([])

    try {
      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: mcpInstruction }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const action: MCPAction = JSON.parse(line.slice(6))
            addMCPAction(action)
          } catch { /* skip */ }
        }
      }
    } finally {
      setRunning(false)
    }
  }, [mcpInstruction])

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-mono font-bold text-neon-green">Test Runner</h1>
          {running && <NeonBadge variant="cyan" pulse>RUNNING</NeonBadge>}
        </div>
        <p className="text-terminal-dim text-sm font-mono">
          Execute Playwright tests or trigger the AI MCP agent against the demo app.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls panel */}
        <div className="space-y-4">
          <TerminalCard title="run_config" accent="green" padding="md">
            {/* Mode selector */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">Mode</label>
                <div className="flex gap-2">
                  {(['playwright', 'mcp'] as RunMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-1.5 text-xs font-mono rounded border transition-all ${
                        mode === m
                          ? 'border-neon-green/60 bg-neon-green/10 text-neon-green'
                          : 'border-terminal-border text-terminal-dim hover:border-neon-green/30'
                      }`}
                    >
                      {m === 'playwright' ? '🎭 Playwright' : '🤖 MCP Agent'}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'playwright' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">Browser</label>
                  <div className="flex gap-2">
                    {(['chromium', 'firefox', 'webkit'] as Browser[]).map((b) => (
                      <button
                        key={b}
                        onClick={() => setBrowser(b)}
                        className={`flex-1 py-1.5 text-[10px] font-mono rounded border transition-all ${
                          browser === b
                            ? 'border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan'
                            : 'border-terminal-border text-terminal-dim hover:border-neon-cyan/30'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'mcp' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                    MCP Instruction
                  </label>
                  <textarea
                    rows={4}
                    value={mcpInstruction}
                    onChange={(e) => setMcpInstruction(e.target.value)}
                    className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-xs font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-green/60 resize-none"
                  />
                </div>
              )}

              <GlowButton
                variant={mode === 'playwright' ? 'green' : 'cyan'}
                size="md"
                loading={running}
                onClick={mode === 'playwright' ? runPlaywright : runMCP}
                className="w-full justify-center"
              >
                {running ? 'Running...' : mode === 'playwright' ? '▶ Run Tests' : '▶ Run MCP Agent'}
              </GlowButton>
            </div>
          </TerminalCard>

          {/* Summary */}
          {summary && (
            <TerminalCard title="run_summary" accent={summary.status === 'passed' ? 'green' : 'orange'} padding="md">
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-terminal-dim">Status</span>
                  <NeonBadge variant={summary.status === 'passed' ? 'green' : 'orange'} glow>
                    {summary.status}
                  </NeonBadge>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-dim">Total</span>
                  <span className="text-neon-green">{summary.total_tests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-dim">Passed</span>
                  <span className="text-neon-green">{summary.passed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-dim">Failed</span>
                  <span className="text-neon-orange">{summary.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-dim">Duration</span>
                  <span className="text-neon-cyan">{(summary.duration_ms / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </TerminalCard>
          )}
        </div>

        {/* Output panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-2 border-b border-terminal-border pb-3">
            {(['output', 'healing'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-mono px-3 py-1.5 rounded border transition-all ${
                  activeTab === tab
                    ? 'border-neon-green/60 bg-neon-green/10 text-neon-green'
                    : 'border-terminal-border text-terminal-dim hover:text-neon-green'
                }`}
              >
                {tab === 'output' ? '📟 Output' : `🔧 Healing (${healedCases.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'output' ? (
            <LiveLogFeed
              logs={logs}
              mcpActions={mcpActions}
              mode={mode === 'mcp' ? 'mcp' : 'logs'}
              empty={`Waiting for ${mode === 'playwright' ? 'test output' : 'MCP agent actions'}...`}
            />
          ) : (
            <HealingReport cases={healedCases} />
          )}
        </div>
      </div>
    </div>
  )
}
