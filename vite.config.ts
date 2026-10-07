import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { MANIFEST_FIELDS } from './src/lib/schema';

const root = path.dirname(fileURLToPath(import.meta.url));
const MACHINE_FILE = /[\\/]content[\\/][^\\/]+[\\/]machines[\\/][^\\/]+\.json$/;

/** Short git SHA shown in the footer, so anyone can tell which build they are looking at. */
function buildId(): string {
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF.slice(0, 7); // set by Netlify
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

/**
 * `virtual:machine-manifest`: the small per-machine summary (id, name, status, hook, sites...)
 * for every content/<locale>/machines/*.json, so the map and navigation never load full machine
 * text. New machine files are picked up with no code change.
 */
function machineManifest(): Plugin {
  const virtualId = 'virtual:machine-manifest';
  const resolvedId = '\0' + virtualId;
  const contentDir = path.join(root, 'src/content');

  return {
    name: 'still-here:machine-manifest',
    resolveId(id) {
      return id === virtualId ? resolvedId : undefined;
    },
    load(id) {
      if (id !== resolvedId) return;
      const manifest: Record<string, Record<string, unknown>[]> = {};
      for (const locale of fs.readdirSync(contentDir)) {
        const dir = path.join(contentDir, locale, 'machines');
        if (!fs.existsSync(dir)) continue;
        manifest[locale] = fs
          .readdirSync(dir)
          .filter((file) => file.endsWith('.json'))
          .map((file) => {
            const full = path.join(dir, file);
            this.addWatchFile(full);
            const machine = JSON.parse(fs.readFileSync(full, 'utf8')) as Record<string, unknown>;
            return Object.fromEntries(MANIFEST_FIELDS.map((key) => [key, machine[key]]));
          })
          .sort((a, b) => (a.order as number) - (b.order as number));
      }
      return `export default ${JSON.stringify(manifest)};`;
    },
    handleHotUpdate({ file, server }) {
      if (!MACHINE_FILE.test(file)) return;
      const mod = server.moduleGraph.getModuleById(resolvedId);
      if (mod) server.moduleGraph.invalidateModule(mod);
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
  plugins: [
    react(),
    machineManifest(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script', // external registerSW.js keeps the CSP free of inline scripts
      manifest: {
        name: 'STILL HERE',
        short_name: 'STILL HERE',
        description: 'Letters from the machines we left behind.',
        theme_color: '#0b0e1a',
        background_color: '#0b0e1a',
        display: 'standalone',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webp,png,woff2}'],
        globIgnores: ['models/**', 'audio/**', 'teacher/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // basemaps can exceed Workbox's 2 MB default
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/(models|audio|captions|teacher)\//],
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/trek\.nasa\.gov\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'trek-tiles',
              expiration: { maxEntries: 600, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/models\/.+\.glb$/,
            handler: 'CacheFirst',
            options: { cacheName: 'models', expiration: { maxEntries: 10 } },
          },
          {
            urlPattern: /\/audio\/.+\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              rangeRequests: true, // iOS Safari requests audio in byte ranges
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: /\/(captions|teacher)\/.+\.(vtt|pdf)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'documents' },
          },
        ],
      },
    }),
  ],
});
