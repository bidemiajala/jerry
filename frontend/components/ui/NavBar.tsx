'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import ThemeSwitcher from './ThemeSwitcher'

const NAV_ITEMS = [
  { href: '/',               label: 'Dashboard'   },
  { href: '/test-runner',    label: 'Test Runner' },
  { href: '/test-generator', label: 'Generator'   },
  { href: '/lighthouse',     label: 'Lighthouse'  },
  { href: '/validation',     label: 'LLM Judge'   },
  { href: '/demo',           label: 'Demo App'    },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-terminal-border bg-terminal-bg/95 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md border border-terminal-border bg-terminal-surface flex items-center justify-center relative">
            <span className="text-[#c9d1d9] text-sm font-bold leading-none">J</span>
            <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-sm bg-neon-green" />
          </div>
          <span className="text-[#c9d1d9] text-sm font-semibold tracking-tight">jerry</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-all duration-150',
                  active
                    ? 'text-[#c9d1d9] bg-terminal-surface border border-terminal-border'
                    : 'text-terminal-dim hover:text-[#c9d1d9] hover:bg-terminal-surface/60 border border-transparent'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Theme switcher */}
        <ThemeSwitcher />
      </div>
    </nav>
  )
}
