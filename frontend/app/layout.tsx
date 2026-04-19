import type { Metadata } from 'next'
import type React from 'react'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import NavBar from '@/components/ui/NavBar'
import Providers from '@/components/ui/Providers'

export const metadata: Metadata = {
  title: 'Jerry — AI-powered E2E Testing Agent',
  description: 'Write, heal, and validate end-to-end tests at scale. Gherkin generation, Lighthouse audits, self-healing selectors, and LLM-as-a-Judge.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-terminal-bg text-[#c9d1d9] font-mono antialiased min-h-screen">
        <Providers>
          <NavBar />
          <main className="pt-16">
            {children}
          </main>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
