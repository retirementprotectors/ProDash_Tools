import { Router } from 'express';
import { GitIntegration } from '../core/GitIntegration';

export function gitRoutes(gitIntegration: GitIntegration) {
  const router = Router();
  
  // Get the current Git configuration
  router.get('/config', async (req, res) => {
    try {
      const config = gitIntegration.getConfig();
      res.json(config);
    } catch (error) {
      console.error('Error getting Git configuration:', error);
      res.status(500).json({ 
        error: 'Failed to get Git configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update the Git configuration
  router.post('/config', async (req, res) => {
    try {
      const config = req.body;
      gitIntegration.setConfig(config);
      
      // Return the updated config
      const updatedConfig = gitIntegration.getConfig();
      res.json({ 
        message: 'Git configuration updated successfully',
        config: updatedConfig
      });
    } catch (error) {
      console.error('Error updating Git configuration:', error);
      res.status(500).json({ 
        error: 'Failed to update Git configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Manually trigger a Git commit
  router.post('/commit', async (req, res) => {
    try {
      const success = await gitIntegration.commitContextChanges();
      
      if (success) {
        res.json({ message: 'Changes committed successfully' });
      } else {
        res.status(400).json({ message: 'No changes to commit or Git integration is disabled' });
      }
    } catch (error) {
      console.error('Error committing changes:', error);
      res.status(500).json({ 
        error: 'Failed to commit changes',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Manually trigger a Git push
  router.post('/push', async (req, res) => {
    try {
      const success = await gitIntegration.pushChanges();
      
      if (success) {
        res.json({ message: 'Changes pushed successfully' });
      } else {
        res.status(400).json({ message: 'Push failed or Git integration is not configured for remote' });
      }
    } catch (error) {
      console.error('Error pushing changes:', error);
      res.status(500).json({ 
        error: 'Failed to push changes',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Initialize a new Git repository
  router.post('/init', async (req, res) => {
    try {
      const success = await gitIntegration.initializeRepository();
      
      if (success) {
        res.json({ message: 'Git repository initialized successfully' });
      } else {
        res.status(400).json({ message: 'Failed to initialize Git repository' });
      }
    } catch (error) {
      console.error('Error initializing Git repository:', error);
      res.status(500).json({ 
        error: 'Failed to initialize Git repository',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  return router;
} 