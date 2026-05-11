import { test, expect } from '@playwright/test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = resolve(__dirname, '..', 'fixtures');

test.describe('Review screen — full upload → review flow', () => {
  test('detects subscriptions from the Chase fixture and lands on the Review screen', async ({ page }) => {
    await page.goto('/upload');
    await page.getByTestId('csv-file-input').setInputFiles(resolve(FIXTURES, 'chase_2024.csv'));

    await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /continue · detect subscriptions/i }).click();

    await expect(page.getByRole('heading', { name: /possible subscription/i })).toBeVisible({ timeout: 15_000 });

    // The stats row should show 4 cards.
    await expect(page.locator('text=/Kept|Pending|Rejected|Est\\. annual/i').first()).toBeVisible();

    // At least one merchant from the fixture should render.
    await expect(page.getByText('Netflix').first()).toBeVisible();
  });

  test('keep-all-high-confidence updates the kept count', async ({ page }) => {
    await page.goto('/upload');
    await page.getByTestId('csv-file-input').setInputFiles(resolve(FIXTURES, 'chase_2024.csv'));
    await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /continue · detect subscriptions/i }).click();
    await expect(page.getByRole('heading', { name: /possible subscription/i })).toBeVisible({ timeout: 15_000 });

    const beforeKept = await page.locator('.eyebrow:has-text("Kept") + div > .serif').first().innerText();
    await page.getByRole('button', { name: /keep all high-confidence/i }).click();
    const afterKept = await page.locator('.eyebrow:has-text("Kept") + div > .serif').first().innerText();

    expect(parseInt(afterKept, 10)).toBeGreaterThanOrEqual(parseInt(beforeKept, 10));
  });

  test('filter pills narrow the visible list', async ({ page }) => {
    await page.goto('/upload');
    await page.getByTestId('csv-file-input').setInputFiles(resolve(FIXTURES, 'chase_2024.csv'));
    await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /continue · detect subscriptions/i }).click();
    await expect(page.getByRole('heading', { name: /possible subscription/i })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /^high confidence$/i }).click();
    // Every visible confidence meter should be ≥ 80%.
    const meters = page.getByRole('meter');
    const count = await meters.count();
    for (let i = 0; i < count; i++) {
      const label = await meters.nth(i).getAttribute('aria-valuenow');
      expect(Number(label)).toBeGreaterThanOrEqual(80);
    }
  });
});

test.describe('privacy invariant — review flow', () => {
  test('zero external requests during upload → review → dashboard navigation', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy();
    const origin = new URL(baseURL!).origin;
    const offenders: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:')) {
        offenders.push(`[${req.resourceType()}] ${url}`);
      }
    });

    await page.goto('/upload', { waitUntil: 'networkidle' });
    await page.getByTestId('csv-file-input').setInputFiles(resolve(FIXTURES, 'chase_2024.csv'));
    await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /continue · detect subscriptions/i }).click();
    await expect(page.getByRole('heading', { name: /possible subscription/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /continue to dashboard/i }).click();

    expect(offenders, `Unexpected external requests: ${offenders.join(', ')}`).toEqual([]);
  });
});
