import { test, expect, type Page } from '@playwright/test';


function uniqueEmail(): string {
  return `profile-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

const PASSWORD = 'correct-password-123';

async function signUpFromHome(page: Page, email: string): Promise<void> {
  await page.goto('/');
  await page.locator('#user-btn').click();
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.locator('#signup-email').fill(email);
  await page.locator('#signup-password').fill(PASSWORD);
  await page.locator('#signup-confirm').fill(PASSWORD);
  await page.locator('#signup-submit').click();
  await expect(page.locator('#auth-modal')).toBeHidden();
}

async function expectRedirectedHome(page: Page): Promise<void> {
  await expect(async () => {
    expect(page.url()).not.toContain('/profile');
  }).toPass({ timeout: 10_000 });
}

test('redirects to / when signed out', async ({ page }) => {
  await page.goto('/profile');
  await expectRedirectedHome(page);
});

test('shows account details and course progress without provider jargon', async ({ page }) => {
  const email = uniqueEmail();
  await signUpFromHome(page, email);

  await page.goto('/profile');
  await expect(page.locator('#prof-name')).not.toHaveText('Friend');
  await expect(page.locator('#prof-email')).toHaveText(email);
  await expect(page.getByText('Provider:', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Start learning' })).toHaveAttribute('href', '/courseone');
  await expect(page.locator('#joined-at')).not.toHaveText('—');

  await expect(page.locator('#mods-done')).toHaveText('0');
  await expect(page.locator('#mods-total')).toHaveText(/4|6/); // dp-fallback (4) or legacy6 (6) depending on prior state
  await expect(page.locator('#pct-text')).toHaveText('0%');

});

test('sign out redirects to /', async ({ page }) => {
  const email = uniqueEmail();
  await signUpFromHome(page, email);
  await page.goto('/profile');

  await page.locator('#logout-btn').click();
  await expectRedirectedHome(page);
});
