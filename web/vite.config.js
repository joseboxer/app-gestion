import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Para subcarpeta en producción: VITE_BASE_PATH=/app-gestion/ npm run build
const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true }
    }
  }
});
