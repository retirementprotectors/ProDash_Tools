"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PORTS = void 0;
exports.generatePortFromProjectName = generatePortFromProjectName;
exports.getProjectName = getProjectName;
exports.findAvailablePort = findAvailablePort;
const fs_1 = require("fs");
const path_1 = require("path");
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
function generatePortFromProjectName(projectName, serviceType = 'BACKEND') {
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
function getProjectName() {
    try {
        // Try to find package.json in the project root
        const packageJsonPath = (0, path_1.join)(process.cwd(), 'package.json');
        if ((0, fs_1.existsSync)(packageJsonPath)) {
            const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf8'));
            return packageJson.name || 'context-keeper';
        }
        // Fallback to the parent directory name
        const pathParts = process.cwd().split(/[/\\]/);
        const parentDir = pathParts[pathParts.length - 1];
        return parentDir || 'context-keeper';
    }
    catch (error) {
        console.warn('Failed to determine project name:', error);
        return 'context-keeper';
    }
}
// Default port configuration
exports.DEFAULT_PORTS = {
    FRONTEND: generatePortFromProjectName(getProjectName(), 'FRONTEND'),
    BACKEND: generatePortFromProjectName(getProjectName(), 'BACKEND'),
    DATABASE: generatePortFromProjectName(getProjectName(), 'DATABASE')
};
/**
 * Find an available port starting from the suggested port
 * @param startPort - The port to start checking from
 * @returns A promise that resolves to an available port
 */
async function findAvailablePort(startPort) {
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
console.log(`  Frontend: ${exports.DEFAULT_PORTS.FRONTEND}`);
console.log(`  Backend: ${exports.DEFAULT_PORTS.BACKEND}`);
console.log(`  Database: ${exports.DEFAULT_PORTS.DATABASE}`);
