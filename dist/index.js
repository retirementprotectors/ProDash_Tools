"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContextRoutes = exports.MongoContextStore = exports.DefaultVectorOperations = exports.EnhancedContextService = void 0;
// Core services
var EnhancedContextService_1 = require("./core/services/EnhancedContextService");
Object.defineProperty(exports, "EnhancedContextService", { enumerable: true, get: function () { return EnhancedContextService_1.EnhancedContextService; } });
var VectorOperations_1 = require("./core/services/VectorOperations");
Object.defineProperty(exports, "DefaultVectorOperations", { enumerable: true, get: function () { return VectorOperations_1.DefaultVectorOperations; } });
var MongoContextStore_1 = require("./core/persistence/MongoContextStore");
Object.defineProperty(exports, "MongoContextStore", { enumerable: true, get: function () { return MongoContextStore_1.MongoContextStore; } });
// Types
__exportStar(require("./core/types/Context"), exports);
__exportStar(require("./core/types/Vector"), exports);
// Express routes
var contextRoutes_1 = require("./api/routes/contextRoutes");
Object.defineProperty(exports, "createContextRoutes", { enumerable: true, get: function () { return contextRoutes_1.createContextRoutes; } });
const ContextManager_1 = require("./core/ContextManager");
const AutoCollector_1 = require("./services/AutoCollector");
const HistoricalLoader_1 = require("./services/HistoricalLoader");
const MLOptimizer_1 = require("./services/MLOptimizer");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/context-keeper';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
    throw new Error('OPENAI_API_KEY is required');
}
// Initialize the system
const contextManager = new ContextManager_1.ContextManager(MONGO_URL, OPENAI_KEY);
const collector = new AutoCollector_1.AutoCollector(contextManager);
const loader = new HistoricalLoader_1.HistoricalLoader(contextManager);
const optimizer = new MLOptimizer_1.MLOptimizer(contextManager);
// Start the collection process
async function start() {
    try {
        await contextManager.connect();
        collector.start();
        console.log('Context keeper system started');
        console.log('- Auto-collecting chats every 30 seconds');
        console.log('- Creating backups every 5 minutes');
        console.log('- ML optimization will begin after 50 samples');
    }
    catch (error) {
        console.error('Failed to start context keeper:', error);
        process.exit(1);
    }
}
// Handle shutdown
process.on('SIGINT', async () => {
    collector.stop();
    await contextManager.close();
    process.exit(0);
});
start();
