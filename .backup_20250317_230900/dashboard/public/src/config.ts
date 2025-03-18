// Frontend config
declare global {
  interface Window {
    localStorage: Storage;
  }
}

// Helper function to get the project name hash for port calculation
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

// Get backend port - try localStorage first, then calculate from project name
let backendPort = 54420; // Default to the known working port

// Only access localStorage in browser environment
if (typeof window !== 'undefined') {
  const storedPort = window.localStorage.getItem('prodash_backend_port');
  if (storedPort && !isNaN(Number(storedPort))) {
    backendPort = Number(storedPort);
  } else {
    // Calculate from project name
    const projectName = 'prodash-tools';
    backendPort = 54000 + getProjectNameHash(projectName);
    
    // Store for future use
    window.localStorage.setItem('prodash_backend_port', backendPort.toString());
  }
}

// For production, use a relative path to support proxy setup
const isProduction = false; // In Vite client code we're always in development

// Use calculated API URL - always use localhost in development
const apiBaseUrl = `http://localhost:${backendPort}`;

console.log(`Using backend port: ${backendPort}`);
console.log(`Using API URL: ${apiBaseUrl}`);

export const config = {
  apiBaseUrl,
  backendPort,
  isProduction
};

export default config; 