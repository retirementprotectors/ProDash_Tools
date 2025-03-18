/**
 * Generates a unique port number based on the project name
 * @param projectName - The name of the project
 * @param serviceType - The type of service (frontend, backend, database)
 * @returns A port number in the appropriate range
 */
export declare function generatePortFromProjectName(projectName: string, serviceType?: 'FRONTEND' | 'BACKEND' | 'DATABASE'): number;
/**
 * Gets the project name from package.json
 * @returns The project name or 'context-keeper' if not found
 */
export declare function getProjectName(): string;
export declare const DEFAULT_PORTS: {
    FRONTEND: number;
    BACKEND: number;
    DATABASE: number;
};
/**
 * Find an available port starting from the suggested port
 * @param startPort - The port to start checking from
 * @returns A promise that resolves to an available port
 */
export declare function findAvailablePort(startPort: number): Promise<number>;
