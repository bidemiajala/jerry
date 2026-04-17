import { spawn } from 'child_process'
import path from 'path'
import { randomUUID } from 'crypto'
import { insertTestRun, updateTestRun } from './supabase'

export interface RunnerOptions {
  browser?: string
  specPattern?: string
}

export interface LogEvent {
  type: 'log' | 'complete' | 'error'
  line?: string
  run_id?: string
  summary?: {
    total_tests: number
    passed: number
    failed: number
    duration_ms: number
    status: 'passed' | 'failed'
  }
}

export async function* runPlaywrightTests(
  options: RunnerOptions = {}
): AsyncGenerator<LogEvent> {
  const run_id = `run_${Date.now()}_${randomUUID().slice(0, 8)}`
  const browser = options.browser ?? 'chromium'
  const startTime = Date.now()

  await insertTestRun({
    run_id,
    status: 'running',
    total_tests: null,
    passed: null,
    failed: null,
    duration_ms: null,
    coverage_pct: null,
    browser: browser as 'chromium' | 'firefox' | 'webkit',
  })

  yield { type: 'log', line: `[QE Lab] Starting test run ${run_id}`, run_id }

  const repoRoot = path.resolve(process.cwd(), '..')
  const args = [
    'playwright',
    'test',
    '--project',
    browser,
    '--reporter=json',
  ]
  if (options.specPattern) {
    args.push(options.specPattern)
  }

  const proc = spawn('npx', args, {
    cwd: repoRoot,
    env: { ...process.env, PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const lines: string[] = []

  proc.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    lines.push(text)
  })

  proc.stderr.on('data', (chunk: Buffer) => {
    lines.push(chunk.toString())
  })

  // Stream lines as they come
  const lineQueue: string[] = []
  let resolveNext: ((v: string | null) => void) | null = null

  proc.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    text.split('\n').forEach((l) => {
      if (l.trim()) {
        if (resolveNext) {
          resolveNext(l)
          resolveNext = null
        } else {
          lineQueue.push(l)
        }
      }
    })
  })

  proc.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    text.split('\n').forEach((l) => {
      if (l.trim()) {
        if (resolveNext) {
          resolveNext(l)
          resolveNext = null
        } else {
          lineQueue.push(l)
        }
      }
    })
  })

  const exitCode = await new Promise<number>((res) => {
    proc.on('close', (code) => {
      if (resolveNext) resolveNext(null)
      res(code ?? 1)
    })
  })

  // Flush queued lines
  for (const line of lineQueue) {
    yield { type: 'log', line, run_id }
  }

  const duration_ms = Date.now() - startTime
  const allOutput = lines.join('\n')

  // Parse summary from JSON reporter output if present
  let passed = 0
  let failed = 0
  let total_tests = 0

  try {
    const jsonMatch = allOutput.match(/\{[\s\S]*"suites"[\s\S]*\}/)
    if (jsonMatch) {
      const report = JSON.parse(jsonMatch[0])
      const stats = report.stats ?? {}
      passed = stats.expected ?? 0
      failed = stats.unexpected ?? 0
      total_tests = passed + failed + (stats.skipped ?? 0)
    }
  } catch {
    // fallback: parse text output
    const passMatch = allOutput.match(/(\d+) passed/)
    const failMatch = allOutput.match(/(\d+) failed/)
    passed = passMatch ? parseInt(passMatch[1]) : 0
    failed = failMatch ? parseInt(failMatch[1]) : 0
    total_tests = passed + failed
  }

  const status = exitCode === 0 ? 'passed' : 'failed'

  await updateTestRun(run_id, { status, total_tests, passed, failed, duration_ms })

  yield {
    type: 'complete',
    run_id,
    summary: { total_tests, passed, failed, duration_ms, status },
  }
}
