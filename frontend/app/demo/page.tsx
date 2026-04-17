'use client'

import { useState } from 'react'
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
        <div className="text-center mb-8">
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
          data-testids enabled · playwright mcp ready · step {step + 1}/4
        </div>
      </div>
    </div>
  )
}
