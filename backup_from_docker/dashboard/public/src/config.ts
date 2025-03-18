// Frontend config
declare global {
  interface Window {
    localStorage: Storage;
  }
}

import { getProjectNameHash } from './utils/portConfig';

const projectName = 'prodash-tools';
const portHash = getProjectNameHash(projectName);

export const FRONTEND_PORT = 53000 + portHash;
export const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT ? parseInt(import.meta.env.VITE_BACKEND_PORT) : (54000 + portHash);
export const API_URL = `http://localhost:${BACKEND_PORT}`;

console.log('Project:', projectName);
console.log('Using frontend port:', FRONTEND_PORT);
console.log('Using backend port:', BACKEND_PORT);
console.log('Using API URL:', API_URL);

export const config = {
  apiBaseUrl: API_URL,
  backendPort: BACKEND_PORT,
  isProduction: false // In Vite client code we're always in development
};

export default config; 