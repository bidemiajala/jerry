import { spawn } from 'child_process'
import { readFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { insertTestRun, updateTestRun, insertTestCase } from './supabase'

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

interface PlaywrightSpec {
  title: string
  tests: Array<{
    title: string
    status: string
    results: Array<{ status?: string; duration: number; error?: { message: string } }>
  }>
  suites?: PlaywrightSuite[]
}

interface PlaywrightSuite {
  title: string
  specs: PlaywrightSpec[]
  suites?: PlaywrightSuite[]
}

function flattenSpecs(suite: PlaywrightSuite, prefix = ''): Array<{ suitePath: string; spec: PlaywrightSpec }> {
  const suitePath = prefix ? `${prefix} > ${suite.title}` : suite.title
  const results: Array<{ suitePath: string; spec: PlaywrightSpec }> = []
  for (const spec of suite.specs ?? []) {
    results.push({ suitePath, spec })
  }
  for (const child of suite.suites ?? []) {
    results.push(...flattenSpecs(child, suitePath))
  }
  return results
}

async function persistTestCases(run_id: string, reportPath: string) {
  try {
    const raw = await readFile(reportPath, 'utf-8')
    const report = JSON.parse(raw)
    for (const suite of report.suites ?? []) {
      for (const { suitePath, spec } of flattenSpecs(suite)) {
        for (const test of spec.tests ?? []) {
          const result = test.results?.[0]
          const rawStatus = test.status ?? result?.status ?? 'failed'
          const status =
            rawStatus === 'passed' ? 'passed'
            : rawStatus === 'skipped' ? 'skipped'
            : 'failed'
          await insertTestCase({
            run_id,
            test_name: `${suitePath} > ${spec.title}`,
            status,
            duration_ms: result?.duration ?? 0,
            error_message: result?.error?.message ?? null,
            selector_healed: false,
            fallback_selector: null,
            fallback_strategy: null,
          }).catch(() => null) // non-fatal per case
        }
      }
    }
  } catch {
    // JSON report missing or malformed — not fatal
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

  yield { type: 'log', line: `[jerry] Starting test run ${run_id}`, run_id }

  const repoRoot = path.resolve(process.cwd(), '..')
  const reportPath = path.join(repoRoot, 'playwright-report', 'results.json')

  const args = [
    'playwright',
    'test',
    '--project',
    browser,
    '--reporter=json',
  ]
  if (options.specPattern) args.push(options.specPattern)

  const proc = spawn('npx', args, {
    cwd: repoRoot,
    env: { ...process.env, PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const allChunks: string[] = []
  const lineQueue: string[] = []
  let resolveNext: ((v: string | null) => void) | null = null

  function onLine(line: string) {
    if (!line.trim()) return
    if (resolveNext) { resolveNext(line); resolveNext = null }
    else lineQueue.push(line)
  }

  proc.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    allChunks.push(text)
    text.split('\n').forEach(onLine)
  })

  proc.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    allChunks.push(text)
    text.split('\n').forEach(onLine)
  })

  const exitCode = await new Promise<number>((res) => {
    proc.on('close', (code) => {
      if (resolveNext) resolveNext(null)
      res(code ?? 1)
    })
  })

  for (const line of lineQueue) {
    yield { type: 'log', line, run_id }
  }

  const duration_ms = Date.now() - startTime
  const allOutput = allChunks.join('')

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
    const passMatch = allOutput.match(/(\d+) passed/)
    const failMatch = allOutput.match(/(\d+) failed/)
    passed = passMatch ? parseInt(passMatch[1]) : 0
    failed = failMatch ? parseInt(failMatch[1]) : 0
    total_tests = passed + failed
  }

  const status = exitCode === 0 ? 'passed' : 'failed'

  await updateTestRun(run_id, { status, total_tests, passed, failed, duration_ms })

  // Persist individual test cases from the JSON report
  await persistTestCases(run_id, reportPath)

  yield {
    type: 'complete',
    run_id,
    summary: { total_tests, passed, failed, duration_ms, status },
  }
}
