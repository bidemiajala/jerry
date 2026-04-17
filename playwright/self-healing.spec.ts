import { test, expect } from './fixtures/healing-fixture'

test.describe('Self-Healing Selector Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
  })

  test('heals when data-testid is missing — falls back to aria-label', async ({ page, healingPage }) => {
    // Inject a mutation that removes the data-testid from btn-signup
    // to simulate a selector break. Real healing: tries fallback strategies.
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="btn-signup"]')
      if (btn) {
        btn.removeAttribute('data-testid')
        btn.setAttribute('aria-label', 'btn-signup')
      }
    })

    // Fill in form so the button becomes active
    await page.getByTestId('input-email').fill('test@healing.io')
    await page.getByTestId('input-password').fill('TestPass123')
    await page.getByTestId('input-confirm-password').fill('TestPass123')

    // Use healing locator — primary testid is gone, should fall back to aria-label
    const result = await healingPage.locate('btn-signup', { timeout: 5000 })

    expect(result.healed).toBe(true)
    expect(result.strategy).toBe('aria-label')
    expect(result.locator).toBeTruthy()

    const records = healingPage.records()
    expect(records.length).toBeGreaterThan(0)
    expect(records[0].fallbackUsed).toBe(true)
    expect(records[0].fallbackStrategy).toBe('aria-label')
  })

  test('heals using text content fallback', async ({ page, healingPage }) => {
    // Remove data-testid and aria-label from btn-verify after navigating to step 2
    await page.getByTestId('input-email').fill('healer@test.io')
    await page.getByTestId('input-password').fill('TestPass123')
    await page.getByTestId('input-confirm-password').fill('TestPass123')
    await page.getByTestId('btn-signup').click()

    // Now on step 2 — strip testid from verify button
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="btn-verify"]')
      if (btn) btn.removeAttribute('data-testid')
    })

    await page.getByTestId('verify-code-input').fill('123456')

    // Healing: text fallback should find "Verify Email →"
    const result = await healingPage.locate('btn-verify', { timeout: 5000 })
    expect(result.healed).toBe(true)
  })

  test('uses primary selector when testid is intact', async ({ page, healingPage }) => {
    const result = await healingPage.locate('input-email')
    expect(result.healed).toBe(false)
    expect(result.strategy).toBe('data-testid')
  })
})
