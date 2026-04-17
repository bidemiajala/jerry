'use client'

import { useState, useCallback, useRef } from 'react'
import TerminalCard from '@/components/ui/TerminalCard'
import GlowButton from '@/components/ui/GlowButton'
import NeonBadge from '@/components/ui/NeonBadge'

const EXAMPLE_REQUIREMENTS = [
  'Generate a test that signs up a new user on the demo app with email test@example.com and advances through all 4 onboarding steps',
  'Write a test that validates email format errors on the sign-up form',
  'Create a test suite that verifies the full profile setup step including timezone selection',
  'Generate a test that checks all data-testid attributes are present on the demo page',
]

export default function TestGeneratorPage() {
  const [requirement, setRequirement] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const generate = useCallback(async () => {
    if (!requirement.trim() || streaming) return

    setStreaming(true)
    setGeneratedCode('')
    setDone(false)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement }),
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
  }, [requirement, streaming])

  async function copyCode() {
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-mono font-bold text-neon-green">AI Test Generator</h1>
          {streaming && <NeonBadge variant="cyan" pulse>GENERATING</NeonBadge>}
          {done && !streaming && <NeonBadge variant="green">COMPLETE</NeonBadge>}
        </div>
        <p className="text-terminal-dim text-sm font-mono">
          Describe what you want to test in plain English. Claude generates executable Playwright TypeScript.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <TerminalCard title="requirement_input" accent="green" padding="md">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">
                  Natural Language Requirement
                </label>
                <textarea
                  rows={6}
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Describe what you want to test..."
                  className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-green/60 transition-all resize-none"
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
                {streaming ? 'Generating...' : '✨ Generate Test'}
              </GlowButton>
            </div>
          </TerminalCard>

          {/* Examples */}
          <TerminalCard title="example_prompts" accent="cyan" padding="md">
            <div className="space-y-2">
              {EXAMPLE_REQUIREMENTS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setRequirement(ex)}
                  className="w-full text-left text-xs font-mono text-terminal-dim hover:text-neon-cyan p-2 rounded hover:bg-neon-cyan/5 border border-transparent hover:border-neon-cyan/20 transition-all"
                >
                  <span className="text-neon-cyan mr-2">{(i + 1).toString().padStart(2, '0')}.</span>
                  {ex}
                </button>
              ))}
            </div>
          </TerminalCard>
        </div>

        {/* Output panel */}
        <TerminalCard
          title="generated_test.ts"
          accent={done ? 'green' : 'cyan'}
          padding="sm"
          className="h-fit"
        >
          <div className="flex items-center justify-between px-2 pb-2 border-b border-terminal-border mb-3">
            <span className="text-[10px] font-mono text-terminal-dim">
              {streaming ? 'Streaming from claude-haiku-4-5...' : done ? 'Generation complete' : 'Awaiting generation'}
            </span>
            {generatedCode && (
              <GlowButton variant="ghost" size="sm" onClick={copyCode}>
                {copied ? '✓ Copied' : '📋 Copy'}
              </GlowButton>
            )}
          </div>

          <div className="h-[500px] overflow-y-auto">
            {generatedCode ? (
              <pre className="text-xs font-mono text-neon-green whitespace-pre-wrap break-all leading-relaxed">
                {generatedCode}
                {streaming && <span className="animate-terminal-cursor text-neon-cyan">█</span>}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-terminal-dim text-xs font-mono">
                Generated Playwright TypeScript will appear here
                <span className="ml-1 animate-terminal-cursor">█</span>
              </div>
            )}
          </div>
        </TerminalCard>
      </div>
    </div>
  )
}
