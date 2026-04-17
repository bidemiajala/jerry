import { NextRequest } from 'next/server'
import { streamCompletion } from '@/lib/anthropic'
import { insertGeneratedTest } from '@/lib/supabase'
import { MODEL } from '@/lib/anthropic'

const SYSTEM_PROMPT = `You are a Playwright TypeScript test generator for a QE engineering platform.

Output ONLY valid TypeScript code — no markdown fences, no explanation text, no comments unless they explain non-obvious logic.

Rules:
- Import from @playwright/test
- Use data-testid selectors via page.getByTestId() wherever possible
- Target base URL: process.env.PLAYWRIGHT_BASE_URL or 'http://localhost:3000'
- The main demo app is at /demo — it has a 4-step Auth & Onboarding flow
- Available data-testids: demo-signup-form, input-email, input-password, input-confirm-password, btn-signup, verify-code-input, btn-verify, btn-resend-code, input-firstname, input-lastname, select-timezone, textarea-bio, btn-save-profile, demo-welcome-screen, welcome-username, btn-go-to-dashboard
- Use test.describe() blocks
- Include beforeEach with page.goto() when appropriate
- Use async/await throughout
- Use expect() assertions after each meaningful action`

export async function POST(req: NextRequest) {
  const { requirement } = await req.json()

  if (!requirement?.trim()) {
    return new Response(JSON.stringify({ error: 'requirement is required' }), { status: 400 })
  }

  const encoder = new TextEncoder()
  let fullCode = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = streamCompletion(SYSTEM_PROMPT, requirement)

        claudeStream.on('text', (text) => {
          fullCode += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`))
        })

        await claudeStream.finalMessage()

        // Persist to Supabase
        try {
          await insertGeneratedTest({
            requirement,
            generated_code: fullCode,
            model: MODEL,
          })
        } catch {
          // Non-fatal — still return the generated code
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
