import { NextRequest } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { runPlaywrightTests } from '@/lib/playwright-runner'
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from '@/lib/rate-limiter'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(ip, 'runGenerated', LIMITS.runGenerated)
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

  const body = await req.json().catch(() => ({}))
  const code = typeof body.code === 'string' ? body.code.replace(/\0/g, '') : ''

  if (!code.trim()) {
    return new Response(JSON.stringify({ error: 'code is required' }), { status: 400 })
  }

  if (code.length > 100_000) {
    return new Response(JSON.stringify({ error: 'code too large (max 100 KB)' }), { status: 422 })
  }

  const uid = randomUUID().slice(0, 8)
  const repoRoot = path.resolve(process.cwd(), '..')
  const specPath = path.join(repoRoot, 'playwright', 'generated', `gen_${uid}.spec.ts`)
  const specPattern = `playwright/generated/gen_${uid}.spec.ts`

  // Prepend ts-nocheck so type errors in generated code don't block execution
  const safeCode = `// @ts-nocheck\n${code}`

  await writeFile(specPath, safeCode, 'utf-8')

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        for await (const event of runPlaywrightTests({ specPattern })) {
          send(event)
        }
      } catch (err) {
        send({ type: 'error', line: String(err) })
      } finally {
        // Always clean up the temp file
        await unlink(specPath).catch(() => null)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
