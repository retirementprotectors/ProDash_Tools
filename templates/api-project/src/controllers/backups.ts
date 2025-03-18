import { Request, Response, NextFunction } from 'express';
import { BackupManager } from '@/core/BackupManager';
import { ApiError } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export class BackupController {
  private backupManager: BackupManager;

  constructor() {
    this.backupManager = new BackupManager();
  }

  public listBackups = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const backups = await this.backupManager.listBackups();
      res.json(backups);
    } catch (error) {
      next(new ApiError(500, 'BACKUP_LIST_ERROR', 'Failed to list backups'));
    }
  };

  public createBackup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const backup = await this.backupManager.createBackup();
      res.status(201).json(backup);
    } catch (error) {
      next(new ApiError(500, 'BACKUP_CREATE_ERROR', 'Failed to create backup'));
    }
  };

  public downloadBackup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const backup = await this.backupManager.getBackup(req.params.id);
      if (!backup) {
        throw new ApiError(404, 'BACKUP_NOT_FOUND', 'Backup not found');
      }
      res.json(backup);
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(500, 'BACKUP_DOWNLOAD_ERROR', 'Failed to download backup'));
      }
    }
  };

  public restoreBackup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const success = await this.backupManager.restoreBackup(req.params.id);
      if (!success) {
        throw new ApiError(404, 'BACKUP_NOT_FOUND', 'Backup not found');
      }
      res.json({ message: 'Backup restored successfully' });
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(500, 'BACKUP_RESTORE_ERROR', 'Failed to restore backup'));
      }
    }
  };
} 