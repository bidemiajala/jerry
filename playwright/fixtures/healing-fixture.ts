import { test as base, expect } from '@playwright/test'
import { HealingLocator, HealingRecord } from '../../frontend/lib/self-healing'

interface HealingFixtures {
  healingPage: {
    locate: (testId: string, options?: { timeout?: number }) => ReturnType<HealingLocator['locate']>
    records: () => HealingRecord[]
  }
}

export const test = base.extend<HealingFixtures>({
  healingPage: async ({ page }, use) => {
    const healer = new HealingLocator(page)

    const testName = test.info().title

    const healingPage = {
      locate: async (testId: string, options?: { timeout?: number }) => {
        const result = await healer.locate(testId, options)
        healer.recordHealing(testName, `[data-testid="${testId}"]`, result)
        return result
      },
      records: () => healer.getRecords(),
    }

    await use(healingPage)

    // After test: push healing records to Supabase via API
    const records = healer.getRecords()
    const healedRecords = records.filter((r) => r.fallbackUsed)

    if (healedRecords.length > 0) {
      const appUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
      for (const record of healedRecords) {
        try {
          await fetch(`${appUrl}/api/tests/results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              run_id: `heal_${Date.now()}`,
              test_name: testName,
              status: 'passed',
              selector_healed: true,
              fallback_selector: record.fallbackSelector,
              fallback_strategy: record.fallbackStrategy,
            }),
          }).catch(() => null) // non-fatal
        } catch {
          // non-fatal
        }
      }
    }
  },
})

export { expect }
