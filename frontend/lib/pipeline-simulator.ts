import type { PipelineStatus } from '@/types'

export interface PipelineEvent {
  stage: string
  status: PipelineStatus
  duration_ms?: number
  coverage_actual?: number
  gate_passed?: boolean
  overall_status?: string
}

const STAGES = [
  { name: 'Install',  baseDuration: 1200, canFail: false },
  { name: 'Lint',     baseDuration: 800,  canFail: true  },
  { name: 'Unit',     baseDuration: 2000, canFail: true  },
  { name: 'E2E',      baseDuration: 4500, canFail: true  },
  { name: 'Deploy',   baseDuration: 1500, canFail: false },
]

function jitter(base: number): number {
  return base + Math.floor((Math.random() - 0.5) * base * 0.3)
}

export async function* runPipeline(
  threshold: number = 80
): AsyncGenerator<PipelineEvent> {

  let aborted = false
  let coverageActual: number | null = null

  for (let i = 0; i < STAGES.length; i++) {
    const def = STAGES[i]

    if (aborted) {
      yield { stage: def.name, status: 'skipped' }
      continue
    }

    yield { stage: def.name, status: 'running' }

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
      }
      continue
    }

    const failed = def.canFail && Math.random() < 0.08
    if (failed) {
      aborted = true
      yield { stage: def.name, status: 'failed', duration_ms: duration }
      continue
    }

    yield { stage: def.name, status: 'passed', duration_ms: duration }
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
