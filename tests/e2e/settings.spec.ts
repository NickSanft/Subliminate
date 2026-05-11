import { test, expect, type Page } from '@playwright/test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = resolve(__dirname, '..', 'fixtures');

async function uploadAndLandOnDashboard(page: Page) {
  await page.goto('/upload');
  await page.getByTestId('csv-file-input').setInputFiles(resolve(FIXTURES, 'chase_2024.csv'));
  await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /continue · detect subscriptions/i }).click();
  await expect(page.getByRole('heading', { name: /possible subscription/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /continue to dashboard/i }).click();
  await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible();
}

async function navigateTo(page: Page, label: RegExp | string) {
  await page.getByRole('link', { name: label }).click();
}

test.describe('Settings page', () => {
  test('renders all sections with persistence off by default', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /data & preferences/i })).toBeVisible();
    await expect(page.getByRole('switch', { name: /remember my data/i })).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText(/off · default/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /wipe everything/i })).toBeVisible();
  });

  test('persistence toggle opens a confirmation modal that the user must accept', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('switch', { name: /remember my data/i }).click();
    const dialog = page.getByRole('dialog', { name: /remember my data between sessions/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/no encryption-at-rest/i)).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    // Toggle should still be off after cancel.
    await expect(page.getByRole('switch', { name: /remember my data/i })).toHaveAttribute('aria-checked', 'false');
  });

  test('confirming persistence flips the toggle on', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('switch', { name: /remember my data/i }).click();
    await page.getByRole('button', { name: /i understand — turn it on/i }).click();
    await expect(page.getByRole('switch', { name: /remember my data/i })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText(/^on$/i).first()).toBeVisible();
  });

  test('persisted data survives a page reload', async ({ page }) => {
    await uploadAndLandOnDashboard(page);
    await navigateTo(page, /^Settings/);
    await page.getByRole('switch', { name: /remember my data/i }).click();
    await page.getByRole('button', { name: /i understand — turn it on/i }).click();

    // Give the persistence subscription one tick to write.
    await page.waitForTimeout(150);
    await page.reload();
    await expect(page.getByRole('heading', { name: /data & preferences/i })).toBeVisible();
    // Persistence toggle is remembered.
    await expect(page.getByRole('switch', { name: /remember my data/i })).toHaveAttribute('aria-checked', 'true');
  });

  test('wipe button clears state and resets the toggle', async ({ page }) => {
    await uploadAndLandOnDashboard(page);
    await navigateTo(page, /^Settings/);
    await page.getByRole('switch', { name: /remember my data/i }).click();
    await page.getByRole('button', { name: /i understand — turn it on/i }).click();
    await expect(page.getByRole('switch', { name: /remember my data/i })).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: /wipe everything/i }).click();
    await expect(page.getByRole('dialog', { name: /wipe everything/i })).toBeVisible();
    await page.getByRole('button', { name: /wipe everything/i }).last().click();
    await expect(page.getByRole('switch', { name: /remember my data/i })).toHaveAttribute('aria-checked', 'false');
  });
});

test.describe('privacy invariant — Settings flow', () => {
  test('toggling persistence + reloading produces zero non-self requests', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy();
    const origin = new URL(baseURL!).origin;
    const offenders: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:')) {
        offenders.push(`[${req.resourceType()}] ${url}`);
      }
    });

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await page.getByRole('switch', { name: /remember my data/i }).click();
    await page.getByRole('button', { name: /i understand — turn it on/i }).click();
    await page.waitForTimeout(150);
    await page.reload();
    await expect(page.getByRole('heading', { name: /data & preferences/i })).toBeVisible();

    expect(offenders, `Unexpected external requests: ${offenders.join(', ')}`).toEqual([]);
  });
});
