import { NextRequest, NextResponse } from 'next/server'
import { singleCompletion } from '@/lib/anthropic'
import { insertAIValidation } from '@/lib/supabase'
import { MODEL } from '@/lib/anthropic'

const SYSTEM_PROMPT = `You are an impartial AI output evaluator. Your job is to compare an expected output with an actual output and assess semantic similarity.

Respond ONLY with valid JSON in this exact shape — no prose, no markdown, no code fences:
{
  "similarity_score": <number from 0.0 to 1.0>,
  "verdict": "pass" or "fail",
  "reasoning": "<2-3 sentence explanation of your assessment>",
  "differences": ["<specific difference 1>", "<specific difference 2>"]
}

Scoring guide:
- 0.9–1.0: Near-identical meaning, only surface rephrasing
- 0.75–0.89: Same core meaning, some details differ — verdict: pass
- 0.5–0.74: Partial overlap, significant omissions — verdict: fail
- 0.0–0.49: Different meaning or clearly wrong — verdict: fail

Threshold: score >= 0.75 = pass, score < 0.75 = fail`

export async function POST(req: NextRequest) {
  const { prompt, expected_output, actual_output } = await req.json()

  if (!expected_output?.trim() || !actual_output?.trim()) {
    return NextResponse.json({ error: 'expected_output and actual_output are required' }, { status: 400 })
  }

  const userMessage = `Context/Prompt: ${prompt ?? '(none)'}

Expected Output:
${expected_output}

Actual Output:
${actual_output}

Evaluate the semantic similarity between the expected and actual outputs.`

  try {
    const raw = await singleCompletion(SYSTEM_PROMPT, userMessage, 1024)

    let parsed: { similarity_score: number; verdict: string; reasoning: string; differences: string[] }
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Try to extract JSON from response
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: 'Failed to parse LLM response as JSON', raw }, { status: 422 })
      }
      parsed = JSON.parse(match[0])
    }

    const row = await insertAIValidation({
      prompt: prompt ?? '',
      expected_output,
      actual_output,
      similarity_score: parsed.similarity_score,
      verdict: parsed.verdict as 'pass' | 'fail',
      reasoning: parsed.reasoning,
      model: MODEL,
    })

    return NextResponse.json({
      ...parsed,
      id: row.id,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
