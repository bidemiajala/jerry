import { NextRequest } from 'next/server'
import { runMCPAgent } from '@/lib/mcp-agent'
import { insertMCPRun, updateMCPRun } from '@/lib/supabase'
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from '@/lib/rate-limiter'
import { guardText } from '@/lib/input-guard'
import type { MCPAction } from '@/types'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(ip, 'mcp', LIMITS.mcp)
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

  const body = await req.json().catch(() => ({}))

  const instructionGuard = guardText(body.instruction, 500)
  if (!instructionGuard.ok) {
    return new Response(JSON.stringify({ error: instructionGuard.error }), { status: instructionGuard.status })
  }
  const instruction = instructionGuard.value
  if (!instruction) {
    return new Response(JSON.stringify({ error: 'instruction is required' }), { status: 400 })
  }

  const { targetUrl } = body

  const encoder = new TextEncoder()
  const collectedActions: MCPAction[] = []
  let runDbId: string | null = null

  try {
    const row = await insertMCPRun({
      instruction,
      target_url: targetUrl ?? null,
      actions: [],
      overall_success: null,
    })
    runDbId = row.id
  } catch {
    // Non-fatal — proceed without persistence
  }

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        for await (const action of runMCPAgent({ instruction, targetUrl })) {
          collectedActions.push(action)
          send(action)
        }

        if (runDbId) {
          const overallSuccess = collectedActions.every((a) => a.success !== false)
          await updateMCPRun(runDbId, collectedActions, overallSuccess).catch(() => null)
        }
      } catch (err) {
        const errAction: MCPAction = { action: 'error', value: String(err), timestamp: Date.now(), success: false }
        collectedActions.push(errAction)
        send(errAction)

        if (runDbId) {
          await updateMCPRun(runDbId, collectedActions, false).catch(() => null)
        }
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
