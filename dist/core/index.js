"use strict";
/**
 * ProDash_Tools Core
 *
 * This file re-exports core utilities to make them easily accessible.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextCaptureService = exports.GitIntegration = exports.BackupManager = exports.getProjectName = exports.generatePortFromProjectName = exports.findAvailablePort = exports.DEFAULT_PORTS = exports.ContextManager = void 0;
exports.getContextManager = getContextManager;
exports.getBackupManager = getBackupManager;
exports.getGitIntegration = getGitIntegration;
exports.getContextCaptureService = getContextCaptureService;
// Core services
var ContextManager_1 = require("./ContextManager");
Object.defineProperty(exports, "ContextManager", { enumerable: true, get: function () { return ContextManager_1.ContextManager; } });
// Port configuration
var PortConfig_1 = require("./PortConfig");
Object.defineProperty(exports, "DEFAULT_PORTS", { enumerable: true, get: function () { return PortConfig_1.DEFAULT_PORTS; } });
Object.defineProperty(exports, "findAvailablePort", { enumerable: true, get: function () { return PortConfig_1.findAvailablePort; } });
Object.defineProperty(exports, "generatePortFromProjectName", { enumerable: true, get: function () { return PortConfig_1.generatePortFromProjectName; } });
Object.defineProperty(exports, "getProjectName", { enumerable: true, get: function () { return PortConfig_1.getProjectName; } });
// Backup management
var BackupManager_1 = require("./BackupManager");
Object.defineProperty(exports, "BackupManager", { enumerable: true, get: function () { return BackupManager_1.BackupManager; } });
// Git integration
var GitIntegration_1 = require("./GitIntegration");
Object.defineProperty(exports, "GitIntegration", { enumerable: true, get: function () { return GitIntegration_1.GitIntegration; } });
// Context capture
var ContextCaptureService_1 = require("./ContextCaptureService");
Object.defineProperty(exports, "ContextCaptureService", { enumerable: true, get: function () { return ContextCaptureService_1.ContextCaptureService; } });
/**
 * Get a single context manager instance
 * @returns A singleton ContextManager instance
 */
let contextManagerInstance = null;
function getContextManager() {
    if (!contextManagerInstance) {
        const { ContextManager } = require('./context-keeper/ContextManager');
        contextManagerInstance = new ContextManager();
        contextManagerInstance.initialize().catch(console.error);
    }
    return contextManagerInstance;
}
/**
 * Get a single backup manager instance
 * @returns A singleton BackupManager instance
 */
let backupManagerInstance = null;
function getBackupManager() {
    if (!backupManagerInstance) {
        const { BackupManager } = require('./context-keeper/BackupManager');
        backupManagerInstance = new BackupManager();
        backupManagerInstance.initialize().catch(console.error);
    }
    return backupManagerInstance;
}
/**
 * Get a single git integration instance
 * @returns A singleton GitIntegration instance
 */
let gitIntegrationInstance = null;
function getGitIntegration() {
    if (!gitIntegrationInstance) {
        const { GitIntegration } = require('./context-keeper/GitIntegration');
        gitIntegrationInstance = new GitIntegration();
        gitIntegrationInstance.initialize().catch(console.error);
    }
    return gitIntegrationInstance;
}
/**
 * Get a single context capture service instance
 * @returns A singleton ContextCaptureService instance
 */
let contextCaptureServiceInstance = null;
function getContextCaptureService() {
    if (!contextCaptureServiceInstance) {
        const { ContextCaptureService } = require('./context-keeper/ContextCaptureService');
        contextCaptureServiceInstance = new ContextCaptureService();
        contextCaptureServiceInstance.initialize().catch(console.error);
    }
    return contextCaptureServiceInstance;
}
