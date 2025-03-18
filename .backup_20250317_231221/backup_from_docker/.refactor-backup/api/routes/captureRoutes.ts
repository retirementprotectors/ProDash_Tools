import { Router } from 'express';
import { ContextCaptureService } from '../core/ContextCaptureService';

export function captureRoutes(captureService: ContextCaptureService) {
  const router = Router();
  
  // Get the current capture configuration
  router.get('/config', async (req, res) => {
    try {
      const config = captureService.getConfig();
      res.json(config);
    } catch (error) {
      console.error('Error getting capture configuration:', error);
      res.status(500).json({ 
        error: 'Failed to get capture configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update the capture configuration
  router.post('/config', async (req, res) => {
    try {
      const config = req.body;
      captureService.setConfig(config);
      
      // Return the updated config
      const updatedConfig = captureService.getConfig();
      res.json({ 
        message: 'Capture configuration updated successfully',
        config: updatedConfig
      });
    } catch (error) {
      console.error('Error updating capture configuration:', error);
      res.status(500).json({ 
        error: 'Failed to update capture configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get all active sessions
  router.get('/sessions', async (req, res) => {
    try {
      const sessions = captureService.getActiveSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error getting active sessions:', error);
      res.status(500).json({ 
        error: 'Failed to get active sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get a specific session
  router.get('/sessions/:id', async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = captureService.getSession(sessionId);
      
      if (session) {
        res.json(session);
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({ 
        error: 'Failed to get session',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Register a new session
  router.post('/sessions', async (req, res) => {
    try {
      const { sessionId, initialContent, projectPath } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      captureService.registerSession(sessionId, initialContent, projectPath);
      res.json({ message: 'Session registered successfully' });
    } catch (error) {
      console.error('Error registering session:', error);
      res.status(500).json({ 
        error: 'Failed to register session',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update an existing session
  router.put('/sessions/:id', async (req, res) => {
    try {
      const sessionId = req.params.id;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }
      
      captureService.updateSession(sessionId, content);
      res.json({ message: 'Session updated successfully' });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ 
        error: 'Failed to update session',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // End a session
  router.delete('/sessions/:id', async (req, res) => {
    try {
      const sessionId = req.params.id;
      const captureContent = req.query.capture === 'true';
      
      const success = await captureService.endSession(sessionId, captureContent);
      
      if (success) {
        res.json({ message: 'Session ended and content captured successfully' });
      } else {
        res.json({ message: 'Session ended without capturing content' });
      }
    } catch (error) {
      console.error('Error ending session:', error);
      res.status(500).json({ 
        error: 'Failed to end session',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Manually capture a specific session
  router.post('/sessions/:id/capture', async (req, res) => {
    try {
      const sessionId = req.params.id;
      const metadata = req.body.metadata || {};
      
      const success = await captureService.captureSession(sessionId, metadata);
      
      if (success) {
        res.json({ message: 'Session captured successfully' });
      } else {
        res.status(400).json({ message: 'Failed to capture session or session not found' });
      }
    } catch (error) {
      console.error('Error capturing session:', error);
      res.status(500).json({ 
        error: 'Failed to capture session',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Manually capture all active sessions
  router.post('/capture-all', async (req, res) => {
    try {
      const capturedCount = await captureService.captureAllSessions();
      
      res.json({ 
        message: 'Capture completed',
        capturedCount
      });
    } catch (error) {
      console.error('Error capturing all sessions:', error);
      res.status(500).json({ 
        error: 'Failed to capture all sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  return router;
} 