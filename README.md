# Jerry — AI-powered QA Engineering Showcase

Jerry is a working demonstration of what quality engineering looks like when AI enters the workflow. It shows how tests can write themselves from plain English or Gherkin, how selectors can heal when the UI changes, how an AI agent can navigate a real app like a human, and how non-deterministic outputs can be validated semantically. Every run, generation, validation, and Lighthouse audit is persisted in Supabase and reflected on the dashboard in real time.

---

## Features

| Feature | What it does |
|---------|-------------|
| **Self-healing tests** | Playwright fixture with a 4-strategy fallback chain (data-testid → ARIA role → visible text → CSS class). Healed selectors are recorded and shown in the Test Runner UI. |
| **AI test generator** | Describe what to test in plain English or paste a Gherkin scenario — Claude generates executable Playwright TypeScript and you can run it immediately. |
| **Playwright MCP agent** | Give a natural-language instruction; Jerry uses Claude's tool-use loop to drive a real headless browser, feeding actual DOM results back into each iteration. |
| **Lighthouse quality gates** | Run live Lighthouse audits against any URL and enforce score thresholds (Performance, Accessibility, Best Practices, SEO). Results are persisted to Supabase. |
| **LLM-as-a-Judge** | Semantic similarity scoring for AI outputs. Claude compares expected vs actual responses and returns a 0–1 score with a PASS/FAIL verdict and explanation. |
| **Demo app** | A 4-step Auth & Onboarding flow (`/demo`) that serves as the target for all test automation. Includes a "Selector Break Mode" toggle to trigger self-healing live. |

---

## Tech stack

- **Frontend** — Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts
- **Tests** — Playwright with custom healing fixture
- **AI** — Anthropic Claude Haiku via the Anthropic SDK (streaming + tool use)
- **Database** — Supabase (PostgreSQL) — stores test runs, test cases, generated tests, MCP runs, LLM validations, Lighthouse reports
- **Deployment** — Vercel (serverless, with Playwright Chromium installed at build time)

---

## Repo structure

```
e2e-lab/
├── frontend/               # Next.js application
│   ├── app/                # Pages and API routes
│   │   ├── api/            # Route handlers (generate, validate, lighthouse, mcp, tests, pipeline)
│   │   └── (pages)/        # test-runner, test-generator, lighthouse, validation, demo
│   ├── components/         # UI components
│   │   ├── ui/             # Shared: TerminalCard, GlowButton, NeonBadge, HowItWorks, ThemeSwitcher
│   │   ├── dashboard/      # MetricWidget, charts, RecentRunsWidget
│   │   ├── demo/           # SignUpStep, VerifyEmailStep, ProfileSetupStep, WelcomeStep
│   │   ├── lighthouse/     # ScoreGauge, ThresholdConfig
│   │   └── test-runner/    # LiveLogFeed, HealingReport
│   └── lib/                # Shared logic: anthropic, supabase, playwright-runner, mcp-agent, rate-limiter, input-guard
├── playwright/             # Playwright test suites
│   ├── fixtures/           # healing-fixture.ts — self-healing locator wrapper
│   ├── tests/              # onboarding.spec.ts, self-healing.spec.ts, etc.
│   └── generated/          # Temp dir for AI-generated specs (gitkeep)
├── supabase/
│   └── migrations/         # 001_initial.sql, 002_additions.sql
└── vercel.json             # Build config with playwright install + function timeouts
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- An Anthropic API key

### Environment variables

Create `frontend/.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
PLAYWRIGHT_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000   # shows as a Lighthouse preset
```

### Database

Run migrations against your Supabase project:

```bash
# Using the Supabase CLI
supabase db push

# Or paste each file directly in the Supabase SQL editor:
# supabase/migrations/001_initial.sql
# supabase/migrations/002_additions.sql
```

### Run locally

```bash
# Install dependencies
cd frontend && npm install

# Start the dev server
npm run dev
# → http://localhost:3000
```

---

## Running tests

From the repo root (Playwright is installed at the monorepo level):

```bash
npx playwright test                          # all specs, chromium
npx playwright test --project=firefox        # specific browser
npx playwright test playwright/tests/onboarding.spec.ts  # single file
```

Or use the **Test Runner** page in the UI — it streams output in real time and shows healed selectors after the run.

### Self-healing demo

1. Open `/demo` in the browser
2. Toggle **Selector Break Mode** on — this removes `data-testid` from key buttons
3. Run `npx playwright test playwright/tests/self-healing.spec.ts`
4. The healing fixture falls back to ARIA labels and records the recovery
5. Check the **Healing** tab in the Test Runner UI

---

## Deploying

The app deploys to Vercel. `vercel.json` configures:

- **Build command**: `cd frontend && npm run build && npx playwright install chromium --with-deps` — installs Chromium so the Lighthouse and MCP routes work serverlessly
- **Function timeouts**: 60 s for Lighthouse/MCP, 120 s for test runs, 180 s for pipeline

```bash
vercel deploy
```

---

## Security

All AI-facing and browser-launching endpoints are protected:

| Endpoint | Rate limit |
|----------|-----------|
| `/api/generate` | 10 req / 5 min per IP |
| `/api/validate` | 20 req / 5 min per IP |
| `/api/mcp/execute` | 3 req / 15 min per IP |
| `/api/lighthouse` | 5 req / 15 min per IP |
| `/api/tests/run` + `/run-generated` | 5 req / 15 min per IP |

Additional mitigations:
- **Prompt injection detection** — regex patterns on all LLM-bound inputs (`ignore previous instructions`, delimiter injection, token flooding, etc.)
- **Input length limits** — requirements ≤ 2000 chars, MCP instructions ≤ 500 chars
- **SSRF protection** — Lighthouse URL input blocks all private IP ranges (127.x, 10.x, 172.16–31.x, 192.168.x, link-local, IPv6 loopback, `.internal`/`.local` hostnames)

---

## Licence

MIT
