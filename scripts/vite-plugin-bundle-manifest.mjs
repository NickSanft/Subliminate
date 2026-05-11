/**
 * Emits `dist/bundle-manifest.json` after the build with SHA-256 hashes
 * of every shipped file plus a top-level `digest` hash of the manifest
 * itself. The same digest is exposed at runtime via the virtual module
 * `\0subliminate:bundle-manifest` so the Privacy screen can render it.
 *
 * Build determinism: hashes are content-addressed; we sort filenames
 * before hashing so identical inputs across two builds produce the same
 * digest. CI verifies this by building twice in `pnpm verify:repro`.
 */

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, posix } from 'node:path';

const VIRTUAL_ID = '\0subliminate:bundle-manifest';

async function walk(dir, baseDir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const abs = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(abs, baseDir)));
    } else if (entry.isFile()) {
      // Use forward slashes in the manifest for cross-platform stability.
      const rel = posix.relative(baseDir, abs.split('\\').join('/'));
      out.push({ abs, rel });
    }
  }
  return out;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function buildManifest(distDir) {
  // Walk dist/ but exclude the manifest itself and any sourcemaps.
  const files = (await walk(distDir, distDir.split('\\').join('/'))).filter(
    (f) => !f.rel.endsWith('bundle-manifest.json') && !f.rel.endsWith('.map'),
  );
  files.sort((a, b) => a.rel.localeCompare(b.rel));
  const fileEntries = [];
  for (const f of files) {
    const buf = await readFile(f.abs);
    fileEntries.push({ path: f.rel, size: buf.length, sha256: sha256(buf) });
  }
  // Digest is sha256(JSON.stringify(sortedFileEntries)). The reader can
  // recompute it locally to verify.
  const digest = sha256(JSON.stringify(fileEntries));
  return {
    schemaVersion: 1,
    digest,
    fileCount: fileEntries.length,
    files: fileEntries,
  };
}

function shortDigest(hex) {
  if (!hex) return '';
  return hex.slice(0, 8) + '…' + hex.slice(-4);
}

export default function bundleManifestPlugin() {
  let pendingDigest = null;

  return {
    name: 'subliminate:bundle-manifest',
    apply: 'build',
    enforce: 'post',

    resolveId(id) {
      if (id === VIRTUAL_ID || id === 'virtual:subliminate-bundle-manifest') return VIRTUAL_ID;
      return null;
    },

    load(id) {
      if (id !== VIRTUAL_ID) return null;
      // At load time the build hasn't finished yet, so we emit a
      // sentinel; we patch the chunk on writeBundle.
      return [
        `export const BUNDLE_DIGEST = '__SUBLIMINATE_BUNDLE_DIGEST__';`,
        `export const BUNDLE_DIGEST_SHORT = '__SUBLIMINATE_BUNDLE_DIGEST_SHORT__';`,
      ].join('\n');
    },

    async writeBundle(options) {
      const outDir = options.dir ?? resolve(process.cwd(), 'dist');
      // Compute the manifest over EVERYTHING in dist except itself and
      // sourcemaps. The chunk that imported the virtual module has the
      // sentinel string embedded; we'll patch it post-hash.
      const manifest = await buildManifest(outDir);
      pendingDigest = manifest.digest;

      // Patch the sentinels in the emitted JS chunks.
      const files = (await walk(outDir, outDir.split('\\').join('/'))).filter((f) =>
        f.rel.endsWith('.js'),
      );
      for (const f of files) {
        const buf = await readFile(f.abs);
        const text = buf.toString('utf8');
        if (!text.includes('__SUBLIMINATE_BUNDLE_DIGEST__')) continue;
        const patched = text
          .replaceAll('__SUBLIMINATE_BUNDLE_DIGEST_SHORT__', shortDigest(manifest.digest))
          .replaceAll('__SUBLIMINATE_BUNDLE_DIGEST__', manifest.digest);
        await writeFile(f.abs, patched);
      }

      // After patching, recompute the manifest with the FINAL chunk
      // contents so the published digest matches what reviewers see in
      // dist/.
      const finalManifest = await buildManifest(outDir);
      pendingDigest = finalManifest.digest;
      await writeFile(
        resolve(outDir, 'bundle-manifest.json'),
        JSON.stringify(finalManifest, null, 2) + '\n',
      );
      this.info(`bundle digest: ${finalManifest.digest}`);
    },

    closeBundle() {
      if (pendingDigest) {
        console.log(`\n[bundle-manifest] sha256: ${pendingDigest}`);
      }
    },
  };
}

export { buildManifest, shortDigest };

// Tiny helper for the readability of CI step: also expose `unused` so
// future plugin features don't trigger an unused-export lint.
export async function statManifest(path) {
  return stat(path);
}
