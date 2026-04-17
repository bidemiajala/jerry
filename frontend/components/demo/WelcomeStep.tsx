'use client'

import Link from 'next/link'
import GlowButton from '@/components/ui/GlowButton'

interface WelcomeStepProps {
  name: string
  onReset: () => void
}

export default function WelcomeStep({ name, onReset }: WelcomeStepProps) {
  return (
    <div
      data-testid="demo-welcome-screen"
      className="text-center space-y-6 py-4"
      data-step="4"
    >
      <div className="space-y-2">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-mono font-bold text-neon-green text-glow-green">
          Onboarding Complete
        </h2>
        <p className="text-terminal-dim font-mono text-sm">
          Welcome,{' '}
          <span data-testid="welcome-username" className="text-neon-cyan">
            {name}
          </span>
          !
        </p>
        <p className="text-terminal-dim font-mono text-xs">
          Your QE Lab account is ready.
        </p>
      </div>

      <div className="border border-neon-green/20 rounded-lg p-4 bg-neon-green/5 text-left space-y-2">
        <p className="text-neon-green text-xs font-mono">{'// ACCOUNT SUMMARY'}</p>
        <div className="space-y-1 text-xs font-mono text-terminal-dim">
          <p>✓ Account created</p>
          <p>✓ Email verified</p>
          <p>✓ Profile configured</p>
          <p>✓ Ready for test automation</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/" className="w-full">
          <GlowButton
            data-testid="btn-go-to-dashboard"
            variant="green"
            size="lg"
            className="w-full justify-center"
          >
            → Go to Dashboard
          </GlowButton>
        </Link>
        <GlowButton
          data-testid="btn-explore-features"
          variant="ghost"
          size="md"
          className="w-full justify-center"
          onClick={onReset}
        >
          Restart Demo
        </GlowButton>
      </div>
    </div>
  )
}
