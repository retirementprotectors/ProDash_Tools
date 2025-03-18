import express, { Request, Response, NextFunction } from 'express';
import { param, query } from 'express-validator';
import { BackupManager } from '@/core/BackupManager';
import { validateResults } from '@/middleware/validation';
import logger from '@/utils/logger';

const router = express.Router();
const backupManager = new BackupManager();

/**
 * @swagger
 * /api/backups:
 *   get:
 *     summary: List all backups
 *     tags: [Backups]
 *     responses:
 *       200:
 *         description: List of backups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Backup'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backups = await backupManager.listBackups();
    res.json(backups);
  } catch (error) {
    logger.error('Error listing backups:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/backups:
 *   post:
 *     summary: Create a new backup
 *     tags: [Backups]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Optional name for the backup
 *     responses:
 *       201:
 *         description: Backup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Backup'
 */
router.post('/', [
  query('name').optional().isString().trim(),
  validateResults
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backup = await backupManager.createBackup(req.query.name as string);
    res.status(201).json(backup);
  } catch (error) {
    logger.error('Error creating backup:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/backups/{id}:
 *   get:
 *     summary: Download a specific backup
 *     tags: [Backups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backup file
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id', [
  param('id').isString().notEmpty(),
  validateResults
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backupPath = `${req.params.id}.zip`;
    res.download(backupPath, (error) => {
      if (error) {
        logger.error(`Error downloading backup ${req.params.id}:`, error);
        next(error);
      }
    });
  } catch (error) {
    logger.error(`Error getting backup ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/backups/{id}:
 *   delete:
 *     summary: Delete a backup
 *     tags: [Backups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Backup deleted successfully
 */
router.delete('/:id', [
  param('id').isString().notEmpty(),
  validateResults
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await backupManager.deleteBackup(req.params.id);
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Backup not found' });
    }
  } catch (error) {
    logger.error(`Error deleting backup ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * @swagger
 * /api/backups/{id}/restore:
 *   post:
 *     summary: Restore from a backup
 *     tags: [Backups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backup restored successfully
 */
router.post('/:id/restore', [
  param('id').isString().notEmpty(),
  validateResults
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    await backupManager.restoreBackup(req.params.id);
    res.json({ message: 'Backup restored successfully' });
  } catch (error) {
    logger.error(`Error restoring backup ${req.params.id}:`, error);
    next(error);
  }
});

export default router; 