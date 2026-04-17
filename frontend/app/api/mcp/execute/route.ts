import { NextRequest } from 'next/server'
import { runMCPAgent } from '@/lib/mcp-agent'

export async function POST(req: NextRequest) {
  const { instruction, targetUrl } = await req.json()

  if (!instruction?.trim()) {
    return new Response(JSON.stringify({ error: 'instruction is required' }), { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        for await (const action of runMCPAgent({ instruction, targetUrl })) {
          send(action)
        }
      } catch (err) {
        send({ action: 'error', value: String(err), timestamp: Date.now(), success: false })
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
