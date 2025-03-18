import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as os from 'os';

// Port ranges for different service types
const PORT_RANGES = {
  FRONTEND: 51000,
  BACKEND: 52000,
  DATABASE: 53000
};

// Maximum offset to add to base port (to avoid going over 65535)
const MAX_PORT_OFFSET = 3000;

/**
 * Generates a unique port number based on the project name
 * @param projectName - The name of the project
 * @param serviceType - The type of service (frontend, backend, database)
 * @returns A port number in the appropriate range
 */
export function generatePortFromProjectName(
  projectName: string,
  serviceType: 'FRONTEND' | 'BACKEND' | 'DATABASE' = 'BACKEND'
): number {
  // Convert project name to lowercase and remove special characters
  const normalizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Hash the project name to a number
  let hash = 0;
  for (let i = 0; i < normalizedName.length; i++) {
    const char = normalizedName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Ensure the hash is positive
  hash = Math.abs(hash);
  
  // Get the base port for this service type
  const basePort = PORT_RANGES[serviceType];
  
  // Calculate the offset (limited to avoid going over port limits)
  const offset = hash % MAX_PORT_OFFSET;
  
  return basePort + offset;
}

/**
 * Gets the project name from package.json
 * @returns The project name or 'context-keeper' if not found
 */
export function getProjectName(): string {
  try {
    // Try to find package.json in the project root
    const packageJsonPath = join(process.cwd(), 'package.json');
    
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      return packageJson.name || 'context-keeper';
    }
    
    // Fallback to the parent directory name
    const pathParts = process.cwd().split(/[/\\]/);
    const parentDir = pathParts[pathParts.length - 1];
    return parentDir || 'context-keeper';
  } catch (error) {
    console.warn('Failed to determine project name:', error);
    return 'context-keeper';
  }
}

// Default port configuration
export const DEFAULT_PORTS = {
  FRONTEND: generatePortFromProjectName(getProjectName(), 'FRONTEND'),
  BACKEND: generatePortFromProjectName(getProjectName(), 'BACKEND'),
  DATABASE: generatePortFromProjectName(getProjectName(), 'DATABASE')
};

/**
 * Find an available port starting from the suggested port
 * @param startPort - The port to start checking from
 * @returns A promise that resolves to an available port
 */
export async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = require('http').createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        console.log(`Found available port: ${port}`);
        resolve(port);
      });
    });
    
    server.on('error', () => {
      // Port is in use, try the next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Console output for debugging
console.log(`Project name: ${getProjectName()}`);
console.log(`Generated port configuration:`);
console.log(`  Frontend: ${DEFAULT_PORTS.FRONTEND}`);
console.log(`  Backend: ${DEFAULT_PORTS.BACKEND}`);
console.log(`  Database: ${DEFAULT_PORTS.DATABASE}`); 