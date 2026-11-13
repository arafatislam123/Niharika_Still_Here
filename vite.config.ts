import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/; set BASE_PATH there. Netlify and dev use '/'.
  base: process.env.BASE_PATH ?? '/',
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Three.js is big; keep it in its own chunk that only 3D routes load.
        manualChunks: { three: ['three'] },
      },
    },
  },
  plugins: [react()],
});
