import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// 127.0.0.1 rather than "localhost": on macOS, localhost resolves to IPv6 (::1) first and can reach a
// different app than the IPv4 server. Override with API_URL if the server runs elsewhere.
const apiTarget = process.env.API_URL ?? 'http://127.0.0.1:3100';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the Node server so the browser sees a single origin (no CORS needed).
    proxy: { '/api': apiTarget },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
