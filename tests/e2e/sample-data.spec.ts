import { test, expect } from '@playwright/test';

test.describe('Try with sample data', () => {
  test('loads the bundled CSV and lands on the mapping screen', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.getByRole('heading', { name: /drop in a csv/i })).toBeVisible();
    await page.getByTestId('load-sample-csv').click();
    await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/1,184 rows/i)).toBeVisible();
  });

  test('does not violate the privacy invariant when loading sample data', async ({ page, baseURL }) => {
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
    await page.getByTestId('load-sample-csv').click();
    await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({
      timeout: 15_000,
    });

    expect(offenders, `Unexpected external requests: ${offenders.join(', ')}`).toEqual([]);
  });
});
