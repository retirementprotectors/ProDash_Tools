import { Application, Request, Response } from 'express';
import { EnhancedContextService, EnhancedContext } from 'prodash-tools';
import { validateApiKey } from '../middleware/auth';

interface ProjectStats {
  name: string;
  contextCount: number;
  latestUpdate: number;
  tags: Set<string>;
}

export function registerProjectRoutes(app: Application, contextService: EnhancedContextService) {
  /**
   * @swagger
   * /api/projects:
   *   get:
   *     summary: Get all projects with their contexts
   *     tags: [Projects]
   *     security:
   *       - ApiKeyAuth: []
   *     responses:
   *       200:
   *         description: List of projects with their contexts
   */
  app.get('/api/projects', validateApiKey, async (req: Request, res: Response) => {
    try {
      const contexts = await contextService.exportContexts();
      const projects = contexts.reduce((acc: Record<string, ProjectStats>, ctx: EnhancedContext) => {
        const project = ctx.metadata.project;
        if (!acc[project]) {
          acc[project] = {
            name: project,
            contextCount: 0,
            latestUpdate: 0,
            tags: new Set<string>()
          };
        }
        acc[project].contextCount++;
        acc[project].latestUpdate = Math.max(acc[project].latestUpdate, ctx.metadata.updated);
        ctx.metadata.tags.forEach((tag: string) => acc[project].tags.add(tag));
        return acc;
      }, {});

      // Convert Sets to arrays for JSON serialization
      const entries = Object.entries(projects) as [string, ProjectStats][];
      const result = entries.map(([name, stats]) => ({
        name,
        contextCount: stats.contextCount,
        latestUpdate: stats.latestUpdate,
        tags: Array.from(stats.tags)
      }));

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/projects/{project}/contexts:
   *   get:
   *     summary: Get all contexts for a specific project
   *     tags: [Projects]
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: project
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of contexts for the project
   */
  app.get('/api/projects/:project/contexts', validateApiKey, async (req: Request, res: Response) => {
    try {
      const contexts = await contextService.getContextsByProject(req.params.project);
      res.json(contexts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/projects/{project}/stats:
   *   get:
   *     summary: Get statistics for a specific project
   *     tags: [Projects]
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: project
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Project statistics
   */
  app.get('/api/projects/:project/stats', validateApiKey, async (req: Request, res: Response) => {
    try {
      const contexts = await contextService.getContextsByProject(req.params.project);
      const stats = {
        contextCount: contexts.length,
        messageCount: contexts.reduce((sum: number, ctx: EnhancedContext) => sum + ctx.conversation.thread.length, 0),
        entityCount: contexts.reduce((sum: number, ctx: EnhancedContext) => sum + ctx.knowledge.entities.length, 0),
        learningCount: contexts.reduce((sum: number, ctx: EnhancedContext) => sum + ctx.knowledge.learnings.length, 0),
        tags: Array.from(new Set(contexts.flatMap((ctx: EnhancedContext) => ctx.metadata.tags))),
        priorities: contexts.reduce((acc: Record<string, number>, ctx: EnhancedContext) => {
          acc[ctx.metadata.priority] = (acc[ctx.metadata.priority] || 0) + 1;
          return acc;
        }, {})
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
} 