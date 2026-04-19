'use client'

import { useState, useEffect } from 'react'
import TerminalCard from '@/components/ui/TerminalCard'
import StepProgress from '@/components/demo/StepProgress'
import SignUpStep from '@/components/demo/SignUpStep'
import VerifyEmailStep from '@/components/demo/VerifyEmailStep'
import ProfileSetupStep from '@/components/demo/ProfileSetupStep'
import WelcomeStep from '@/components/demo/WelcomeStep'

interface UserData {
  email: string
  firstName: string
  lastName: string
}

export default function DemoPage() {
  const [step, setStep] = useState(0)
  const [userData, setUserData] = useState<UserData>({ email: '', firstName: '', lastName: '' })
  const [breakMode, setBreakMode] = useState(false)

  useEffect(() => {
    if (!breakMode) return

    // Remove data-testid from key interactive elements so self-healing kicks in
    const selectors = ['[data-testid="btn-signup"]', '[data-testid="btn-verify"]']
    const removed: Array<{ el: Element; value: string }> = []

    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el) {
        removed.push({ el, value: sel.match(/"([^"]+)"/)?.[1] ?? '' })
        el.removeAttribute('data-testid')
      }
    }

    // Also watch for DOM changes (steps re-mount)
    const observer = new MutationObserver(() => {
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el) el.removeAttribute('data-testid')
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      // Restore on toggle-off
      for (const { el, value } of removed) {
        el.setAttribute('data-testid', value)
      }
    }
  }, [breakMode])

  function handleSignUp(data: { email: string }) {
    setUserData((u) => ({ ...u, email: data.email }))
    setStep(1)
  }

  function handleVerify() {
    setStep(2)
  }

  function handleProfile(data: { firstName: string; lastName: string }) {
    setUserData((u) => ({ ...u, firstName: data.firstName, lastName: data.lastName }))
    setStep(3)
  }

  function handleReset() {
    setStep(0)
    setUserData({ email: '', firstName: '', lastName: '' })
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-terminal-bg flex items-center justify-center p-6">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-terminal-dim border border-terminal-border px-3 py-1 rounded mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-orange animate-glow-pulse" />
            MCP TARGET APP
          </div>
          <h1 className="text-2xl font-mono font-bold text-neon-green mb-1">
            Auth & Onboarding
          </h1>
          <p className="text-xs text-terminal-dim font-mono">
            Demo application for Playwright MCP automation
          </p>
        </div>

        {/* Break-mode toggle */}
        <div className="mb-4">
          <button
            data-testid="demo-break-mode"
            onClick={() => setBreakMode((b) => !b)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-mono transition-all ${
              breakMode
                ? 'border-neon-orange/40 bg-neon-orange/8 text-neon-orange'
                : 'border-terminal-border text-terminal-dim hover:border-terminal-muted hover:text-[#c9d1d9]'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{breakMode ? '⚡' : '○'}</span>
              Selector Break Mode
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${
              breakMode
                ? 'border-neon-orange/40 bg-neon-orange/10'
                : 'border-terminal-border'
            }`}>
              {breakMode ? 'ON' : 'OFF'}
            </span>
          </button>
          {breakMode && (
            <p className="mt-1.5 text-[10px] font-mono text-neon-orange/80 text-center">
              data-testid removed from btn-signup, btn-verify — self-healing selector fallbacks will fire
            </p>
          )}
        </div>

        <TerminalCard
          title={`step_${step + 1}_of_4`}
          accent="green"
          padding="lg"
        >
          <StepProgress current={step} />

          {step === 0 && <SignUpStep onNext={handleSignUp} />}
          {step === 1 && <VerifyEmailStep email={userData.email} onNext={handleVerify} />}
          {step === 2 && <ProfileSetupStep onNext={handleProfile} />}
          {step === 3 && (
            <WelcomeStep
              name={`${userData.firstName} ${userData.lastName}`}
              onReset={handleReset}
            />
          )}
        </TerminalCard>

        <div className="mt-4 text-center text-[10px] font-mono text-terminal-dim">
          {breakMode
            ? 'break mode active · aria-label fallbacks enabled · run self-healing spec'
            : 'data-testids enabled · playwright mcp ready · step ' + (step + 1) + '/4'}
        </div>
      </div>
    </div>
  )
}
