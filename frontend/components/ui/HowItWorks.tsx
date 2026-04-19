'use client'

import React from 'react'

interface HowItWorksProps {
  children: React.ReactNode
}

export default function HowItWorks({ children }: HowItWorksProps) {
  return (
    <details className="border border-terminal-border rounded-lg group">
      <summary className="px-4 py-3 text-xs font-mono text-terminal-dim cursor-pointer hover:text-[#c9d1d9] select-none list-none flex items-center gap-2">
        <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
        How this works
      </summary>
      <div className="px-4 pb-4 pt-2 space-y-3 border-t border-terminal-border">
        {children}
      </div>
    </details>
  )
}

export function HowItWorksSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {title && <p className="text-[10px] font-mono text-terminal-dim tracking-widest uppercase">{title}</p>}
      <div className="text-xs font-mono text-[#c9d1d9] leading-relaxed">{children}</div>
    </div>
  )
}

export function HowItWorksCode({ children }: { children: string }) {
  return (
    <pre className="text-[10px] font-mono text-neon-cyan bg-terminal-bg border border-terminal-border rounded px-3 py-2 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
      {children}
    </pre>
  )
}

export function HowItWorksCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-neon-green/20 bg-neon-green/5 rounded px-3 py-2 text-xs font-mono text-neon-green leading-relaxed">
      {children}
    </div>
  )
}
