import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export const MODEL = 'claude-haiku-4-5-20251001'

export async function singleCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048
): Promise<string> {
  const client = getClient()
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text
}

export function streamCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
) {
  const client = getClient()
  return client.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
}
