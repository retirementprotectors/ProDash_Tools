import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { join } from 'path';

// Port calculation for consistency between config files
function getProjectNameHash(projectName: string): number {
  const normalizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let hash = 0;
  for (let i = 0; i < normalizedName.length; i++) {
    const char = normalizedName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash) % 3000; // Max offset of 3000
}

// Try to get project name from package.json
function getProjectName(): string {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.name || 'context-keeper';
  } catch (error) {
    console.warn('Failed to determine project name:', error);
    return 'context-keeper';
  }
}

// Port ranges for different service types
const FRONTEND_BASE_PORT = 51000;
const BACKEND_BASE_PORT = 52000;

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get project name for port calculation
  const projectName = env.VITE_PROJECT_NAME || getProjectName();
  
  // Calculate dynamic ports
  const frontendPort = FRONTEND_BASE_PORT + getProjectNameHash(projectName);
  const backendPort = BACKEND_BASE_PORT + getProjectNameHash(projectName);
  
  // Use configured API URL or calculate from project name
  const apiUrl = env.VITE_API_URL || `http://localhost:${backendPort}`;
  
  console.log(`Project: ${projectName}`);
  console.log(`Using frontend port: ${frontendPort}`);
  console.log(`Using API URL: ${apiUrl}`);

  return {
    plugins: [react()],
    server: {
      host: true, // Listen on all addresses
      port: frontendPort, // Use dynamic port
      strictPort: false, // Try next available port if taken
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
    },
    define: {
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
      'process.env.VITE_PROJECT_NAME': JSON.stringify(projectName),
      'process.env.VITE_FRONTEND_PORT': frontendPort,
      'process.env.VITE_BACKEND_PORT': backendPort,
    },
  };
}); 