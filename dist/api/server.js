"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = require("path");
const ContextManager_1 = require("../core/ContextManager");
const BackupManager_1 = require("../core/BackupManager");
const GitIntegration_1 = require("../core/GitIntegration");
const ContextCaptureService_1 = require("../core/ContextCaptureService");
const PortConfig_1 = require("../core/PortConfig");
const contextRoutes_1 = require("./contextRoutes");
const backupRoutes_1 = require("./backupRoutes");
const healthRoutes_1 = require("./healthRoutes");
const gitRoutes_1 = require("./gitRoutes");
const captureRoutes_1 = require("./captureRoutes");
// Managers
const contextManager = new ContextManager_1.ContextManager();
const backupManager = new BackupManager_1.BackupManager();
const gitIntegration = new GitIntegration_1.GitIntegration();
const captureService = new ContextCaptureService_1.ContextCaptureService();
async function startServer() {
    console.log('Initializing ProDash Tools Server...');
    try {
        // Initialize services
        console.log('Initializing Context Manager...');
        await contextManager.initialize();
        console.log('Initializing Backup Manager...');
        await backupManager.initialize();
        console.log('Initializing Git Integration...');
        await gitIntegration.initialize();
        console.log('Initializing Context Capture Service...');
        await captureService.initialize();
        // Create Express app
        const app = (0, express_1.default)();
        // Set up middleware
        app.use((0, cors_1.default)());
        app.use(express_1.default.json({ limit: '50mb' }));
        // Set up API routes
        app.use('/api/contexts', (0, contextRoutes_1.contextRoutes)(contextManager));
        app.use('/api/backups', (0, backupRoutes_1.backupRoutes)(backupManager, contextManager));
        app.use('/api/health', (0, healthRoutes_1.healthRoutes)(contextManager, backupManager));
        app.use('/api/git', (0, gitRoutes_1.gitRoutes)(gitIntegration));
        app.use('/api/capture', (0, captureRoutes_1.captureRoutes)(captureService));
        // Serve static files from the dashboard
        app.use(express_1.default.static((0, path_1.join)(__dirname, '..', 'dashboard', 'public', 'dist')));
        // Catch-all route to serve the dashboard for client-side routing
        app.get('*', (req, res) => {
            res.sendFile((0, path_1.join)(__dirname, '..', 'dashboard', 'public', 'dist', 'index.html'));
        });
        // Try to use the default port, but find an available one if that's not possible
        console.log(`Starting Server (attempting to use port ${PortConfig_1.DEFAULT_PORTS.BACKEND})...`);
        const port = await (0, PortConfig_1.findAvailablePort)(PortConfig_1.DEFAULT_PORTS.BACKEND);
        // Save the actual port so frontend can access it
        app.set('port', port);
        // Start server
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            console.log('ProDash Tools system is running!');
            console.log(`Access the dashboard at http://localhost:${port}`);
        });
        // Set up graceful shutdown
        process.on('SIGINT', async () => {
            console.log('Shutting down ProDash Tools...');
            // Perform cleanup
            await backupManager.shutdown();
            await gitIntegration.shutdown();
            await captureService.shutdown();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to start ProDash Tools:', error);
        process.exit(1);
    }
}
// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}
