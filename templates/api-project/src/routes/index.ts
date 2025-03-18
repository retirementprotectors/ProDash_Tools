import { Application } from 'express';
import { EnhancedContextService } from 'prodash-tools';
import { registerAuthRoutes } from './auth';
import { registerUserRoutes } from './user';
import { registerProjectRoutes } from './project';

export function registerRoutes(app: Application, contextService: EnhancedContextService) {
  // Register all route modules
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerProjectRoutes(app, contextService);
} 