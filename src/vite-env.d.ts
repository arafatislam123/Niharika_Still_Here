/// <reference types="vite/client" />

declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  /** Optional base URL of the Python AI service (POST /ai/ask). */
  readonly VITE_AI_API_URL?: string;
}
