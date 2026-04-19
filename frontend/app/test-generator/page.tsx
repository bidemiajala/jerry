'use client'

import { useState, useCallback, useRef } from 'react'
import TerminalCard from '@/components/ui/TerminalCard'
import GlowButton from '@/components/ui/GlowButton'
import NeonBadge from '@/components/ui/NeonBadge'
import { cn } from '@/lib/utils'
import type { GenerationMode } from '@/types'
import HowItWorks, { HowItWorksSection, HowItWorksCode, HowItWorksCallout } from '@/components/ui/HowItWorks'

const NATURAL_EXAMPLES = [
  'Generate a test that signs up a new user with email test@example.com and advances through all 4 onboarding steps',
  'Write a test that validates email format errors on the sign-up form',
  'Create a test suite that verifies the full profile setup step including timezone selection',
  'Generate a test that checks all data-testid attributes are present on the demo page',
]

const GHERKIN_EXAMPLES = [
  `Feature: User sign-up
  Scenario: Successful registration
    Given I am on the sign-up page
    When I fill in email "test@example.com" and password "SecurePass123"
    And I click the sign-up button
    Then I should see the email verification form`,
  `Feature: Form validation
  Scenario: Invalid email shows error
    Given I am on the sign-up page
    When I enter "not-an-email" in the email field
    And I submit the form
    Then I should see a validation error for the email field`,
  `Feature: Full onboarding
  Scenario: Complete the onboarding flow
    Given I have signed up with valid credentials
    When I verify my email with any 6-digit code
    And I complete the profile setup with my name and timezone
    Then I should see the welcome screen with my name`,
]

interface RunResult {
  status: 'passed' | 'failed' | 'error'
  total: number
  passed: number
  failed: number
  duration_ms: number
  logs: string[]
}

