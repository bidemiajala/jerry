'use client'

import React from 'react'

import { useState } from 'react'
import GlowButton from '@/components/ui/GlowButton'

interface SignUpData {
  email: string
  password: string
  confirmPassword: string
}

interface SignUpStepProps {
  onNext: (data: SignUpData) => void
}

export default function SignUpStep({ onNext }: SignUpStepProps) {
  const [data, setData] = useState<SignUpData>({ email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Partial<SignUpData>>({})

  function validate(): boolean {
    const e: Partial<SignUpData> = {}
    if (!data.email.includes('@')) e.email = 'Valid email required'
    if (data.password.length < 8) e.password = 'Min 8 characters'
    if (data.password !== data.confirmPassword) e.confirmPassword = 'Passwords must match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (validate()) onNext(data)
  }

  return (
    <form
      data-testid="demo-signup-form"
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
      data-step="1"
    >
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-terminal-dim tracking-widest uppercase">
          Email Address
        </label>
        <input
          data-testid="input-email"
          type="email"
          autoComplete="email"
          placeholder="engineer@company.io"
          value={data.email}
          onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
          className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-green/60 focus:shadow-neon-green transition-all"
        />
        {errors.email && <p data-testid="error-email" className="text-neon-orange text-xs font-mono">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-mono text-terminal-dim tracking-widest uppercase">
          Password
        </label>
        <input
          data-testid="input-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={data.password}
          onChange={(e) => setData((d) => ({ ...d, password: e.target.value }))}
          className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-green/60 focus:shadow-neon-green transition-all"
        />
        {errors.password && <p data-testid="error-password" className="text-neon-orange text-xs font-mono">{errors.password}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-mono text-terminal-dim tracking-widest uppercase">
          Confirm Password
        </label>
        <input
          data-testid="input-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={data.confirmPassword}
          onChange={(e) => setData((d) => ({ ...d, confirmPassword: e.target.value }))}
          className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-green/60 focus:shadow-neon-green transition-all"
        />
        {errors.confirmPassword && (
          <p data-testid="error-confirm-password" className="text-neon-orange text-xs font-mono">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {Object.keys(errors).length > 0 && (
        <p data-testid="error-message" className="text-neon-orange text-xs font-mono">
          Please fix the errors above
        </p>
      )}

      <GlowButton
        data-testid="btn-signup"
        type="submit"
        variant="green"
        size="lg"
        className="w-full justify-center"
      >
        Create Account →
      </GlowButton>
    </form>
  )
}
