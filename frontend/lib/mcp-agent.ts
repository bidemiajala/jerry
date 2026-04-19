import { chromium } from 'playwright'
import type { Page, Browser } from 'playwright'
import type { MCPAction } from '@/types'
import { getClient, MODEL } from './anthropic'

export interface MCPAgentOptions {
  instruction: string
  targetUrl?: string
  maxSteps?: number
}

const PLAYWRIGHT_TOOLS = [
  {
    name: 'browser_navigate',
    description: 'Navigate to a URL in the browser',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The URL to navigate to' },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_click',
    description: 'Click on an element identified by a CSS selector or text',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector or data-testid of the element' },
        text: { type: 'string', description: 'Visible text of the element to click' },
      },
    },
  },
  {
    name: 'browser_fill',
    description: 'Fill an input field with a value',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector of the input' },
        value: { type: 'string', description: 'Value to fill' },
      },
      required: ['selector', 'value'],
    },
  },
  {
    name: 'browser_select',
    description: 'Select an option from a dropdown',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector of the select element' },
        value: { type: 'string', description: 'Option value to select' },
      },
      required: ['selector', 'value'],
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page',
    input_schema: {
      type: 'object' as const,
      properties: {
        description: { type: 'string', description: 'Description of what to capture' },
      },
    },
  },
  {
    name: 'browser_wait',
    description: 'Wait for an element or condition',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'Selector to wait for' },
        timeout: { type: 'number', description: 'Timeout in milliseconds' },
      },
    },
  },
  {
    name: 'browser_get_text',
    description: 'Get the text content of an element',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector of the element' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'task_complete',
    description: 'Signal that the task is complete',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: { type: 'string', description: 'Summary of actions taken' },
      },
      required: ['summary'],
    },
  },
]

async function executeTool(page: Page, name: string, input: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case 'browser_navigate': {
        await page.goto(input.url as string, { waitUntil: 'domcontentloaded', timeout: 15000 })
        return `Navigated to ${input.url}`
      }
      case 'browser_click': {
        if (input.selector) {
          await page.click(input.selector as string, { timeout: 10000 })
          return `Clicked element: ${input.selector}`
        } else if (input.text) {
          await page.getByText(input.text as string).first().click({ timeout: 10000 })
          return `Clicked element with text: ${input.text}`
        }
        return 'No selector or text provided'
      }
      case 'browser_fill': {
        await page.fill(input.selector as string, input.value as string, { timeout: 10000 })
        return `Filled ${input.selector} with value`
      }
      case 'browser_select': {
        await page.selectOption(input.selector as string, input.value as string, { timeout: 10000 })
        return `Selected ${input.value} in ${input.selector}`
      }
      case 'browser_screenshot': {
        const buf = await page.screenshot({ type: 'png' })
        return `Screenshot taken (${buf.length} bytes). Current URL: ${page.url()}`
      }
      case 'browser_wait': {
        if (input.selector) {
          await page.waitForSelector(input.selector as string, { timeout: (input.timeout as number) ?? 10000 })
          return `Element ${input.selector} is visible`
        }
        await page.waitForTimeout(Math.min((input.timeout as number) ?? 1000, 5000))
        return 'Wait completed'
      }
      case 'browser_get_text': {
        const text = await page.textContent(input.selector as string, { timeout: 10000 })
        return `Text content: "${text?.trim() ?? ''}"`
      }
      default:
        return `Unknown tool: ${name}`
    }
  } catch (err) {
    return `Error: ${(err as Error).message}`
  }
}

export async function* runMCPAgent(
  options: MCPAgentOptions
): AsyncGenerator<MCPAction> {
  const { instruction, targetUrl = 'http://localhost:3000/demo', maxSteps = 8 } = options
  const client = getClient()

  const systemPrompt = `You are a browser automation agent testing a web application.
You have access to browser tools to interact with the page.
Execute the user's instruction by using the available browser tools step by step.
After each action, briefly explain what you did and what you observed.
When the task is complete, call task_complete with a summary.
Target app: Auth & Onboarding flow at ${targetUrl}
Available data-testids: demo-signup-form, input-email, input-password, input-confirm-password, btn-signup, verify-code-input, btn-verify, btn-resend-code, input-firstname, input-lastname, select-timezone, textarea-bio, btn-save-profile, demo-welcome-screen, btn-go-to-dashboard
Use data-testid selectors like: [data-testid="btn-signup"]`

  const messages: Array<{ role: 'user' | 'assistant'; content: unknown }> = [
    { role: 'user', content: instruction },
  ]

  let browser: Browser | null = null

  try {
    browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()

    let steps = 0

    while (steps < maxSteps) {
      steps++

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        tools: PLAYWRIGHT_TOOLS,
        messages: messages as Parameters<typeof client.messages.create>[0]['messages'],
      })

      const toolUses = response.content.filter((b) => b.type === 'tool_use')
      const textBlocks = response.content.filter((b) => b.type === 'text')

      for (const block of textBlocks) {
        if (block.type === 'text' && block.text.trim()) {
          yield {
            action: 'thinking',
            value: block.text,
            timestamp: Date.now(),
          }
        }
      }

      if (toolUses.length === 0 || response.stop_reason === 'end_turn') {
        break
      }

      const toolResults: unknown[] = []

      for (const toolUse of toolUses) {
        if (toolUse.type !== 'tool_use') continue

        const input = toolUse.input as Record<string, unknown>
        const timestamp = Date.now()

        if (toolUse.name === 'task_complete') {
          yield {
            action: 'complete',
            value: input.summary as string,
            timestamp,
            success: true,
          }
          return
        }

        const result = await executeTool(page, toolUse.name, input)
        const success = !result.startsWith('Error:')

        yield {
          action: toolUse.name,
          selector: input.selector as string | undefined,
          value: input.value as string | undefined ?? input.url as string | undefined,
          timestamp,
          success,
          result,
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        })
      }

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })
    }

    yield {
      action: 'complete',
      value: 'Agent reached max steps',
      timestamp: Date.now(),
      success: true,
    }
  } finally {
    await browser?.close()
  }
}
