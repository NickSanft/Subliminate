/**
 * Repro-build verifier. Builds the app twice in succession and asserts
 * the bundle-manifest digest matches between runs. Hooked up to CI to
 * catch any source of nondeterminism the moment it lands.
 *
 * Usage: pnpm verify:repro
 */

import { execSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const DIST = resolve(ROOT, 'dist');
const MANIFEST = resolve(DIST, 'bundle-manifest.json');

async function buildOnce() {
  await rm(DIST, { recursive: true, force: true });
  execSync('pnpm build', { stdio: 'inherit', env: { ...process.env, SOURCE_DATE_EPOCH: '0' } });
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  return manifest.digest;
}

const first = await buildOnce();
console.log(`build 1 digest: ${first}`);
const second = await buildOnce();
console.log(`build 2 digest: ${second}`);

if (first !== second) {
  console.error('\nReproducible-build check failed: digests differ between consecutive builds.');
  console.error(`  build 1: ${first}`);
  console.error(`  build 2: ${second}`);
  process.exit(1);
}
console.log('\nReproducible-build check passed.');
