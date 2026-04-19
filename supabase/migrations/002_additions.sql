-- Lighthouse audit reports
CREATE TABLE IF NOT EXISTS lighthouse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  performance FLOAT,
  accessibility FLOAT,
  best_practices FLOAT,
  seo FLOAT,
  thresholds JSONB NOT NULL DEFAULT '{}',
  passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lighthouse_reports_created_at ON lighthouse_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lighthouse_reports_url ON lighthouse_reports(url);

-- MCP agent run records
CREATE TABLE IF NOT EXISTS mcp_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction TEXT NOT NULL,
  target_url TEXT,
  actions JSONB NOT NULL DEFAULT '[]',
  overall_success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_runs_created_at ON mcp_runs(created_at DESC);

-- Gherkin / natural language source tracking on generated tests
ALTER TABLE generated_tests
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'natural'
  CHECK (source IN ('natural', 'gherkin'));
