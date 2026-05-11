import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
// @ts-expect-error — local plugin written as an ESM .mjs without type defs
import bundleManifest from './scripts/vite-plugin-bundle-manifest.mjs';

export default defineConfig({
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
