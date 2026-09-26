import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  plugins: [svelte()],
  resolve: { alias: { $lib: new URL('./src/lib', import.meta.url).pathname } },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    modulePreload: { polyfill: false },
    // Stable filenames, deliberately. GitHub Pages serves index.html with max-age=600 and
    // gives us no way to change that, so a browser can hold a ten-minute-old page after a
    // deploy. If the file that page asks for has been renamed out from under it, it 404s and
    // the app is a blank screen. Nothing is lost by dropping the hash: the service worker's
    // cache name is a hash of file contents (scripts/build-sw.mjs), so each deploy is still
    // its own cache generation and still updates.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  server: { port: 5173, strictPort: false },
  preview: { port: 4173 },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node'
  }
});
