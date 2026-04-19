'use client'

import { useState, useCallback } from 'react'
import TerminalCard from '@/components/ui/TerminalCard'
import GlowButton from '@/components/ui/GlowButton'
import NeonBadge from '@/components/ui/NeonBadge'
import StageCard from '@/components/pipeline/StageCard'
import CoverageGate from '@/components/pipeline/CoverageGate'
import type { PipelineStage, PipelineStatus } from '@/types'
import HowItWorks, { HowItWorksSection, HowItWorksCallout } from '@/components/ui/HowItWorks'

const INITIAL_STAGES: PipelineStage[] = [
  { name: 'Install',  status: 'pending' },
  { name: 'Lint',     status: 'pending' },
  { name: 'Unit',     status: 'pending' },
  { name: 'E2E',      status: 'pending' },
  { name: 'Deploy',   status: 'pending' },
]

interface GateState {
  coverage_actual: number | null
  gate_passed: boolean | null
}

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES)
  const [threshold, setThreshold] = useState(80)
  const [gate, setGate] = useState<GateState>({ coverage_actual: null, gate_passed: null })
  const [running, setRunning] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle')

  function updateStage(name: string, update: Partial<PipelineStage>) {
    setStages((prev) =>
      prev.map((s) => (s.name === name ? { ...s, ...update } : s))
    )
  }

  const runPipeline = useCallback(async () => {
    setRunning(true)
    setOverallStatus('running')
    setGate({ coverage_actual: null, gate_passed: null })
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'pending' as PipelineStatus })))

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverage_threshold: threshold }),
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
            const event = JSON.parse(line.slice(6))

            if (event.stage === '__start__' || event.run_id) continue

            if (event.stage === '__gate__') {
              setGate({
                coverage_actual: event.coverage_actual ?? null,
                gate_passed: event.gate_passed ?? null,
              })
              continue
            }

            if (event.stage === '__complete__') {
              setOverallStatus(event.overall_status ?? 'passed')
              continue
            }

            updateStage(event.stage, {
              status: event.status,
              duration_ms: event.duration_ms,
              simulated: event.simulated,
              ...(event.coverage_actual !== undefined ? {
                coverage_actual: event.coverage_actual,
                gate_passed: event.gate_passed,
              } : {}),
            })

            if (event.coverage_actual !== undefined) {
              setGate({
                coverage_actual: event.coverage_actual,
                gate_passed: event.gate_passed ?? null,
              })
            }
          } catch { /* skip */ }
        }
      }
    } finally {
      setRunning(false)
    }
  }, [threshold])

  function reset() {
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'pending' as PipelineStatus })))
    setGate({ coverage_actual: null, gate_passed: null })
    setOverallStatus('idle')
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-mono font-bold text-neon-green">CI/CD Pipeline</h1>
          {running && <NeonBadge variant="cyan" pulse>RUNNING</NeonBadge>}
          {overallStatus === 'passed' && <NeonBadge variant="green" glow>PASSED</NeonBadge>}
          {overallStatus === 'failed' && <NeonBadge variant="orange" glow>FAILED</NeonBadge>}
        </div>
        <p className="text-terminal-dim text-sm font-mono">
          Automated quality gate enforcement with coverage thresholds. Pipeline halts when coverage is below threshold.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Config */}
        <TerminalCard title="pipeline_config" accent="green" padding="md">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                Coverage Threshold
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1 accent-neon-green"
                />
                <span className="text-neon-green font-mono text-sm w-12 text-right">
                  {threshold}%
                </span>
              </div>
              <p className="text-[10px] text-terminal-dim font-mono">
                Pipeline gates on this coverage value
              </p>
            </div>

            <div className="space-y-2">
              <GlowButton
                variant="green"
                size="md"
                loading={running}
                onClick={runPipeline}
                className="w-full justify-center"
              >
                {running ? 'Running...' : '▶ Run Pipeline'}
              </GlowButton>
              {overallStatus !== 'idle' && !running && (
                <GlowButton
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="w-full justify-center"
                >
                  ↺ Reset
                </GlowButton>
              )}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 pt-2 border-t border-terminal-border">
              <div className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase mb-2">Legend</div>
              {[
                { color: 'text-terminal-dim', label: '○ Pending' },
                { color: 'text-neon-cyan', label: '◉ Running' },
                { color: 'text-neon-green', label: '✓ Passed' },
                { color: 'text-neon-orange', label: '✗ Failed' },
                { color: 'text-terminal-muted', label: '— Skipped' },
              ].map(({ color, label }) => (
                <div key={label} className={`text-xs font-mono ${color}`}>{label}</div>
              ))}
            </div>
          </div>
        </TerminalCard>

        {/* Pipeline stages */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {stages.map((stage, i) => (
              <div key={stage.name} className="relative">
                <StageCard {...stage} simulated={stage.simulated} />
                {i < stages.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-1.5 w-3 h-px bg-terminal-border z-10" />
                )}
              </div>
            ))}
          </div>

          <CoverageGate
            threshold={threshold}
            actual={gate.coverage_actual}
            passed={gate.gate_passed}
          />

          {/* Overall status */}
          {overallStatus !== 'idle' && (
            <TerminalCard
              accent={overallStatus === 'passed' ? 'green' : overallStatus === 'failed' ? 'orange' : 'cyan'}
              padding="md"
            >
              <div className="text-center space-y-2">
                <div className="text-3xl">
                  {overallStatus === 'passed' ? '🚀' : overallStatus === 'failed' ? '🛑' : '⏳'}
                </div>
                <div className={`text-lg font-mono font-bold ${
                  overallStatus === 'passed' ? 'text-neon-green' :
                  overallStatus === 'failed' ? 'text-neon-orange' : 'text-neon-cyan'
                }`}>
                  {overallStatus === 'running' ? 'Pipeline running...'
                    : overallStatus === 'passed' ? 'Pipeline passed — deployment triggered'
                    : 'Pipeline failed — deployment blocked'}
                </div>
                {gate.coverage_actual !== null && overallStatus !== 'running' && (
                  <p className="text-xs font-mono text-terminal-dim">
                    Coverage: {gate.coverage_actual.toFixed(1)}% (threshold: {threshold}%)
                  </p>
                )}
              </div>
            </TerminalCard>
          )}
        </div>
      </div>

      <HowItWorks>
        <HowItWorksSection title="Real vs simulated stages">
          The E2E stage runs your actual Playwright test suite and reports real pass/fail results — its duration reflects how long your tests actually take. Install, Lint, Unit, and Deploy are simulated with realistic jitter to keep the demo fast; they are labelled "simulated" on each stage card.
        </HowItWorksSection>
        <HowItWorksSection title="Coverage gate">
          After the Unit stage, Jerry compares a randomly sampled coverage value against your threshold slider. If coverage falls short, the pipeline halts and E2E + Deploy are skipped — the same behaviour as a real CI gate enforced by Istanbul/c8. In a production setup you would replace the random value with output from your coverage reporter.
        </HowItWorksSection>
        <HowItWorksCallout>
          Why this matters for QE: the coverage gate gives QA engineers a single enforced quality bar. No merge can bypass it — if unit coverage drops, E2E never runs and deployment is blocked.
        </HowItWorksCallout>
      </HowItWorks>
    </div>
  )
}
