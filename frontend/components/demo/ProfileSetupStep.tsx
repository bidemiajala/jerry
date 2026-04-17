'use client'

import React from 'react'

import { useState } from 'react'
import GlowButton from '@/components/ui/GlowButton'

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

interface ProfileData {
  firstName: string
  lastName: string
  timezone: string
  bio: string
}

interface ProfileSetupStepProps {
  onNext: (data: ProfileData) => void
}

export default function ProfileSetupStep({ onNext }: ProfileSetupStepProps) {
  const [data, setData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    timezone: 'UTC',
    bio: '',
  })
  const [errors, setErrors] = useState<Partial<ProfileData>>({})

  function validate(): boolean {
    const e: Partial<ProfileData> = {}
    if (!data.firstName.trim()) e.firstName = 'Required'
    if (!data.lastName.trim()) e.lastName = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (validate()) onNext(data)
  }

  return (
    <form
      data-testid="demo-profile-form"
      onSubmit={handleSubmit}
      className="space-y-5"
      data-step="3"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-terminal-dim tracking-widest uppercase">
            First Name
          </label>
          <input
            data-testid="input-firstname"
            type="text"
            placeholder="Jane"
            value={data.firstName}
            onChange={(e) => setData((d) => ({ ...d, firstName: e.target.value }))}
            className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-green/60 transition-all"
          />
          {errors.firstName && <p className="text-neon-orange text-xs font-mono">{errors.firstName}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-terminal-dim tracking-widest uppercase">
            Last Name
          </label>
          <input
            data-testid="input-lastname"
            type="text"
            placeholder="Smith"
            value={data.lastName}
            onChange={(e) => setData((d) => ({ ...d, lastName: e.target.value }))}
            className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-green/60 transition-all"
          />
          {errors.lastName && <p className="text-neon-orange text-xs font-mono">{errors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-mono text-terminal-dim tracking-widest uppercase">
          Timezone
        </label>
        <select
          data-testid="select-timezone"
          value={data.timezone}
          onChange={(e) => setData((d) => ({ ...d, timezone: e.target.value }))}
          className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-neon-green focus:outline-none focus:border-neon-green/60 transition-all appearance-none"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value} className="bg-terminal-surface">
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-mono text-terminal-dim tracking-widest uppercase">
          Bio <span className="text-terminal-muted">(optional)</span>
        </label>
        <textarea
          data-testid="textarea-bio"
          rows={3}
          placeholder="Senior QE Engineer @ Acme Corp..."
          value={data.bio}
          onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))}
          className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2.5 text-sm font-mono text-neon-green placeholder:text-terminal-muted focus:outline-none focus:border-neon-green/60 transition-all resize-none"
        />
      </div>

      <GlowButton
        data-testid="btn-save-profile"
        type="submit"
        variant="green"
        size="lg"
        className="w-full justify-center"
      >
        Save Profile →
      </GlowButton>
    </form>
  )
}
