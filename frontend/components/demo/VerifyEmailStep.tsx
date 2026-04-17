'use client'

import React from 'react'

import { useState } from 'react'
import GlowButton from '@/components/ui/GlowButton'

interface VerifyEmailStepProps {
  email: string
  onNext: () => void
}

export default function VerifyEmailStep({ email, onNext }: VerifyEmailStepProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  function handleVerify(ev: React.FormEvent) {
    ev.preventDefault()
    if (code.length !== 6) {
      setError('Enter the 6-digit code')
      return
    }
    // Simulate: any 6-digit code works
    setError('')
    onNext()
  }

  function handleResend() {
    setResent(true)
    setTimeout(() => setResent(false), 3000)
  }

  return (
    <form
      data-testid="demo-verify-form"
      onSubmit={handleVerify}
      className="space-y-5"
      data-step="2"
    >
      <div className="text-center space-y-2 pb-2">
        <div className="text-3xl">📬</div>
        <p className="text-sm font-mono text-terminal-dim">
          Verification code sent to{' '}
          <span className="text-neon-cyan">{email}</span>
        </p>
        <p className="text-xs text-terminal-dim font-mono">Enter any 6-digit code to continue</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-mono text-terminal-dim tracking-widest uppercase">
          Verification Code
        </label>
        <input
          data-testid="verify-code-input"
          type="text"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-center text-2xl font-mono tracking-[0.5em] text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-cyan/60 transition-all"
        />
        {error && <p data-testid="error-verify" className="text-neon-orange text-xs font-mono text-center">{error}</p>}
      </div>

      <GlowButton
        data-testid="btn-verify"
        aria-label="btn-verify"
        type="submit"
        variant="cyan"
        size="lg"
        className="w-full justify-center"
      >
        Verify Email →
      </GlowButton>

      <div className="text-center">
        <button
          data-testid="btn-resend-code"
          type="button"
          onClick={handleResend}
          className="text-xs font-mono text-terminal-dim hover:text-neon-cyan transition-colors underline-offset-2 hover:underline"
        >
          {resent ? '✓ Code resent' : 'Resend code'}
        </button>
        {resent && (
          <p data-testid="verify-success-message" className="text-neon-green text-xs font-mono mt-1">
            New code sent!
          </p>
        )}
      </div>
    </form>
  )
}
