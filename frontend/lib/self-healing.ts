import type { Page, Locator } from '@playwright/test'

export type HealingStrategy = 'data-testid' | 'aria-label' | 'text' | 'role-name' | 'css-fallback'

export interface HealingResult {
  locator: Locator
  strategy: HealingStrategy
  healed: boolean
  fallbackSelector: string | null
}

export interface HealingRecord {
  testName: string
  primarySelector: string
  fallbackUsed: boolean
  fallbackSelector: string | null
  fallbackStrategy: HealingStrategy | null
}

export class HealingLocator {
  private records: HealingRecord[] = []

  constructor(private page: Page) {}

  async locate(
    testId: string,
    options: { timeout?: number } = {}
  ): Promise<HealingResult> {
    const timeout = options.timeout ?? 3000

    const strategies: Array<{ selector: string; strategy: HealingStrategy }> = [
      { selector: `[data-testid="${testId}"]`, strategy: 'data-testid' },
      { selector: `[aria-label="${testId}"]`, strategy: 'aria-label' },
      { selector: `text=${testId}`, strategy: 'text' },
      { selector: `[data-testid*="${testId}"]`, strategy: 'css-fallback' },
    ]

    for (const { selector, strategy } of strategies) {
      try {
        const locator = this.page.locator(selector).first()
        await locator.waitFor({ state: 'attached', timeout })
        const healed = strategy !== 'data-testid'
        return {
          locator,
          strategy,
          healed,
          fallbackSelector: healed ? selector : null,
        }
      } catch {
        continue
      }
    }

    // Last resort: role-based
    try {
      const locator = this.page.getByRole('button', { name: new RegExp(testId, 'i') })
      await locator.waitFor({ state: 'attached', timeout })
      return {
        locator,
        strategy: 'role-name',
        healed: true,
        fallbackSelector: `role=button[name~=${testId}]`,
      }
    } catch {
      throw new Error(`HealingLocator: could not find element with testId "${testId}" using any strategy`)
    }
  }

  recordHealing(testName: string, primarySelector: string, result: HealingResult) {
    this.records.push({
      testName,
      primarySelector,
      fallbackUsed: result.healed,
      fallbackSelector: result.fallbackSelector,
      fallbackStrategy: result.healed ? result.strategy : null,
    })
  }

  getRecords(): HealingRecord[] {
    return this.records
  }

  clearRecords() {
    this.records = []
  }
}
