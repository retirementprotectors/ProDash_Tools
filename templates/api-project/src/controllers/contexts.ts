import { Request, Response, NextFunction } from 'express';
import { ContextManager } from '@/core/ContextManager';
import { ApiError } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export class ContextController {
  private contextManager: ContextManager;

  constructor() {
    this.contextManager = new ContextManager();
  }

  public getAllContexts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const contexts = await this.contextManager.getAllContexts();
      res.json(contexts);
    } catch (error) {
      next(new ApiError(500, 'CONTEXT_FETCH_ERROR', 'Failed to fetch contexts'));
    }
  };

  public getContext = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const context = await this.contextManager.getContext(req.params.id);
      if (!context) {
        throw new ApiError(404, 'CONTEXT_NOT_FOUND', 'Context not found');
      }
      res.json(context);
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(500, 'CONTEXT_FETCH_ERROR', 'Failed to fetch context'));
      }
    }
  };

  public createContext = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const context = await this.contextManager.createContext(req.body);
      res.status(201).json(context);
    } catch (error) {
      next(new ApiError(500, 'CONTEXT_CREATE_ERROR', 'Failed to create context'));
    }
  };

  public updateContext = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const context = await this.contextManager.updateContext(req.params.id, req.body);
      if (!context) {
        throw new ApiError(404, 'CONTEXT_NOT_FOUND', 'Context not found');
      }
      res.json(context);
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(500, 'CONTEXT_UPDATE_ERROR', 'Failed to update context'));
      }
    }
  };

  public deleteContext = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const success = await this.contextManager.deleteContext(req.params.id);
      if (!success) {
        throw new ApiError(404, 'CONTEXT_NOT_FOUND', 'Context not found');
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(500, 'CONTEXT_DELETE_ERROR', 'Failed to delete context'));
      }
    }
  };

  async searchContexts(req: Request, res: Response): Promise<void> {
    const { query, metadata, dateRange } = req.body;
    const contexts = await this.contextManager.searchContexts(query, metadata, dateRange);
    res.json(contexts);
  }

  async batchCreateContexts(req: Request, res: Response): Promise<void> {
    const contextDataArray = req.body;
    const results = await Promise.all(
      contextDataArray.map(data => this.contextManager.createContext(data))
    );
    res.status(201).json(results);
  }

  async getContextHistory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const history = await this.contextManager.getContextHistory(id);
    if (!history) {
      throw new ApiError(404, 'NOT_FOUND', `Context history not found for ID: ${id}`);
    }
    res.json(history);
  }

  async restoreContextVersion(req: Request, res: Response): Promise<void> {
    const { id, version } = req.params;
    const restoredContext = await this.contextManager.restoreContextVersion(id, version);
    if (!restoredContext) {
      throw new ApiError(404, 'NOT_FOUND', `Context version not found: ${id}@${version}`);
    }
    res.json(restoredContext);
  }
} 