import { test, expect, type Page } from '@playwright/test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = resolve(__dirname, '..', 'fixtures');

async function uploadAndConfirm(page: Page, fixture: string) {
  await page.goto('/upload');
  await page.getByTestId('csv-file-input').setInputFiles(resolve(FIXTURES, fixture));
  await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /continue · detect subscriptions/i }).click();
  await expect(page.getByRole('heading', { name: /possible subscription/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /continue to dashboard/i }).click();
}

test.describe('Dashboard', () => {
  test('renders stats, category breakdown, and renewals after upload → review', async ({ page }) => {
    await uploadAndConfirm(page, 'chase_2024.csv');

    await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible();
    await expect(page.getByText(/monthly spend/i)).toBeVisible();
    await expect(page.getByText(/annual run-rate/i)).toBeVisible();
    await expect(page.getByText(/active subscriptions/i).first()).toBeVisible();

    await expect(page.getByText(/by category/i)).toBeVisible();
    await expect(page.getByText(/upcoming renewals · 30 days/i)).toBeVisible();
    await expect(page.getByText(/what this costs you/i)).toBeVisible();
  });

  test('displays an empty state when the dashboard is reached with no parsed data', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /nothing on the dashboard yet/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /start by uploading/i })).toBeVisible();
  });

  test('switching sort order keeps the table populated', async ({ page }) => {
    await uploadAndConfirm(page, 'chase_2024.csv');
    await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible();

    const sort = page.getByRole('combobox', { name: /sort subscriptions/i });
    await sort.selectOption('alphabetical');
    // At least one merchant row must still be visible.
    await expect(page.getByText('Adobe Creative Cloud').first()).toBeVisible();
  });
});

test.describe('privacy invariant — dashboard flow', () => {
  test('zero external requests through the full upload → review → dashboard flow', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy();
    const origin = new URL(baseURL!).origin;
    const offenders: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:')) {
        offenders.push(`[${req.resourceType()}] ${url}`);
      }
    });

    await uploadAndConfirm(page, 'chase_2024.csv');
    await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible();

    expect(offenders, `Unexpected external requests: ${offenders.join(', ')}`).toEqual([]);
  });
});
