import { NextRequest } from 'next/server'
import { streamCompletion, MODEL } from '@/lib/anthropic'
import { insertGeneratedTest } from '@/lib/supabase'
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from '@/lib/rate-limiter'
import { guardText, guardEnum } from '@/lib/input-guard'
import type { GenerationMode } from '@/types'

const NATURAL_SYSTEM_PROMPT = `You are an expert Playwright TypeScript test engineer working on a project called Jerry.

Output ONLY valid TypeScript code — no markdown fences, no explanation text, no comments unless they explain non-obvious logic.

Rules:
- Import from @playwright/test
- Use data-testid selectors via page.getByTestId() wherever possible
- Target base URL: process.env.PLAYWRIGHT_BASE_URL or 'http://localhost:3000'
- The demo app is at /demo — it has a 4-step Auth & Onboarding flow
- Available data-testids: demo-signup-form, input-email, input-password, input-confirm-password, btn-signup, verify-code-input, btn-verify, btn-resend-code, input-firstname, input-lastname, select-timezone, textarea-bio, btn-save-profile, demo-welcome-screen, welcome-username, btn-go-to-dashboard
- Use test.describe() blocks
- Include beforeEach with page.goto() when appropriate
- Use async/await throughout
- Use expect() assertions after each meaningful action`

const GHERKIN_SYSTEM_PROMPT = `You are an expert Playwright TypeScript test engineer. Convert Gherkin BDD scenarios into executable Playwright TypeScript tests.

Output ONLY valid TypeScript code — no markdown fences, no prose, no explanation.

Rules:
- Import from @playwright/test
- Map Given → test setup / navigation / page.goto()
- Map When → user actions (click, fill, select)
- Map Then → expect() assertions
- Use data-testid selectors via page.getByTestId() wherever possible
- Wrap each Scenario in a test() block inside a test.describe() named after the Feature
- Use the Scenario title as the test() description
- Use async/await throughout
- Target base URL: process.env.PLAYWRIGHT_BASE_URL or 'http://localhost:3000'
- If a step references UI elements not specified, use sensible selectors and add a brief inline comment`

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(ip, 'generate', LIMITS.generate)
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

  const body = await req.json().catch(() => ({}))
  const mode = guardEnum(body.mode, ['natural', 'gherkin'] as const, 'natural') as GenerationMode
  const requirementGuard = guardText(body.requirement, 2000)
  if (!requirementGuard.ok) {
    return new Response(JSON.stringify({ error: requirementGuard.error }), { status: requirementGuard.status })
  }
  const requirement = requirementGuard.value

  const systemPrompt = mode === 'gherkin' ? GHERKIN_SYSTEM_PROMPT : NATURAL_SYSTEM_PROMPT
  const encoder = new TextEncoder()
  let fullCode = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = streamCompletion(systemPrompt, requirement)

        claudeStream.on('text', (text) => {
          fullCode += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`))
        })

        await claudeStream.finalMessage()

        try {
          await insertGeneratedTest({ requirement, generated_code: fullCode, model: MODEL, source: mode })
        } catch {
          // Non-fatal
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`))
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
