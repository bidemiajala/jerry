-- Seed data for QE Lab dashboard demo

INSERT INTO test_runs (run_id, status, total_tests, passed, failed, duration_ms, coverage_pct, browser, created_at) VALUES
  ('run_seed_001', 'passed', 12, 12, 0, 8420,  92.3, 'chromium', NOW() - INTERVAL '7 days'),
  ('run_seed_002', 'failed', 12, 10, 2, 9110,  88.1, 'firefox',  NOW() - INTERVAL '6 days'),
  ('run_seed_003', 'passed', 12, 12, 0, 7890,  95.0, 'webkit',   NOW() - INTERVAL '5 days'),
  ('run_seed_004', 'passed', 14, 14, 0, 8650,  91.7, 'chromium', NOW() - INTERVAL '4 days'),
  ('run_seed_005', 'failed', 14, 11, 3, 10200, 78.4, 'chromium', NOW() - INTERVAL '3 days'),
  ('run_seed_006', 'passed', 14, 14, 0, 8100,  93.2, 'firefox',  NOW() - INTERVAL '2 days'),
  ('run_seed_007', 'passed', 16, 15, 1, 9300,  89.5, 'webkit',   NOW() - INTERVAL '1 day'),
  ('run_seed_008', 'passed', 16, 16, 0, 7750,  96.1, 'chromium', NOW() - INTERVAL '12 hours')
ON CONFLICT (run_id) DO NOTHING;

INSERT INTO test_cases (run_id, test_name, status, duration_ms, selector_healed, fallback_selector, fallback_strategy) VALUES
  ('run_seed_001', 'should load sign up form',         'passed', 420,  FALSE, NULL,                         NULL),
  ('run_seed_001', 'should validate email format',     'passed', 380,  FALSE, NULL,                         NULL),
  ('run_seed_001', 'should advance to verify step',    'passed', 590,  TRUE,  '[aria-label="btn-signup"]', 'aria-label'),
  ('run_seed_002', 'should load sign up form',         'passed', 450,  FALSE, NULL,                         NULL),
  ('run_seed_002', 'should complete profile setup',    'failed', 8200, FALSE, NULL,                         NULL),
  ('run_seed_002', 'should show welcome screen',       'failed', 1200, FALSE, NULL,                         NULL),
  ('run_seed_004', 'should complete full onboarding',  'passed', 1840, TRUE,  'text=Save Profile',         'text'),
  ('run_seed_008', 'should complete full onboarding',  'passed', 1650, FALSE, NULL,                         NULL)
ON CONFLICT DO NOTHING;

INSERT INTO pipeline_runs (run_id, stages, overall_status, coverage_threshold, coverage_actual, gate_passed, created_at) VALUES
  ('pipe_seed_001', '[
    {"name":"Install","status":"passed","duration_ms":1180},
    {"name":"Lint","status":"passed","duration_ms":790},
    {"name":"Unit","status":"passed","duration_ms":2100,"coverage_actual":92.3,"gate_passed":true},
    {"name":"E2E","status":"passed","duration_ms":4320},
    {"name":"Deploy","status":"passed","duration_ms":1480}
  ]', 'passed', 80, 92.3, TRUE, NOW() - INTERVAL '2 days'),
  ('pipe_seed_002', '[
    {"name":"Install","status":"passed","duration_ms":1050},
    {"name":"Lint","status":"passed","duration_ms":820},
    {"name":"Unit","status":"passed","duration_ms":1980,"coverage_actual":67.1,"gate_passed":false},
    {"name":"E2E","status":"skipped"},
    {"name":"Deploy","status":"skipped"}
  ]', 'failed', 80, 67.1, FALSE, NOW() - INTERVAL '1 day')
ON CONFLICT (run_id) DO NOTHING;
