import { Router } from 'express';
import { MonitoringService } from '../core/MonitoringService';

export function monitoringRoutes(monitoringService: MonitoringService) {
  const router = Router();
  
  // Get all metrics
  router.get('/metrics', async (req, res) => {
    try {
      const metrics = await monitoringService.getMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error getting metrics:', error);
      res.status(500).json({ 
        error: 'Failed to get metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get all alerts
  router.get('/alerts', async (req, res) => {
    try {
      const alerts = await monitoringService.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error getting alerts:', error);
      res.status(500).json({ 
        error: 'Failed to get alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Acknowledge an alert
  router.post('/alerts/:id/acknowledge', async (req, res) => {
    try {
      const alertId = req.params.id;
      await monitoringService.acknowledgeAlert(alertId);
      
      res.json({ 
        message: 'Alert acknowledged successfully',
        alertId
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      res.status(500).json({ 
        error: 'Failed to acknowledge alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Resolve an alert
  router.post('/alerts/:id/resolve', async (req, res) => {
    try {
      const alertId = req.params.id;
      await monitoringService.resolveAlert(alertId);
      
      res.json({ 
        message: 'Alert resolved successfully',
        alertId
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({ 
        error: 'Failed to resolve alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get monitoring configuration
  router.get('/config', async (req, res) => {
    try {
      const config = monitoringService.getMonitoringConfig();
      res.json(config);
    } catch (error) {
      console.error('Error getting monitoring configuration:', error);
      res.status(500).json({ 
        error: 'Failed to get monitoring configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update monitoring configuration
  router.post('/config', async (req, res) => {
    try {
      const config = req.body;
      monitoringService.setMonitoringConfig(config);
      
      // Return the updated config
      const updatedConfig = monitoringService.getMonitoringConfig();
      res.json({ 
        message: 'Monitoring configuration updated successfully',
        config: updatedConfig
      });
    } catch (error) {
      console.error('Error updating monitoring configuration:', error);
      res.status(500).json({ 
        error: 'Failed to update monitoring configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Manually trigger a health check
  router.post('/check', async (req, res) => {
    try {
      const result = await monitoringService.runHealthCheck();
      res.json({ 
        message: 'Health check completed',
        result
      });
    } catch (error) {
      console.error('Error running health check:', error);
      res.status(500).json({ 
        error: 'Failed to run health check',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  return router;
} 