import { createClient } from '@supabase/supabase-js'
import type { TestRun, TestCase, GeneratedTest, AIValidation, PipelineRun, LighthouseReport, MCPRun, MCPAction } from '@/types'

let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
    _client = createClient(url, key)
  }
  return _client
}

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

// --- test_runs ---

export async function insertTestRun(data: Omit<TestRun, 'id' | 'created_at'>) {
  const { data: row, error } = await getServiceClient()
    .from('test_runs')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as TestRun
}

export async function updateTestRun(runId: string, data: Partial<TestRun>) {
  const { error } = await getServiceClient()
    .from('test_runs')
    .update(data)
    .eq('run_id', runId)
  if (error) throw error
}

export async function getTestRuns(limit = 20, browser?: string): Promise<TestRun[]> {
  let query = getSupabaseClient()
    .from('test_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (browser) query = query.eq('browser', browser)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as TestRun[]
}

// --- test_cases ---

export async function insertTestCase(data: Omit<TestCase, 'id' | 'created_at'>) {
  const { data: row, error } = await getServiceClient()
    .from('test_cases')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as TestCase
}

export async function getTestCases(runId: string): Promise<TestCase[]> {
  const { data, error } = await getSupabaseClient()
    .from('test_cases')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as TestCase[]
}

export async function getHealedCount(): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from('test_cases')
    .select('*', { count: 'exact', head: true })
    .eq('selector_healed', true)
  if (error) throw error
  return count ?? 0
}

// --- generated_tests ---

export async function insertGeneratedTest(data: Omit<GeneratedTest, 'id' | 'created_at'>) {
  const { data: row, error } = await getServiceClient()
    .from('generated_tests')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as GeneratedTest
}

// --- ai_validations ---

export async function insertAIValidation(data: Omit<AIValidation, 'id' | 'created_at'>) {
  const { data: row, error } = await getServiceClient()
    .from('ai_validations')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as AIValidation
}

// --- pipeline_runs ---

export async function insertPipelineRun(data: Omit<PipelineRun, 'id' | 'created_at'>) {
  const { data: row, error } = await getServiceClient()
    .from('pipeline_runs')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as PipelineRun
}

export async function updatePipelineRun(runId: string, data: Partial<PipelineRun>) {
  const { error } = await getServiceClient()
    .from('pipeline_runs')
    .update(data)
    .eq('run_id', runId)
  if (error) throw error
}

// --- lighthouse_reports ---

export async function insertLighthouseReport(data: Omit<LighthouseReport, 'id' | 'created_at'>) {
  const { data: row, error } = await getServiceClient()
    .from('lighthouse_reports')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as LighthouseReport
}

export async function getLighthouseReports(limit = 10): Promise<LighthouseReport[]> {
  const { data, error } = await getSupabaseClient()
    .from('lighthouse_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as LighthouseReport[]
}

// --- mcp_runs ---

export async function insertMCPRun(data: Omit<MCPRun, 'id' | 'created_at'>) {
  const { data: row, error } = await getServiceClient()
    .from('mcp_runs')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as MCPRun
}

export async function updateMCPRun(id: string, actions: MCPAction[], overall_success: boolean) {
  const { error } = await getServiceClient()
    .from('mcp_runs')
    .update({ actions, overall_success })
    .eq('id', id)
  if (error) throw error
}
