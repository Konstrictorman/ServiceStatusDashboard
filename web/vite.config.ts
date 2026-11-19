import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the Node server so the browser sees a single origin (no CORS needed).
    proxy: { '/api': apiTarget },
  },
  test: {
    environment: 'jsdom',
  },
});
