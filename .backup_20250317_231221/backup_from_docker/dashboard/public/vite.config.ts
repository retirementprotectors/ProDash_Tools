import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getProjectNameHash } from './src/utils/portConfig';

const projectName = 'prodash-tools';
const portHash = getProjectNameHash(projectName);
const FRONTEND_PORT = 53000 + portHash;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: FRONTEND_PORT,
    strictPort: true, // This ensures we use exactly the port we want
    proxy: {
      '/api': {
        target: `http://localhost:${54000 + portHash}`,
        changeOrigin: true,
        secure: false
      }
    }
  }
}); 