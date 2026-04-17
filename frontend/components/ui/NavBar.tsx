'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',                label: 'Dashboard',      prefix: '01' },
  { href: '/test-runner',     label: 'Test Runner',    prefix: '02' },
  { href: '/test-generator',  label: 'AI Generator',   prefix: '03' },
  { href: '/pipeline',        label: 'CI/CD',          prefix: '04' },
  { href: '/validation',      label: 'LLM Judge',      prefix: '05' },
  { href: '/demo',            label: 'Demo App',       prefix: '06' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-terminal-border bg-terminal-bg/90 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded border border-neon-green/30 bg-neon-green/8 flex items-center justify-center text-neon-green text-xs font-bold">
            QE
          </div>
          <div>
            <div className="text-[#c9d1d9] text-sm font-mono font-semibold leading-none">QE Lab</div>
            <div className="text-terminal-dim text-[10px] font-mono tracking-widest opacity-60">QUALITY ENG PLATFORM</div>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-all duration-150',
                  active
                    ? 'text-neon-green bg-neon-green/10 border border-neon-green/30'
                    : 'text-terminal-dim hover:text-neon-green hover:bg-neon-green/5 border border-transparent'
                )}
              >
                <span className="text-terminal-muted text-[10px]">{item.prefix}.</span>
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-terminal-dim opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          ONLINE
        </div>
      </div>
    </nav>
  )
}
