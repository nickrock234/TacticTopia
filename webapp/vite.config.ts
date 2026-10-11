import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// The rules engine lives one folder up (../engine) and is shared with the
// simulations and, later, the server. Vite may read files from there.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@engine': fileURLToPath(new URL('../engine', import.meta.url)),
      '@sim': fileURLToPath(new URL('../sim', import.meta.url)),
    },
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5174,
    host: true, // reachable from a phone on the same Wi-Fi
    fs: { allow: ['..'] },
  },
});
