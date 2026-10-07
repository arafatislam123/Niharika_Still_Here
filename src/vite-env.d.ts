/// <reference types="vite/client" />

/** Short git SHA injected by vite.config.ts; shown in the footer. */
declare const __BUILD_ID__: string;

declare module 'virtual:machine-manifest' {
  const manifest: Record<string, import('./lib/schema').ManifestEntry[]>;
  export default manifest;
}
