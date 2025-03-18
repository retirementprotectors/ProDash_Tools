import { Router } from 'express';
import { BackupManager } from '../core/BackupManager';
import { ContextManager } from '../core/ContextManager';
import * as fs from 'fs';
import * as path from 'path';

export function backupRoutes(
  backupManager: BackupManager,
  contextManager: ContextManager
) {
  const router = Router();
  
  // Get all backups
  router.get('/', async (req, res) => {
    try {
      const backups = await backupManager.listBackups();
      res.json(backups);
    } catch (error) {
      console.error('Error listing backups:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Create a backup
  router.post('/', async (req, res) => {
    try {
      // Get all contexts to back up
      const contexts = await contextManager.getAllContexts();
      const backup = await backupManager.createBackup(contexts);
      res.status(201).json({ backupFile: backup });
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Restore from a backup
  router.post('/restore', async (req, res) => {
    try {
      const { backupFile } = req.body;
      
      if (!backupFile) {
        return res.status(400).json({ error: 'Backup file is required' });
      }
      
      const contexts = await backupManager.restoreBackup(backupFile);
      
      // Replace all existing contexts with the ones from the backup
      await contextManager.clearAllContexts();
      
      // Add each context from the backup
      let contextCount = 0;
      for (const context of contexts) {
        // Since we don't know the exact structure required by addContext,
        // we'll pass the entire context object and let the manager handle it
        await contextManager.addContext(context as any);
        contextCount++;
      }
      
      res.json({ 
        message: 'Backup restored successfully',
        contextCount 
      });
    } catch (error) {
      console.error('Error restoring from backup:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Delete a backup
  router.delete('/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      // Check if the file exists before trying to delete it
      const backups = await backupManager.listBackups();
      const exists = Array.isArray(backups) && backups.some((backup: any) => 
        typeof backup === 'string' && backup.indexOf(filename) >= 0
      );
      
      if (!exists) {
        return res.status(404).json({ error: 'Backup not found' });
      }
      
      // Use filesystem module to delete the file since BackupManager doesn't have deleteFile
      const backupDir = path.resolve(process.cwd(), '.context-keeper', 'backups');
      const backupPath = path.join(backupDir, filename);
      
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
        res.json({ message: 'Backup deleted successfully' });
      } else {
        res.status(404).json({ error: 'Backup file not found' });
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Get backup configuration
  router.get('/config', (req, res) => {
    try {
      const config = backupManager.getBackupConfig();
      res.json(config);
    } catch (error) {
      console.error('Error getting backup configuration:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Update backup configuration
  router.put('/config', async (req, res) => {
    try {
      backupManager.setBackupConfig(req.body);
      const updatedConfig = backupManager.getBackupConfig();
      res.json(updatedConfig);
    } catch (error) {
      console.error('Error updating backup configuration:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  return router;
} 