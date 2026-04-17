import type { Metadata } from 'next'
import type React from 'react'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import NavBar from '@/components/ui/NavBar'

export const metadata: Metadata = {
  title: 'QE Lab // Quality Engineering Platform',
  description: 'AI-driven testing ecosystem with self-healing tests, LLM test generation, and real-time observability',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-terminal-bg text-[#c9d1d9] font-mono antialiased min-h-screen">
        <NavBar />
        <main className="pt-16">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  )
}
