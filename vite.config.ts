import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
// @ts-expect-error — local plugin written as an ESM .mjs without type defs
import bundleManifest from './scripts/vite-plugin-bundle-manifest.mjs';

// GitHub Pages serves project sites from <user>.github.io/<repo>/. The
// deploy workflow sets BASE=/Subliminate/ so asset URLs resolve under
// that path. Local dev + Playwright leave BASE unset and serve from /.
const BASE = process.env['BASE'] ?? '/';

export default defineConfig({
  base: BASE,
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
