import type { PipelineStatus } from '@/types'
import { runPlaywrightTests } from './playwright-runner'

export interface PipelineEvent {
  stage: string
  status: PipelineStatus
  duration_ms?: number
  coverage_actual?: number
  gate_passed?: boolean
  overall_status?: string
  simulated?: boolean
}

const SIMULATED_STAGES = [
  { name: 'Install', baseDuration: 1200, canFail: false },
  { name: 'Lint',    baseDuration: 800,  canFail: true  },
  { name: 'Unit',    baseDuration: 2000, canFail: true  },
]

function jitter(base: number): number {
  return base + Math.floor((Math.random() - 0.5) * base * 0.3)
}

export async function* runPipeline(
  threshold: number = 80
): AsyncGenerator<PipelineEvent> {

  let aborted = false
  let coverageActual: number | null = null

  // --- Simulated stages: Install, Lint, Unit ---
  for (const def of SIMULATED_STAGES) {
    if (aborted) {
      yield { stage: def.name, status: 'skipped', simulated: true }
      continue
    }

    yield { stage: def.name, status: 'running', simulated: true }

    const duration = jitter(def.baseDuration)
    await sleep(duration)

    if (def.name === 'Unit') {
      coverageActual = 55 + Math.random() * 43 // 55–98%
      const gatePassed = coverageActual >= threshold

      if (!gatePassed) {
        aborted = true
        yield {
          stage: def.name,
          status: 'passed',
          duration_ms: duration,
          coverage_actual: coverageActual,
          gate_passed: false,
          simulated: true,
        }
        yield {
          stage: '__gate__',
          status: 'failed',
          coverage_actual: coverageActual,
          gate_passed: false,
        }
        continue
      }

      yield {
        stage: def.name,
        status: 'passed',
        duration_ms: duration,
        coverage_actual: coverageActual,
        gate_passed: true,
        simulated: true,
      }
      continue
    }

    const failed = def.canFail && Math.random() < 0.08
    if (failed) {
      aborted = true
      yield { stage: def.name, status: 'failed', duration_ms: duration, simulated: true }
      continue
    }

    yield { stage: def.name, status: 'passed', duration_ms: duration, simulated: true }
  }

  // --- Real E2E stage ---
  if (aborted) {
    yield { stage: 'E2E', status: 'skipped', simulated: false }
  } else {
    yield { stage: 'E2E', status: 'running', simulated: false }

    try {
      let e2ePassed = true
      let e2eDuration = 0

      for await (const event of runPlaywrightTests({ browser: 'chromium' })) {
        if (event.type === 'complete' && event.summary) {
          e2ePassed = event.summary.status === 'passed'
          e2eDuration = event.summary.duration_ms
        }
      }

      if (!e2ePassed) aborted = true

      yield {
        stage: 'E2E',
        status: e2ePassed ? 'passed' : 'failed',
        duration_ms: e2eDuration,
        simulated: false,
      }
    } catch (err) {
      aborted = true
      yield { stage: 'E2E', status: 'failed', duration_ms: 0, simulated: false }
      console.error('[pipeline] E2E stage error:', err)
    }
  }

  // --- Simulated Deploy stage ---
  if (aborted) {
    yield { stage: 'Deploy', status: 'skipped', simulated: true }
  } else {
    yield { stage: 'Deploy', status: 'running', simulated: true }
    await sleep(jitter(1500))
    yield { stage: 'Deploy', status: 'passed', duration_ms: jitter(1500), simulated: true }
  }

  yield {
    stage: '__complete__',
    status: aborted ? 'failed' : 'passed',
    overall_status: aborted ? 'failed' : 'passed',
    ...(coverageActual !== null ? { coverage_actual: coverageActual } : {}),
    gate_passed: !aborted || (coverageActual !== null && coverageActual >= threshold),
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
