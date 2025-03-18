/**
 * ProDash Tools Main Entry Point
 */

// Re-export from the new structure
export * from './prodash-tools/core/index';

// Main server function
import { startServer } from './prodash-tools/api/server';

// If this file is run directly, start the server
if (require.main === module) {
  startServer().catch(console.error);
}
