'use client'

import { useState } from 'react'
import TerminalCard from '@/components/ui/TerminalCard'
import GlowButton from '@/components/ui/GlowButton'
import NeonBadge from '@/components/ui/NeonBadge'
import { cn } from '@/lib/utils'

interface ValidationResult {
  similarity_score: number
  verdict: 'pass' | 'fail'
  reasoning: string
  differences: string[]
  id: string
}

const EXAMPLE = {
  prompt: 'Explain what Playwright is used for',
  expected: 'Playwright is a browser automation framework used for end-to-end testing of web applications. It supports multiple browsers and enables automated interaction with web pages.',
  actual: 'Playwright is a tool that lets you automate web browsers for testing purposes. It works with Chrome, Firefox, and Safari.',
}

export default function ValidationPage() {
  const [prompt, setPrompt] = useState('')
  const [expected, setExpected] = useState('')
  const [actual, setActual] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState('')

  async function validate() {
    if (!expected.trim() || !actual.trim()) return
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, expected_output: expected, actual_output: actual }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  function loadExample() {
    setPrompt(EXAMPLE.prompt)
    setExpected(EXAMPLE.expected)
    setActual(EXAMPLE.actual)
    setResult(null)
  }

  const scorePct = result ? Math.round(result.similarity_score * 100) : 0
  const conicGradient = result
    ? `conic-gradient(${result.verdict === 'pass' ? '#00ff88' : '#ff6b35'} ${scorePct * 3.6}deg, #1f2937 0deg)`
    : 'conic-gradient(#1f2937 360deg)'

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-mono font-bold text-neon-green">LLM-as-a-Judge</h1>
          <NeonBadge variant="purple">Semantic Similarity</NeonBadge>
        </div>
        <p className="text-terminal-dim text-sm font-mono">
          Claude evaluates whether an AI response semantically matches the expected output.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <TerminalCard title="evaluation_inputs" accent="purple" padding="md">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                  Context / Prompt <span className="text-terminal-muted">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What was the prompt given to the AI?"
                  className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-purple/60 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                  Expected Output
                </label>
                <textarea
                  rows={4}
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  placeholder="The ground-truth or expected response..."
                  className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-green/60 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                  Actual AI Output
                </label>
                <textarea
                  rows={4}
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  placeholder="The actual response from the AI system under test..."
                  className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-cyan/60 transition-all resize-none"
                />
              </div>

              {error && (
                <p className="text-neon-orange text-xs font-mono">{error}</p>
              )}

              <div className="flex gap-3">
                <GlowButton
                  variant="purple"
                  size="md"
                  loading={loading}
                  disabled={!expected.trim() || !actual.trim()}
                  onClick={validate}
                  className="flex-1 justify-center"
                >
                  {loading ? 'Evaluating...' : '⚖ Evaluate'}
                </GlowButton>
                <GlowButton variant="ghost" size="md" onClick={loadExample}>
                  Load Example
                </GlowButton>
              </div>
            </div>
          </TerminalCard>
        </div>

        {/* Result panel */}
        <div>
          {result ? (
            <TerminalCard
              title="evaluation_result"
              accent={result.verdict === 'pass' ? 'green' : 'orange'}
              padding="md"
            >
              <div className="space-y-5">
                {/* Score gauge */}
                <div className="flex items-center gap-6">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{ background: conicGradient }}
                    >
                      <div className="w-18 h-18 rounded-full bg-terminal-surface flex items-center justify-center w-[72px] h-[72px]">
                        <div className="text-center">
                          <div className={cn(
                            'text-2xl font-mono font-bold',
                            result.verdict === 'pass' ? 'text-neon-green' : 'text-neon-orange'
                          )}>
                            {scorePct}
                          </div>
                          <div className="text-[9px] text-terminal-dim font-mono">/ 100</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <NeonBadge
                      variant={result.verdict === 'pass' ? 'green' : 'orange'}
                      glow
                      size="md"
                    >
                      {result.verdict.toUpperCase()}
                    </NeonBadge>
                    <div className="text-xs font-mono text-terminal-dim">
                      Similarity: <span className={result.verdict === 'pass' ? 'text-neon-green' : 'text-neon-orange'}>
                        {result.similarity_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-terminal-dim">
                      Threshold: <span className="text-neon-cyan">0.75</span>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                    Reasoning
                  </div>
                  <p className="text-sm font-mono text-neon-green leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>

                {/* Differences */}
                {result.differences.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                      Differences
                    </div>
                    <ul className="space-y-1">
                      {result.differences.map((d, i) => (
                        <li key={i} className="text-xs font-mono text-neon-orange flex gap-2">
                          <span className="flex-shrink-0">△</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TerminalCard>
          ) : (
            <TerminalCard title="evaluation_result" accent="purple" padding="md">
              <div className="flex flex-col items-center justify-center h-64 text-terminal-dim space-y-3">
                <div className="text-4xl opacity-30">⚖</div>
                <p className="text-xs font-mono text-center">
                  Fill in the expected and actual outputs,<br />then click Evaluate to run the judge.
                </p>
              </div>
            </TerminalCard>
          )}
        </div>
      </div>
    </div>
  )
}
