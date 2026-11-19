/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** How often the browser asks the API for fresh data, in milliseconds. */
  readonly VITE_REFRESH_INTERVAL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
