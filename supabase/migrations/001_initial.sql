-- Quality Engineering Platform schema

CREATE TABLE IF NOT EXISTS test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('running', 'passed', 'failed')),
  total_tests INT,
  passed INT,
  failed INT,
  duration_ms INT,
  coverage_pct FLOAT,
  browser TEXT CHECK (browser IN ('chromium', 'firefox', 'webkit')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_runs_created_at ON test_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_runs_browser ON test_runs(browser);

CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
  duration_ms INT,
  error_message TEXT,
  selector_healed BOOLEAN DEFAULT FALSE,
  fallback_selector TEXT,
  fallback_strategy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_run_id ON test_cases(run_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_healed ON test_cases(selector_healed) WHERE selector_healed = TRUE;

CREATE TABLE IF NOT EXISTS generated_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement TEXT NOT NULL,
  generated_code TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  actual_output TEXT NOT NULL,
  similarity_score FLOAT CHECK (similarity_score >= 0 AND similarity_score <= 1),
  verdict TEXT NOT NULL CHECK (verdict IN ('pass', 'fail')),
  reasoning TEXT,
  model TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL UNIQUE,
  stages JSONB NOT NULL DEFAULT '[]',
  overall_status TEXT NOT NULL CHECK (overall_status IN ('running', 'passed', 'failed')),
  coverage_threshold FLOAT DEFAULT 80.0,
  coverage_actual FLOAT,
  gate_passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created_at ON pipeline_runs(created_at DESC);
