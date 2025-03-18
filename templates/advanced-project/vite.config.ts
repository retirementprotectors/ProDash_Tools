import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:52000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@server': path.resolve(__dirname, './src/server'),
    },
  },
  build: {
    outDir: 'dist/client',
    sourcemap: true,
  },
}); 