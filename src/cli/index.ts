#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { DefaultVectorOperations } from '../core/services/VectorOperations';
import { EnhancedContextService } from '../core/services/EnhancedContextService';
import { EnhancedContext, ConversationMessage, Entity, Learning, Outcome } from '../core/types/Context';

const program = new Command();
let contextService: EnhancedContextService;

/**
 * Initialize the context service
 */
async function initializeService() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const openAiKey = process.env.OPENAI_API_KEY;
  
  if (!openAiKey) {
    console.error(chalk.red('Error: OPENAI_API_KEY environment variable is required'));
    process.exit(1);
  }

  const vectorOps = new DefaultVectorOperations();
  contextService = new EnhancedContextService(vectorOps, openAiKey, mongoUri);
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
    const spinner = ora('Creating context...').start();
    try {
      await initializeService();
      
      const context: EnhancedContext = {
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
      spinner.succeed(chalk.green(`Context created with ID: ${result.id}`));
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to create context: ${error.message}`));
    } finally {
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
    const spinner = ora('Fetching contexts...').start();
    try {
      await initializeService();
      
      let contexts: EnhancedContext[] = [];
      if (options.project) {
        contexts = await contextService.getContextsByProject(options.project);
      } else if (options.tags) {
        contexts = await contextService.getContextsByTags(options.tags.split(','));
      } else if (options.priority) {
        contexts = await contextService.getContextsByPriority(options.priority);
      } else {
        contexts = await contextService.exportContexts();
      }

      spinner.stop();
      
      if (contexts.length === 0) {
        console.log(chalk.yellow('No contexts found'));
        return;
      }

      contexts.forEach(context => {
        console.log(chalk.bold('\nContext:'));
        console.log(chalk.cyan(`ID: ${context.id}`));
        console.log(chalk.cyan(`Project: ${context.metadata.project}`));
        console.log(chalk.cyan(`Priority: ${context.metadata.priority}`));
        console.log(chalk.cyan(`Tags: ${context.metadata.tags.join(', ')}`));
        console.log(chalk.cyan(`Created: ${new Date(context.metadata.created).toLocaleString()}`));
        console.log(chalk.cyan(`Messages: ${context.conversation.thread.length}`));
        console.log(chalk.cyan(`Entities: ${context.knowledge.entities.length}`));
        console.log(chalk.cyan(`Learnings: ${context.knowledge.learnings.length}`));
      });
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to list contexts: ${error.message}`));
    } finally {
      await contextService?.close();
    }
  });

program
  .command('show <id>')
  .description('Show context details')
  .action(async (id) => {
    const spinner = ora('Fetching context...').start();
    try {
      await initializeService();
      
      const context = await contextService.getContext(id);
      if (!context) {
        spinner.fail(chalk.red('Context not found'));
        return;
      }

      spinner.stop();
      
      console.log(chalk.bold('\nContext Details:'));
      console.log(chalk.cyan(`ID: ${context.id}`));
      console.log(chalk.cyan(`Project: ${context.metadata.project}`));
      console.log(chalk.cyan(`Priority: ${context.metadata.priority}`));
      console.log(chalk.cyan(`Tags: ${context.metadata.tags.join(', ')}`));
      console.log(chalk.cyan(`Created: ${new Date(context.metadata.created).toLocaleString()}`));
      console.log(chalk.cyan(`Updated: ${new Date(context.metadata.updated).toLocaleString()}`));
      console.log(chalk.cyan(`Access Count: ${context.metadata.accessCount}`));
      
      console.log(chalk.bold('\nConversation:'));
      context.conversation.thread.forEach((msg, i) => {
        console.log(chalk.cyan(`\nMessage ${i + 1}:`));
        console.log(chalk.cyan(`Role: ${msg.role}`));
        console.log(chalk.cyan(`Content: ${msg.content}`));
        console.log(chalk.cyan(`Time: ${new Date(msg.timestamp).toLocaleString()}`));
      });

      console.log(chalk.bold('\nKnowledge Base:'));
      console.log(chalk.cyan('\nEntities:'));
      context.knowledge.entities.forEach(entity => {
        console.log(chalk.cyan(`- ${entity.type}: ${entity.name}`));
        console.log(chalk.cyan(`  ${entity.description}`));
      });

      console.log(chalk.cyan('\nLearnings:'));
      context.knowledge.learnings.forEach(learning => {
        console.log(chalk.cyan(`- ${learning.type}: ${learning.description}`));
        console.log(chalk.cyan(`  Confidence: ${learning.confidence}`));
      });
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to show context: ${error.message}`));
    } finally {
      await contextService?.close();
    }
  });

program
  .command('delete <id>')
  .description('Delete a context')
  .action(async (id) => {
    const spinner = ora('Deleting context...').start();
    try {
      await initializeService();
      
      const success = await contextService.deleteContext(id);
      if (success) {
        spinner.succeed(chalk.green('Context deleted successfully'));
      } else {
        spinner.fail(chalk.red('Context not found'));
      }
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to delete context: ${error.message}`));
    } finally {
      await contextService?.close();
    }
  });

program
  .command('add-message <contextId>')
  .description('Add a message to a context')
  .requiredOption('-c, --content <content>', 'Message content')
  .option('-r, --role <role>', 'Message role (user, assistant, system)', 'user')
  .action(async (contextId, options) => {
    const spinner = ora('Adding message...').start();
    try {
      await initializeService();
      
      const message: ConversationMessage = {
        id: Date.now().toString(),
        role: options.role as any,
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
      spinner.succeed(chalk.green('Message added successfully'));
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to add message: ${error.message}`));
    } finally {
      await contextService?.close();
    }
  });

program
  .command('find-similar <contextId>')
  .description('Find similar contexts')
  .option('-l, --limit <number>', 'Number of similar contexts to return', '5')
  .action(async (contextId, options) => {
    const spinner = ora('Finding similar contexts...').start();
    try {
      await initializeService();
      
      const results = await contextService.findSimilar(contextId, parseInt(options.limit));
      
      spinner.stop();
      
      if (results.length === 0) {
        console.log(chalk.yellow('No similar contexts found'));
        return;
      }

      results.forEach(({ context, similarity }) => {
        console.log(chalk.bold('\nSimilar Context:'));
        console.log(chalk.cyan(`ID: ${context.id}`));
        console.log(chalk.cyan(`Project: ${context.metadata.project}`));
        console.log(chalk.cyan(`Similarity: ${(similarity * 100).toFixed(2)}%`));
        console.log(chalk.cyan(`Tags: ${context.metadata.tags.join(', ')}`));
      });
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to find similar contexts: ${error.message}`));
    } finally {
      await contextService?.close();
    }
  });

program.parse(); 