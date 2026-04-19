import { NextRequest } from 'next/server'
import { runPlaywrightTests } from '@/lib/playwright-runner'
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from '@/lib/rate-limiter'
import { guardEnum } from '@/lib/input-guard'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(ip, 'testRun', LIMITS.testRun)
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

  const body = await req.json().catch(() => ({}))
  const browser = guardEnum(body.browser, ['chromium', 'firefox', 'webkit'] as const, 'chromium')
  // specPattern must start with playwright/ and contain no path traversal
  const rawPattern = typeof body.specPattern === 'string' ? body.specPattern : undefined
  const specPattern = rawPattern && /^playwright\/[^.][^/]*\.spec\.ts$/.test(rawPattern)
    ? rawPattern
    : undefined

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        for await (const event of runPlaywrightTests({ browser: browser as 'chromium' | 'firefox' | 'webkit', specPattern })) {
          send(event)
        }
      } catch (err) {
        send({ type: 'error', line: String(err) })
      } finally {
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
