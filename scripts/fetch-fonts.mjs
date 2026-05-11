// Download self-hosted webfonts from Google Fonts (release-CDN URLs return
// woff2 binaries). Runs at install/setup time only — never at build or
// runtime. The `font-src 'self'` CSP guarantees the browser never fetches
// from a CDN.
//
// If you'd rather vendor the files manually, drop them in /public/fonts/
// with the names listed below and skip this script.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = resolve(__dirname, '..', 'public', 'fonts');

const FONT_CSS_URLS = [
  // Variable fonts (single woff2 per family covering all weights)
  {
    css: 'https://fonts.googleapis.com/css2?family=Geist:wght@300..700&display=swap',
    out: 'Geist[wght].woff2',
  },
  {
    css: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400..700&display=swap',
    out: 'SourceSerif4[opsz,wght].woff2',
  },
  {
    css: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..600&display=swap',
    out: 'JetBrainsMono[wght].woff2',
  },
];

// Google Fonts serves a different CSS body based on the User-Agent. Modern
// Chrome gets variable-font woff2 URLs — the smallest, best-supported format.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// Google Fonts returns several @font-face blocks per request, one per
// unicode-range subset (latin, latin-ext, cyrillic, …). We want the Latin
// block — it's the largest standard subset and covers the glyphs the app
// actually renders.
async function extractWoff2(cssBody) {
  const blocks = cssBody
    .split('@font-face')
    .map((b) => b.trim())
    .filter(Boolean);
  // Prefer the block labelled `/* latin */` in the leading comment, falling
  // back to whichever block contains U+0020 (space) in its unicode-range,
  // which is a reliable Latin indicator.
  const latin =
    blocks.find((b) => /\/\*\s*latin\s*\*\//i.test(b)) ??
    blocks.find((b) => /unicode-range:[^;]*U\+0020/i.test(b)) ??
    blocks[0];
  if (!latin) throw new Error('No @font-face blocks found in Google Fonts CSS response');
  const match = latin.match(/url\((https:\/\/[^)]+\.woff2)\)/);
  if (!match) throw new Error('Could not find a woff2 URL in the Latin @font-face block');
  return match[1];
}

async function downloadFont({ css, out }) {
  const target = resolve(FONTS_DIR, out);
  if (await exists(target)) {
    console.log(`[skip] ${out} already exists`);
    return;
  }
  console.log(`[fetch] ${out} — resolving woff2 URL`);
  const cssRes = await fetch(css, { headers: { 'User-Agent': UA } });
  if (!cssRes.ok) throw new Error(`CSS fetch failed: ${cssRes.status}`);
  const cssBody = await cssRes.text();
  const woff2Url = await extractWoff2(cssBody);
  console.log(`[fetch] ${out} — downloading ${woff2Url}`);
  const fontRes = await fetch(woff2Url);
  if (!fontRes.ok) throw new Error(`Font fetch failed: ${fontRes.status}`);
  const buf = Buffer.from(await fontRes.arrayBuffer());
  await writeFile(target, buf);
  console.log(`[done] ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
}

await mkdir(FONTS_DIR, { recursive: true });
for (const f of FONT_CSS_URLS) {
  await downloadFont(f);
}
console.log('\nFonts ready in public/fonts/.');
