import { NextRequest } from 'next/server'
import { runPlaywrightTests } from '@/lib/playwright-runner'

export async function POST(req: NextRequest) {
  const { browser, specPattern } = await req.json().catch(() => ({}))

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        for await (const event of runPlaywrightTests({ browser, specPattern })) {
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