export default function TestGeneratorPage() {
  const [mode, setMode] = useState<GenerationMode>('natural')
  const [requirement, setRequirement] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [runLogs, setRunLogs] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const examples = mode === 'gherkin' ? GHERKIN_EXAMPLES : NATURAL_EXAMPLES

  const generate = useCallback(async () => {
    if (!requirement.trim() || streaming) return
    setStreaming(true)
    setGeneratedCode('')
    setDone(false)
    setRunResult(null)
    setRunLogs([])
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement, mode }),
        signal: abortRef.current.signal,
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done: readerDone, value } = await reader.read()
        if (readerDone) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.token) setGeneratedCode((c) => c + event.token)
            if (event.done) setDone(true)
            if (event.error) setGeneratedCode(`// Error: ${event.error}`)
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setGeneratedCode(`// Error: ${String(err)}`)
      }
    } finally {
      setStreaming(false)
    }
  }, [requirement, mode, streaming])

  const runTest = useCallback(async () => {
    if (!generatedCode.trim() || running) return
    setRunning(true)
    setRunResult(null)
    setRunLogs([])

    const logs: string[] = []

    try {
      const res = await fetch('/api/tests/run-generated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: generatedCode }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done: readerDone, value } = await reader.read()
        if (readerDone) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'log' && event.line) {
              logs.push(event.line)
              setRunLogs([...logs])
            }
            if (event.type === 'complete' && event.summary) {
              setRunResult({
                status: event.summary.status,
                total: event.summary.total_tests,
                passed: event.summary.passed,
                failed: event.summary.failed,
                duration_ms: event.summary.duration_ms,
                logs,
              })
            }
            if (event.type === 'error') {
              logs.push(`Error: ${event.line}`)
              setRunLogs([...logs])
              setRunResult({ status: 'error', total: 0, passed: 0, failed: 0, duration_ms: 0, logs })
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setRunResult({ status: 'error', total: 0, passed: 0, failed: 0, duration_ms: 0, logs: [String(err)] })
    } finally {
      setRunning(false)
    }
  }, [generatedCode, running])

  async function copyCode() {
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function switchMode(next: GenerationMode) {
    setMode(next)
    setRequirement('')
    setGeneratedCode('')
    setDone(false)
    setRunResult(null)
    setRunLogs([])
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[#c9d1d9]">Test Generator</h1>
          {streaming && <NeonBadge variant="cyan" pulse>Generating</NeonBadge>}
          {done && !streaming && !running && !runResult && <NeonBadge variant="green">Ready to run</NeonBadge>}
          {running && <NeonBadge variant="orange" pulse>Running</NeonBadge>}
          {runResult && !running && (
            <NeonBadge variant={runResult.status === 'passed' ? 'green' : 'orange'}>
              {runResult.status === 'passed' ? `${runResult.passed} passed` : runResult.status === 'error' ? 'run error' : `${runResult.failed} failed`}
            </NeonBadge>
          )}
        </div>
        <p className="text-sm text-terminal-dim">
          Describe what to test in plain English or paste a Gherkin scenario. Jerry generates executable Playwright TypeScript — then runs it.
        </p>
      </div>

      <HowItWorks>
        <HowItWorksSection title="Mechanism">
          Your requirement is sent to Claude (Haiku) with a system prompt that instructs it to output only valid Playwright TypeScript. The response streams back token-by-token via Server-Sent Events — you see the code appear in real time as the model generates it.
        </HowItWorksSection>
        <HowItWorksCode>{`// System prompt excerpt (Natural Language mode)
You are an expert QA engineer. Given a plain-English requirement,
output ONLY valid Playwright TypeScript test code using @playwright/test.
Use data-testid selectors where possible. No explanation, only code.`}</HowItWorksCode>
        <HowItWorksSection title="Gherkin / BDD mode">
          In Gherkin mode the system prompt changes: Claude is asked to parse the Feature/Scenario/Given/When/Then structure and map each step to a Playwright action. This bridges BDD specs directly to executable tests without a step-definition layer.
        </HowItWorksSection>
        <HowItWorksSection title="Run Test">
          Clicking "Run Test" POSTs the generated code to <code>/api/tests/run-generated</code>. The server prepends <code>{'// @ts-nocheck'}</code>, writes it to a temp file in <code>playwright/generated/</code>, calls the same Playwright runner used by the Test Runner page, streams results back as SSE, then deletes the file.
        </HowItWorksSection>
        <HowItWorksCallout>
          Why this matters for QE: eliminates the gap between "I know what to test" and "I have a passing spec". A non-technical stakeholder can describe behaviour in plain English and get a runnable Playwright test in under 10 seconds.
        </HowItWorksCallout>
      </HowItWorks>

      {/* Mode tabs */}
      <div className="flex border border-terminal-border rounded-lg overflow-hidden w-fit">
        {(['natural', 'gherkin'] as GenerationMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              'px-5 py-2 text-xs font-mono tracking-wide transition-colors',
              mode === m
                ? 'bg-terminal-surface text-[#c9d1d9]'
                : 'bg-transparent text-terminal-dim hover:text-[#c9d1d9]'
            )}
          >
            {m === 'natural' ? 'Natural Language' : 'Gherkin / BDD'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <TerminalCard title="input" accent="green" padding="md">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                  {mode === 'gherkin' ? 'Gherkin Scenario' : 'Requirement'}
                </label>
                <textarea
                  rows={mode === 'gherkin' ? 10 : 6}
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder={
                    mode === 'gherkin'
                      ? 'Feature: ...\n  Scenario: ...\n    Given ...\n    When ...\n    Then ...'
                      : 'Describe what you want to test...'
                  }
                  className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-[#c9d1d9] placeholder:text-terminal-muted focus:outline-none focus:border-terminal-muted transition-all resize-none"
                />
              </div>

              <GlowButton
                variant="green"
                size="md"
                loading={streaming}
                disabled={!requirement.trim()}
                onClick={generate}
                className="w-full justify-center"
              >
                {streaming ? 'Generating...' : 'Generate Test'}
              </GlowButton>
            </div>
          </TerminalCard>

          {/* Examples */}
          <TerminalCard title="examples" accent="cyan" padding="md">
            <div className="space-y-1">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setRequirement(ex)}
                  className="w-full text-left text-xs font-mono text-terminal-dim hover:text-[#c9d1d9] p-2 rounded hover:bg-terminal-muted/20 transition-all"
                >
                  <span className="text-terminal-muted mr-2 tabular-nums">{(i + 1).toString().padStart(2, '0')}.</span>
                  <span className="line-clamp-2">{ex.split('\n')[0]}</span>
                </button>
              ))}
            </div>
          </TerminalCard>
        </div>

        {/* Output panel */}
        <div className="space-y-4">
          <TerminalCard
            title="generated_test.ts"
            accent={done ? 'green' : 'cyan'}
            padding="sm"
          >
            <div className="flex items-center justify-between px-2 pb-2 border-b border-terminal-border mb-3">
              <span className="text-[10px] font-mono text-terminal-dim">
                {streaming ? 'Generating...' : done ? 'Ready' : 'Awaiting input'}
              </span>
              <div className="flex gap-2">
                {generatedCode && (
                  <GlowButton variant="ghost" size="sm" onClick={copyCode}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </GlowButton>
                )}
                {done && !streaming && (
                  <GlowButton
                    variant="green"
                    size="sm"
                    loading={running}
                    onClick={runTest}
                  >
                    {running ? 'Running...' : '▶ Run Test'}
                  </GlowButton>
                )}
              </div>
            </div>

            <div className="h-[420px] overflow-y-auto">
              {generatedCode ? (
                <pre className="text-xs font-mono text-[#c9d1d9] whitespace-pre-wrap break-all leading-relaxed">
                  {generatedCode}
                  {streaming && <span className="animate-pulse text-neon-green">█</span>}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-terminal-dim text-xs font-mono">
                  Generated Playwright TypeScript will appear here
                </div>
              )}
            </div>
          </TerminalCard>

          {/* Run results */}
          {(running || runResult || runLogs.length > 0) && (
            <TerminalCard
              title="run_output"
              accent={runResult ? (runResult.status === 'passed' ? 'green' : 'orange') : 'cyan'}
              padding="sm"
            >
              {/* Summary bar */}
              {runResult && (
                <div className={cn(
                  'flex items-center gap-4 px-3 py-2 mb-3 rounded border text-xs font-mono',
                  runResult.status === 'passed'
                    ? 'border-neon-green/20 bg-neon-green/5 text-neon-green'
                    : 'border-neon-orange/20 bg-neon-orange/5 text-neon-orange'
                )}>
                  <span className="font-semibold">
                    {runResult.status === 'passed' ? '✓ PASSED' : runResult.status === 'error' ? '✗ ERROR' : '✗ FAILED'}
                  </span>
                  {runResult.total > 0 && (
                    <>
                      <span>{runResult.passed}/{runResult.total} tests passed</span>
                      <span className="text-terminal-dim ml-auto">
                        {(runResult.duration_ms / 1000).toFixed(1)}s
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Log stream */}
              <div className="h-40 overflow-y-auto">
                {running && runLogs.length === 0 && (
                  <div className="flex items-center gap-2 text-xs font-mono text-terminal-dim px-2 py-1">
                    <span className="w-3 h-3 rounded-full border border-terminal-muted border-t-neon-green animate-spin" />
                    Starting Playwright...
                  </div>
                )}
                {runLogs.map((log, i) => (
                  <div key={i} className="text-[10px] font-mono text-terminal-dim px-2 py-0.5 leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </TerminalCard>
          )}
        </div>
      </div>
    </div>
  )
}
