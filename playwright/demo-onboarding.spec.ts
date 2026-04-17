import { test, expect } from './fixtures/healing-fixture'

test.describe('Demo App — Auth & Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
  })

  test('displays step 1 sign-up form on load', async ({ page }) => {
    await expect(page.getByTestId('demo-signup-form')).toBeVisible()
    await expect(page.getByTestId('input-email')).toBeVisible()
    await expect(page.getByTestId('input-password')).toBeVisible()
    await expect(page.getByTestId('input-confirm-password')).toBeVisible()
    await expect(page.getByTestId('btn-signup')).toBeVisible()
    await expect(page.getByTestId('step-progress')).toBeVisible()
  })

  test('shows validation errors for invalid input', async ({ page }) => {
    await page.getByTestId('input-email').fill('not-an-email')
    await page.getByTestId('input-password').fill('short')
    await page.getByTestId('input-confirm-password').fill('mismatch')
    await page.getByTestId('btn-signup').click()

    await expect(page.getByTestId('error-email')).toBeVisible()
    await expect(page.getByTestId('error-password')).toBeVisible()
    await expect(page.getByTestId('error-confirm-password')).toBeVisible()
  })

  test('advances to step 2 after valid sign-up', async ({ page }) => {
    await page.getByTestId('input-email').fill('test@example.com')
    await page.getByTestId('input-password').fill('SecurePass123')
    await page.getByTestId('input-confirm-password').fill('SecurePass123')
    await page.getByTestId('btn-signup').click()

    await expect(page.getByTestId('demo-verify-form')).toBeVisible()
    await expect(page.getByTestId('verify-code-input')).toBeVisible()
  })

  test('advances to step 3 after email verification', async ({ page }) => {
    await page.getByTestId('input-email').fill('test@example.com')
    await page.getByTestId('input-password').fill('SecurePass123')
    await page.getByTestId('input-confirm-password').fill('SecurePass123')
    await page.getByTestId('btn-signup').click()

    await page.getByTestId('verify-code-input').fill('123456')
    await page.getByTestId('btn-verify').click()

    await expect(page.getByTestId('demo-profile-form')).toBeVisible()
    await expect(page.getByTestId('input-firstname')).toBeVisible()
    await expect(page.getByTestId('select-timezone')).toBeVisible()
  })

  test('completes full onboarding flow and shows welcome screen', async ({ page }) => {
    // Step 1
    await page.getByTestId('input-email').fill('qe@lab.io')
    await page.getByTestId('input-password').fill('StrongPass99')
    await page.getByTestId('input-confirm-password').fill('StrongPass99')
    await page.getByTestId('btn-signup').click()

    // Step 2
    await page.getByTestId('verify-code-input').fill('654321')
    await page.getByTestId('btn-verify').click()

    // Step 3
    await page.getByTestId('input-firstname').fill('Quality')
    await page.getByTestId('input-lastname').fill('Engineer')
    await page.getByTestId('select-timezone').selectOption('America/New_York')
    await page.getByTestId('textarea-bio').fill('Senior QE at QE Lab')
    await page.getByTestId('btn-save-profile').click()

    // Step 4 — Welcome
    await expect(page.getByTestId('demo-welcome-screen')).toBeVisible()
    await expect(page.getByTestId('welcome-username')).toContainText('Quality Engineer')
    await expect(page.getByTestId('btn-go-to-dashboard')).toBeVisible()
  })

  test('resend code button works on verify step', async ({ page }) => {
    await page.getByTestId('input-email').fill('test@example.com')
    await page.getByTestId('input-password').fill('SecurePass123')
    await page.getByTestId('input-confirm-password').fill('SecurePass123')
    await page.getByTestId('btn-signup').click()

    await page.getByTestId('btn-resend-code').click()
    await expect(page.getByTestId('verify-success-message')).toBeVisible()
  })
})
