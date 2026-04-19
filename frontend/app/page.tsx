'use client'

import Link from 'next/link'
import GlowButton from '@/components/ui/GlowButton'
import { cn } from '@/lib/utils'

type FeatureAccent = 'green' | 'cyan' | 'orange' | 'purple'

const FEATURE_CARDS: {
  title: string
  desc: string
  icon: string
  href: string
  accent: FeatureAccent
  tag: string
}[] = [
  {
    title: 'Self-Healing Tests',
    desc: '4-strategy fallback chain — data-testid → ARIA → text → CSS. Selectors that recover on their own.',
    icon: '⟳',
    href: '/test-runner',
    accent: 'green',
    tag: 'Playwright',
  },
  {
    title: 'AI Test Generator',
    desc: 'Plain English or Gherkin in, executable Playwright TypeScript out. Run it immediately.',
    icon: '◆',
    href: '/test-generator',
    accent: 'cyan',
    tag: 'Claude',
  },
  {
    title: 'Playwright MCP Agent',
    desc: 'Natural language drives a real headless browser via Claude\'s tool-use loop — not a simulation.',
    icon: '◈',
    href: '/test-runner',
    accent: 'purple',
    tag: 'MCP',
  },
  {
    title: 'Lighthouse Audits',
    desc: 'Live Performance, Accessibility, Best Practices, and SEO scored against your thresholds.',
    icon: '◉',
    href: '/lighthouse',
    accent: 'orange',
    tag: 'Quality Gates',
  },
  {
    title: 'LLM-as-a-Judge',
    desc: 'Semantic similarity scoring for AI outputs. Catches meaning changes, ignores cosmetic ones.',
    icon: '⊡',
    href: '/validation',
    accent: 'purple',
    tag: 'Validation',
  },
]

const accentBorder: Record<FeatureAccent, string> = {
  green:  'border-l-neon-green/60',
  cyan:   'border-l-neon-cyan/60',
  orange: 'border-l-neon-orange/60',
  purple: 'border-l-neon-purple/60',
}
const accentIcon: Record<FeatureAccent, string> = {
  green:  'text-neon-green bg-neon-green/10',
  cyan:   'text-neon-cyan bg-neon-cyan/10',
  orange: 'text-neon-orange bg-neon-orange/10',
  purple: 'text-neon-purple bg-neon-purple/10',
}
const accentTag: Record<FeatureAccent, string> = {
  green:  'text-neon-green/70 border-neon-green/20',
  cyan:   'text-neon-cyan/70 border-neon-cyan/20',
  orange: 'text-neon-orange/70 border-neon-orange/20',
  purple: 'text-neon-purple/70 border-neon-purple/20',
}
const accentHover: Record<FeatureAccent, string> = {
  green:  'hover:border-l-neon-green hover:bg-neon-green/5',
  cyan:   'hover:border-l-neon-cyan hover:bg-neon-cyan/5',
  orange: 'hover:border-l-neon-orange hover:bg-neon-orange/5',
  purple: 'hover:border-l-neon-purple hover:bg-neon-purple/5',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-terminal-dim">
        {children}
      </span>
      <span className="flex-1 h-px bg-terminal-border" />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-10 space-y-12">

      {/* ── Hero ── */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold font-mono text-neon-green tracking-tight">
                  jerry
                </h1>
                <span className="text-[10px] font-mono px-2 py-1 rounded border border-neon-green/25 text-neon-green/70 bg-neon-green/5 tracking-widest uppercase">
                  AI QA Showcase
                </span>
              </div>
              <p className="text-sm text-terminal-dim max-w-2xl leading-relaxed">
                A working showcase of what QA engineering looks like with AI in the loop —
                tests that write themselves from plain English or Gherkin, selectors that
                heal when the UI changes, an AI agent that navigates your app like a human,
                and a semantic judge for non-deterministic outputs.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/test-runner">
              <GlowButton variant="green" size="sm">▶ Run Tests</GlowButton>
            </Link>
            <Link href="/test-generator">
              <GlowButton variant="cyan" size="sm">◆ Generate Test</GlowButton>
            </Link>
            <Link href="/lighthouse">
              <GlowButton variant="ghost" size="sm">◉ Lighthouse Audit</GlowButton>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div>
        <SectionLabel>Features</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {FEATURE_CARDS.map((card) => (
            <Link key={card.title} href={card.href}>
              <div className={cn(
                'border border-terminal-border border-l-2 rounded-lg p-4 bg-terminal-surface',
                'transition-all duration-150 cursor-pointer h-full flex flex-col gap-3',
                accentBorder[card.accent],
                accentHover[card.accent],
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'w-7 h-7 rounded flex items-center justify-center text-sm leading-none flex-shrink-0',
                    accentIcon[card.accent],
                  )}>
                    {card.icon}
                  </span>
                  <span className={cn(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded border tracking-widest uppercase',
                    accentTag[card.accent],
                  )}>
                    {card.tag}
                  </span>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="text-xs font-semibold font-mono text-[#c9d1d9] leading-tight">
                    {card.title}
                  </div>
                  <p className="text-[10px] text-terminal-dim leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-terminal-dim/40 py-4 border-t border-terminal-border">
        <span>jerry · Playwright + Claude + Supabase</span>
      </div>
    </div>
  )
}
