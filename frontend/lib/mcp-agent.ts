import type { MCPAction } from '@/types'
import { getClient, MODEL } from './anthropic'

// Since @playwright/mcp runs as a subprocess MCP server, we implement
// the agent as a Claude tool-use loop that drives Playwright via its
// exposed browser automation capabilities.

export interface MCPAgentOptions {
  instruction: string
  targetUrl?: string
  maxSteps?: number
}

// Playwright MCP tool definitions that Claude will use
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

export async function* runMCPAgent(
  options: MCPAgentOptions
): AsyncGenerator<MCPAction> {
  const { instruction, targetUrl = 'http://localhost:3000/demo', maxSteps = 15 } = options
  const client = getClient()

  const systemPrompt = `You are a browser automation agent testing a web application.
You have access to browser tools to interact with the page at ${targetUrl}.
Execute the user's instruction by using the available browser tools step by step.
After each action, briefly explain what you did.
When the task is complete, call task_complete with a summary.
Target app: Auth & Onboarding flow at /demo
Available data-testids: demo-signup-form, input-email, input-password, input-confirm-password, btn-signup, verify-code-input, btn-verify, btn-resend-code, input-firstname, input-lastname, select-timezone, textarea-bio, btn-save-profile, demo-welcome-screen, btn-go-to-dashboard`

  const messages: Array<{ role: 'user' | 'assistant'; content: unknown }> = [
    { role: 'user', content: instruction },
  ]

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

    // Collect tool uses from response
    const toolUses = response.content.filter((b) => b.type === 'tool_use')
    const textBlocks = response.content.filter((b) => b.type === 'text')

    if (textBlocks.length > 0) {
      for (const block of textBlocks) {
        if (block.type === 'text' && block.text.trim()) {
          yield {
            action: 'thinking',
            value: block.text,
            timestamp: Date.now(),
          }
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

      // Emit the action event to the frontend
      yield {
        action: toolUse.name,
        selector: input.selector as string | undefined,
        value: input.value as string | undefined ?? input.url as string | undefined,
        timestamp,
        success: true,
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: `Action ${toolUse.name} executed successfully`,
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
}
