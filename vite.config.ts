import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { readFileSync } from 'node:fs';
// @ts-expect-error — local plugin written as an ESM .mjs without type defs
import bundleManifest from './scripts/vite-plugin-bundle-manifest.mjs';

// GitHub Pages serves project sites from <user>.github.io/<repo>/. The
// deploy workflow sets BASE=/Subliminate/ so asset URLs resolve under
// that path. Local dev + Playwright leave BASE unset and serve from /.
const BASE = process.env['BASE'] ?? '/';

// Single source of truth for the version string baked into the UI.
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, './package.json'), 'utf8')) as {
  version: string;
};

export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss(), bundleManifest()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
