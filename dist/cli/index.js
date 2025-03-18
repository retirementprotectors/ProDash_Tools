#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const VectorOperations_1 = require("../core/services/VectorOperations");
const EnhancedContextService_1 = require("../core/services/EnhancedContextService");
const program = new commander_1.Command();
let contextService;
/**
 * Initialize the context service
 */
async function initializeService() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
        console.error(chalk_1.default.red('Error: OPENAI_API_KEY environment variable is required'));
        process.exit(1);
    }
    const vectorOps = new VectorOperations_1.DefaultVectorOperations();
    contextService = new EnhancedContextService_1.EnhancedContextService(vectorOps, openAiKey, mongoUri);
    await contextService.initialize();
}
program
    .name('prodash')
    .description('ProDash Tools CLI - Context Management System')
    .version('1.0.0');
program
    .command('create')
    .description('Create a new context')
    .option('-p, --project <project>', 'Project name')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .option('-d, --description <description>', 'Context description')
    .option('-r, --priority <priority>', 'Priority (low, medium, high, critical)', 'medium')
    .action(async (options) => {
    const spinner = (0, ora_1.default)('Creating context...').start();
    try {
        await initializeService();
        const context = {
            id: Date.now().toString(),
            session: {
                id: `session_${Date.now()}`,
                startTime: Date.now(),
                endTime: Date.now(),
                projectState: {
                    files: [],
                    gitHash: '',
                    environment: {},
                    dependencies: {},
                    configState: {},
                    systemMetrics: {
                        memory: 0,
                        cpu: 0,
                        timestamp: Date.now()
                    }
                }
            },
            conversation: {
                thread: [],
                summary: options.description || '',
                keyPoints: [],
                sentiment: 0
            },
            knowledge: {
                entities: [],
                learnings: [],
                relationships: []
            },
            metadata: {
                tags: options.tags ? options.tags.split(',') : [],
                priority: options.priority,
                project: options.project || '',
                domain: [],
                capabilities: [],
                outcomes: [],
                version: '1.0.0',
                created: Date.now(),
                updated: Date.now(),
                accessCount: 0,
                lastAccessed: Date.now()
            },
            vectorIndices: {
                semantic: [],
                conceptual: [],
                temporal: [],
                categorical: []
            },
            schema: {
                version: '1.0.0',
                compatibility: ['1.0.0']
            }
        };
        const result = await contextService.upsertContext(context);
        spinner.succeed(chalk_1.default.green(`Context created with ID: ${result.id}`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to create context: ${error.message}`));
    }
    finally {
        await contextService?.close();
    }
});
program
    .command('list')
    .description('List all contexts')
    .option('-p, --project <project>', 'Filter by project')
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .option('-r, --priority <priority>', 'Filter by priority')
    .action(async (options) => {
    const spinner = (0, ora_1.default)('Fetching contexts...').start();
    try {
        await initializeService();
        let contexts = [];
        if (options.project) {
            contexts = await contextService.getContextsByProject(options.project);
        }
        else if (options.tags) {
            contexts = await contextService.getContextsByTags(options.tags.split(','));
        }
        else if (options.priority) {
            contexts = await contextService.getContextsByPriority(options.priority);
        }
        else {
            contexts = await contextService.exportContexts();
        }
        spinner.stop();
        if (contexts.length === 0) {
            console.log(chalk_1.default.yellow('No contexts found'));
            return;
        }
        contexts.forEach(context => {
            console.log(chalk_1.default.bold('\nContext:'));
            console.log(chalk_1.default.cyan(`ID: ${context.id}`));
            console.log(chalk_1.default.cyan(`Project: ${context.metadata.project}`));
            console.log(chalk_1.default.cyan(`Priority: ${context.metadata.priority}`));
            console.log(chalk_1.default.cyan(`Tags: ${context.metadata.tags.join(', ')}`));
            console.log(chalk_1.default.cyan(`Created: ${new Date(context.metadata.created).toLocaleString()}`));
            console.log(chalk_1.default.cyan(`Messages: ${context.conversation.thread.length}`));
            console.log(chalk_1.default.cyan(`Entities: ${context.knowledge.entities.length}`));
            console.log(chalk_1.default.cyan(`Learnings: ${context.knowledge.learnings.length}`));
        });
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to list contexts: ${error.message}`));
    }
    finally {
        await contextService?.close();
    }
});
program
    .command('show <id>')
    .description('Show context details')
    .action(async (id) => {
    const spinner = (0, ora_1.default)('Fetching context...').start();
    try {
        await initializeService();
        const context = await contextService.getContext(id);
        if (!context) {
            spinner.fail(chalk_1.default.red('Context not found'));
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.bold('\nContext Details:'));
        console.log(chalk_1.default.cyan(`ID: ${context.id}`));
        console.log(chalk_1.default.cyan(`Project: ${context.metadata.project}`));
        console.log(chalk_1.default.cyan(`Priority: ${context.metadata.priority}`));
        console.log(chalk_1.default.cyan(`Tags: ${context.metadata.tags.join(', ')}`));
        console.log(chalk_1.default.cyan(`Created: ${new Date(context.metadata.created).toLocaleString()}`));
        console.log(chalk_1.default.cyan(`Updated: ${new Date(context.metadata.updated).toLocaleString()}`));
        console.log(chalk_1.default.cyan(`Access Count: ${context.metadata.accessCount}`));
        console.log(chalk_1.default.bold('\nConversation:'));
        context.conversation.thread.forEach((msg, i) => {
            console.log(chalk_1.default.cyan(`\nMessage ${i + 1}:`));
            console.log(chalk_1.default.cyan(`Role: ${msg.role}`));
            console.log(chalk_1.default.cyan(`Content: ${msg.content}`));
            console.log(chalk_1.default.cyan(`Time: ${new Date(msg.timestamp).toLocaleString()}`));
        });
        console.log(chalk_1.default.bold('\nKnowledge Base:'));
        console.log(chalk_1.default.cyan('\nEntities:'));
        context.knowledge.entities.forEach(entity => {
            console.log(chalk_1.default.cyan(`- ${entity.type}: ${entity.name}`));
            console.log(chalk_1.default.cyan(`  ${entity.description}`));
        });
        console.log(chalk_1.default.cyan('\nLearnings:'));
        context.knowledge.learnings.forEach(learning => {
            console.log(chalk_1.default.cyan(`- ${learning.type}: ${learning.description}`));
            console.log(chalk_1.default.cyan(`  Confidence: ${learning.confidence}`));
        });
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to show context: ${error.message}`));
    }
    finally {
        await contextService?.close();
    }
});
program
    .command('delete <id>')
    .description('Delete a context')
    .action(async (id) => {
    const spinner = (0, ora_1.default)('Deleting context...').start();
    try {
        await initializeService();
        const success = await contextService.deleteContext(id);
        if (success) {
            spinner.succeed(chalk_1.default.green('Context deleted successfully'));
        }
        else {
            spinner.fail(chalk_1.default.red('Context not found'));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to delete context: ${error.message}`));
    }
    finally {
        await contextService?.close();
    }
});
program
    .command('add-message <contextId>')
    .description('Add a message to a context')
    .requiredOption('-c, --content <content>', 'Message content')
    .option('-r, --role <role>', 'Message role (user, assistant, system)', 'user')
    .action(async (contextId, options) => {
    const spinner = (0, ora_1.default)('Adding message...').start();
    try {
        await initializeService();
        const message = {
            id: Date.now().toString(),
            role: options.role,
            content: options.content,
            timestamp: Date.now(),
            references: {
                files: [],
                codeBlocks: [],
                previousContexts: [],
                externalResources: []
            },
            actions: [],
            metadata: {}
        };
        await contextService.addMessage(contextId, message);
        spinner.succeed(chalk_1.default.green('Message added successfully'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to add message: ${error.message}`));
    }
    finally {
        await contextService?.close();
    }
});
program
    .command('find-similar <contextId>')
    .description('Find similar contexts')
    .option('-l, --limit <number>', 'Number of similar contexts to return', '5')
    .action(async (contextId, options) => {
    const spinner = (0, ora_1.default)('Finding similar contexts...').start();
    try {
        await initializeService();
        const results = await contextService.findSimilar(contextId, parseInt(options.limit));
        spinner.stop();
        if (results.length === 0) {
            console.log(chalk_1.default.yellow('No similar contexts found'));
            return;
        }
        results.forEach(({ context, similarity }) => {
            console.log(chalk_1.default.bold('\nSimilar Context:'));
            console.log(chalk_1.default.cyan(`ID: ${context.id}`));
            console.log(chalk_1.default.cyan(`Project: ${context.metadata.project}`));
            console.log(chalk_1.default.cyan(`Similarity: ${(similarity * 100).toFixed(2)}%`));
            console.log(chalk_1.default.cyan(`Tags: ${context.metadata.tags.join(', ')}`));
        });
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to find similar contexts: ${error.message}`));
    }
    finally {
        await contextService?.close();
    }
});
program.parse();
