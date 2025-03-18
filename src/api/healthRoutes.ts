import { Router } from 'express';
import { ContextManager } from '../core/ContextManager';
import { BackupManager } from '../core/BackupManager';

export function healthRoutes(
  contextManager: ContextManager,
  backupManager: BackupManager
) {
  const router = Router();
  
  // Get overall system health status
  router.get('/', async (req, res) => {
    try {
      const contextStatus = contextManager.isInitialized();
      const backupStatus = backupManager.isInitialized ? backupManager.isInitialized() : true;
      
      const systemHealth = {
        status: 'healthy',
        services: {
          contextManager: { status: contextStatus ? 'online' : 'offline' },
          backupManager: { status: backupStatus ? 'online' : 'offline' }
        },
        alerts: {
          count: 0,
          items: []
        }
      };
      
      // If any core service is offline, mark system as degraded
      if (!contextStatus || !backupStatus) {
        systemHealth.status = 'degraded';
      }
      
      res.json(systemHealth);
    } catch (error) {
      console.error('Error checking system health:', error);
      res.status(500).json({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Get context manager status
  router.get('/context-manager', async (req, res) => {
    try {
      const isInitialized = contextManager.isInitialized();
      const contextsCount = await contextManager.getContextCount();
      
      res.json({
        status: isInitialized ? 'online' : 'offline',
        contextsCount,
        initialized: isInitialized
      });
    } catch (error) {
      console.error('Error checking context manager health:', error);
      res.status(500).json({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Get backup manager status
  router.get('/backup-manager', async (req, res) => {
    try {
      const isInitialized = backupManager.isInitialized ? backupManager.isInitialized() : true;
      const backups = await backupManager.listBackups();
      
      res.json({
        status: isInitialized ? 'online' : 'offline',
        backupsCount: backups.length,
        latestBackup: backups.length > 0 ? backups[0] : null,
        initialized: isInitialized,
        config: backupManager.getBackupConfig()
      });
    } catch (error) {
      console.error('Error checking backup manager health:', error);
      res.status(500).json({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  return router;
} 