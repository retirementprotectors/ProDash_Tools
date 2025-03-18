import { Router } from 'express';
import { EnhancedContextService, createContextRoutes as createBaseContextRoutes, EnhancedContext } from 'prodash-tools';

export function createContextRoutes(contextService: EnhancedContextService) {
  const router = Router();
  
  // Use the base context routes
  router.use('/', createBaseContextRoutes(contextService));

  // Add any custom routes here
  router.get('/stats', async (req, res) => {
    try {
      const contexts = await contextService.exportContexts();
      const stats = {
        total: contexts.length,
        byPriority: contexts.reduce((acc: Record<string, number>, ctx: EnhancedContext) => {
          acc[ctx.metadata.priority] = (acc[ctx.metadata.priority] || 0) + 1;
          return acc;
        }, {}),
        byProject: contexts.reduce((acc: Record<string, number>, ctx: EnhancedContext) => {
          acc[ctx.metadata.project] = (acc[ctx.metadata.project] || 0) + 1;
          return acc;
        }, {})
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
} 