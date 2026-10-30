import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: { '/api': process.env.CINEMA_API_PROXY ?? 'http://localhost:5080' },
  },
  preview: { host: 'localhost', port: 4173, strictPort: true },
});
