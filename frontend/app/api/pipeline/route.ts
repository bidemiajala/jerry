import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { runPipeline } from '@/lib/pipeline-simulator'
import { insertPipelineRun, updatePipelineRun } from '@/lib/supabase'
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from '@/lib/rate-limiter'
import type { PipelineStage } from '@/types'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(ip, 'pipeline', LIMITS.pipeline)
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

  const body = await req.json().catch(() => ({}))
  const rawThreshold = Number(body.coverage_threshold)
  const coverage_threshold = Number.isFinite(rawThreshold) && rawThreshold >= 0 && rawThreshold <= 100
    ? rawThreshold
    : 80
  const run_id = `pipe_${Date.now()}_${randomUUID().slice(0, 8)}`
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const stages: PipelineStage[] = []
      let coverageActual: number | null = null
      let gatePassed: boolean | null = null

      try {
        await insertPipelineRun({
          run_id,
          stages: [],
          overall_status: 'running',
          coverage_threshold,
          coverage_actual: null,
          gate_passed: null,
        })

        send({ run_id, stage: '__start__', status: 'running' })

        for await (const event of runPipeline(coverage_threshold)) {
          send(event)

          if (event.stage === '__gate__' || event.stage === '__complete__') {
            if (event.coverage_actual !== undefined) coverageActual = event.coverage_actual
            if (event.gate_passed !== undefined) gatePassed = event.gate_passed
            continue
          }

          if (event.stage !== '__start__') {
            // Track stage for persistence
            const existing = stages.findIndex((s) => s.name === event.stage)
            const stageEntry: PipelineStage = {
              name: event.stage,
              status: event.status,
              duration_ms: event.duration_ms,
              ...(event.coverage_actual !== undefined ? { coverage_actual: event.coverage_actual, gate_passed: event.gate_passed } : {}),
            }
            if (existing >= 0) {
              stages[existing] = stageEntry
            } else {
              stages.push(stageEntry)
            }
          }

          if (event.stage === '__complete__') {
            await updatePipelineRun(run_id, {
              stages,
              overall_status: event.overall_status as 'passed' | 'failed',
              coverage_actual: coverageActual ?? undefined,
              gate_passed: gatePassed ?? undefined,
            })
          } else {
            await updatePipelineRun(run_id, { stages })
          }
        }
      } catch (err) {
        send({ type: 'error', message: String(err) })
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
