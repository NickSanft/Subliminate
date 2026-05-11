import { test, expect, type Request } from '@playwright/test';

/**
 * The Subliminate privacy invariant: in normal use, the app makes ZERO
 * network requests beyond its own origin. This test is the load-bearing
 * artifact that proves the claim. It runs against the built bundle via
 * `pnpm preview`, asserting the same shape a user would see in DevTools.
 *
 * The test stays in Phase 1 even though the SW fetch trap doesn't ship
 * until Phase 6 — at that point this spec gets stricter, not weaker.
 */

const VISITS: readonly string[] = ['/', '/components', '/upload', '/dashboard', '/privacy'];

function isSelfOrigin(req: Request, origin: string): boolean {
  return req.url().startsWith(origin) || req.url().startsWith('data:');
}

test.describe('privacy invariant', () => {
  for (const path of VISITS) {
    test(`no external requests on ${path}`, async ({ page, baseURL }) => {
      expect(baseURL, 'baseURL must be configured').toBeTruthy();
      const origin = new URL(baseURL!).origin;
      const offenders: { url: string; resourceType: string }[] = [];

      page.on('request', (req) => {
        if (!isSelfOrigin(req, origin)) {
          offenders.push({ url: req.url(), resourceType: req.resourceType() });
        }
      });

      await page.goto(path, { waitUntil: 'networkidle' });

      expect(
        offenders,
        `Expected zero non-self requests on ${path}; saw:\n${offenders.map((o) => `  - [${o.resourceType}] ${o.url}`).join('\n')}`,
      ).toEqual([]);
    });
  }

  test('CSP meta tag is present with strict directives', async ({ page }) => {
    await page.goto('/');
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("font-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('fonts.googleapis.com');
    expect(csp).not.toContain('fonts.gstatic.com');
  });
});
