/**
 * Calculate a consistent hash from a project name for port allocation
 * @param projectName The name of the project
 * @returns A number between 0 and 999 for port offset
 */
export function getProjectNameHash(projectName: string): number {
  const normalizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let hash = 0;
  for (let i = 0; i < normalizedName.length; i++) {
    const char = normalizedName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash) % 1000; // Max offset of 1000
} 