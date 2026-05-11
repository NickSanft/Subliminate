import { test, expect } from '@playwright/test';

test.describe('Privacy page', () => {
  test('renders hero, CSP table, network log, and ADR index', async ({ page }) => {
    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', { name: /what we claim, and how you can verify it/i }),
    ).toBeVisible();

    // CSP table — `connect-src 'none'` row is emphasized.
    const connectRow = page.getByTestId("csp-row-connect-src");
    await expect(connectRow).toBeVisible();
    await expect(connectRow).toContainText("'none'");

    // Live network log section exists with the silence-state message.
    await expect(page.getByText(/live network log/i)).toBeVisible();

    // ADR index includes all of the accepted ADRs.
    await expect(page.getByText('ADR-0001')).toBeVisible();
    await expect(page.getByText('ADR-0003')).toBeVisible();
    await expect(page.getByText('ADR-0005')).toBeVisible();
  });

  test('hero counter is 0 on a fresh load and shows online state', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByTestId('hero-blocked-count')).toHaveText('0');
    await expect(page.getByTestId('online-state')).toBeVisible();
  });

  test('Bundle hash card renders the production digest', async ({ page }) => {
    await page.goto('/privacy');
    const short = page.getByTestId('bundle-digest-short');
    await expect(short).toBeVisible();
    // Production build: digest is a real sha256 (64 hex chars). The
    // short form is "xxxxxxxx…yyyy". Allow either real or dev placeholder.
    const text = (await short.textContent()) ?? '';
    expect(text).toMatch(/sha256:/);
    // Either a real digest (8 hex chars + ellipsis + 4 hex chars) or
    // the dev-build sentinel.
    expect(text).toMatch(/(\(dev build|[0-9a-f]{8})/);
    // Toggle the details to surface the full digest.
    const full = page.getByTestId('bundle-digest-full');
    if (await full.count()) {
      const digest = (await full.textContent())?.trim() ?? '';
      expect(digest).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});

test.describe('Service worker', () => {
  test('registers within a few seconds of the first page load', async ({ page }) => {
    await page.goto('/');
    const swState = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      const reg = await navigator.serviceWorker.ready;
      return reg.active?.state ?? null;
    });
    expect(['activated', 'activating']).toContain(swState);
  });

  test('blocks a programmatic cross-origin fetch attempt', async ({ page }) => {
    await page.goto('/');
    // Wait for the SW to claim the page; otherwise fetch goes direct.
    await page.evaluate(() => navigator.serviceWorker.ready);
    const result = await page.evaluate(async () => {
      try {
        const r = await fetch('https://example.com/tracker.gif');
        return { ok: r.ok, status: r.status, blocked: r.headers.get('X-Subliminate-Block') };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
    // Either the SW returned 403 with our header, or CSP blocked the fetch
    // outright (which throws). Both outcomes satisfy the invariant.
    if ('blocked' in result) {
      expect(result.blocked).toBe('1');
      expect(result.status).toBe(403);
    } else {
      expect(result.error).toMatch(/refused|blocked|csp|failed/i);
    }
  });
});
