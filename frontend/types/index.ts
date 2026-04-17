export type TestRunStatus = 'running' | 'passed' | 'failed'
export type TestCaseStatus = 'passed' | 'failed' | 'skipped'
export type PipelineStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
export type Verdict = 'pass' | 'fail'
export type Browser = 'chromium' | 'firefox' | 'webkit'

export interface TestRun {
  id: string
  run_id: string
  status: TestRunStatus
  total_tests: number | null
  passed: number | null
  failed: number | null
  duration_ms: number | null
  coverage_pct: number | null
  browser: Browser | null
  created_at: string
}

export interface TestCase {
  id: string
  run_id: string
  test_name: string
  status: TestCaseStatus
  duration_ms: number | null
  error_message: string | null
  selector_healed: boolean
  fallback_selector: string | null
  fallback_strategy: string | null
  created_at: string
}

export interface GeneratedTest {
  id: string
  requirement: string
  generated_code: string
  model: string
  created_at: string
}

export interface AIValidation {
  id: string
  prompt: string
  expected_output: string
  actual_output: string
  similarity_score: number | null
  verdict: Verdict
  reasoning: string | null
  model: string
  created_at: string
}

export interface PipelineStage {
  name: string
  status: PipelineStatus
  duration_ms?: number
  coverage_actual?: number
  gate_passed?: boolean
}

export interface PipelineRun {
  id: string
  run_id: string
  stages: PipelineStage[]
  overall_status: TestRunStatus
  coverage_threshold: number
  coverage_actual: number | null
  gate_passed: boolean | null
  created_at: string
}

export interface MCPAction {
  action: string
  selector?: string
  value?: string
  screenshot_b64?: string
  timestamp: number
  success?: boolean
  error?: string
}

export interface HealingReport {
  test_name: string
  primary_selector: string
  fallback_used: boolean
  fallback_selector: string | null
  fallback_strategy: string | null
}

export interface DashboardMetrics {
  totalRuns: number
  passRate: number
  avgDuration: number
  healedTests: number
}
