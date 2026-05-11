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

// In-app navigation via the sidebar links. Critical: `page.goto()` does a
// hard reload which clears the in-memory Zustand store, so we have to
// SPA-route inside the app for any test that depends on detection state.
async function navigateTo(page: Page, label: RegExp | string) {
  await page.getByRole('link', { name: label }).click();
}

test.describe('Subscription detail', () => {
  test('clicking a dashboard row navigates to the detail page', async ({ page }) => {
    await uploadAndLandOnDashboard(page);

    await page.getByText('Adobe Creative Cloud').first().click();
    await expect(page.getByRole('heading', { name: 'Adobe Creative Cloud' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/charge history/i)).toBeVisible();
    await expect(page.getByText(/cadence/i).first()).toBeVisible();
  });

  test('mark canceled moves the subscription into the Canceled list', async ({ page }) => {
    await uploadAndLandOnDashboard(page);
    await page.getByText('Netflix').first().click();
    await expect(page.getByRole('heading', { name: 'Netflix' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /mark as canceled/i }).click();

    await expect(page.getByRole('button', { name: /reopen/i })).toBeVisible();

    await navigateTo(page, /^Canceled/);
    await expect(page.getByRole('heading', { name: /^canceled$/i })).toBeVisible();
    await expect(page.getByText('Netflix').first()).toBeVisible();
  });

  test('notes persist across navigation within the session', async ({ page }) => {
    await uploadAndLandOnDashboard(page);
    // Pick a sub guaranteed to be in the dashboard top 10 (Adobe is #1
    // by annual cost in the fixture).
    await page.getByText('Adobe Creative Cloud').first().click();
    await expect(page.getByRole('heading', { name: 'Adobe Creative Cloud' })).toBeVisible({ timeout: 10_000 });
    await page.getByLabel('Notes').fill('Verify the Photoshop-only plan before renewal');

    await navigateTo(page, /^Dashboard/);
    await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible();

    await page.getByText('Adobe Creative Cloud').first().click();
    await expect(page.getByLabel('Notes')).toHaveValue('Verify the Photoshop-only plan before renewal');
  });
});

test.describe('Insights', () => {
  test('renders YoY chart, top 5, and overlap clusters when data is available', async ({ page }) => {
    await uploadAndLandOnDashboard(page);
    await navigateTo(page, /^Insights/);
    await expect(page.getByRole('heading', { name: /where the bleed is/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/top 5 by annual cost/i)).toBeVisible();
    await expect(page.getByText(/monthly spend, year over year/i)).toBeVisible();
  });

  test('shows empty state when reached cold without uploaded data', async ({ page }) => {
    await page.goto('/insights');
    await expect(page.getByRole('heading', { name: /insights show up/i })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Canceled screen', () => {
  test('shows the empty state when nothing has been canceled', async ({ page }) => {
    await uploadAndLandOnDashboard(page);
    await navigateTo(page, /^Canceled/);
    await expect(page.getByRole('heading', { name: /nothing canceled yet/i })).toBeVisible();
  });
});

test.describe('privacy invariant — Phase 5 flow', () => {
  test('zero external requests through upload → review → dashboard → detail → insights → canceled', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy();
    const origin = new URL(baseURL!).origin;
    const offenders: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:')) {
        offenders.push(`[${req.resourceType()}] ${url}`);
      }
    });

    await uploadAndLandOnDashboard(page);
    await page.getByText('Netflix').first().click();
    await expect(page.getByRole('heading', { name: 'Netflix' })).toBeVisible({ timeout: 10_000 });
    await navigateTo(page, /^Insights/);
    await expect(page.getByRole('heading', { name: /where the bleed is/i })).toBeVisible({ timeout: 10_000 });
    await navigateTo(page, /^Canceled/);
    await expect(page.getByRole('heading', { name: /^canceled$/i })).toBeVisible();

    expect(offenders, `Unexpected external requests: ${offenders.join(', ')}`).toEqual([]);
  });
});
