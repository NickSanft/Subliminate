import { test, expect } from '@playwright/test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = resolve(__dirname, '..', 'fixtures');

test.describe('CSV upload flow', () => {
  test('drops a Chase CSV, auto-maps three columns, and renders the preview', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.getByRole('heading', { name: /drop in a csv/i })).toBeVisible();

    await page.getByTestId('csv-file-input').setInputFiles(resolve(FIXTURES, 'chase_2024.csv'));

    await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/1,184 rows/i)).toBeVisible();

    // Mapping selects exist and have the right roles.
    const selects = page.getByRole('combobox');
    await expect(selects.first()).toHaveValue('date');

    // Sign-convention row shows "negative values" by default for Chase.
    await expect(page.getByText(/negative values/i)).toBeVisible();
  });

  test('rejects a non-CSV file with a clear error message', async ({ page }) => {
    await page.goto('/upload');
    const html = Buffer.from('<html>not a csv</html>');
    await page
      .getByTestId('csv-file-input')
      .setInputFiles({ name: 'not-a-csv.html', mimeType: 'text/html', buffer: html });
    await expect(page.getByRole('alert')).toContainText(/doesn'?t look like a CSV/i);
  });

  test('the "Remember this mapping" checkbox is clickable and reflects the persistence-store toggle', async ({ page }) => {
    await page.goto('/upload');
    await page.getByTestId('csv-file-input').setInputFiles(resolve(FIXTURES, 'chase_2024.csv'));
    await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({ timeout: 15_000 });

    const checkbox = page.getByTestId('remember-mapping');
    await expect(checkbox).toBeEnabled();
    await expect(checkbox).not.toBeChecked();

    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('a generic-headers CSV still auto-maps and flags positive sign convention', async ({ page }) => {
    await page.goto('/upload');
    await page.getByTestId('csv-file-input').setInputFiles(resolve(FIXTURES, 'generic_2025.csv'));
    await expect(page.getByRole('heading', { name: /confirm the columns/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/positive values/i)).toBeVisible();
  });
});

test.describe('privacy invariant — upload flow', () => {
  test('zero external requests while uploading and mapping a CSV', async ({ page, baseURL }) => {
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

    expect(offenders, `Unexpected external requests: ${offenders.join(', ')}`).toEqual([]);
  });
});
