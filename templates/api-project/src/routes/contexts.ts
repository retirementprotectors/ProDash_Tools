import { Router } from 'express';
import { ContextController } from '@/controllers/contexts';
import { validateContext, validateSearch, validateBatchOperation } from '@/middleware/validation';

const router = Router();
const controller = new ContextController();

/**
 * @swagger
 * /api/contexts:
 *   get:
 *     summary: Get all contexts
 *     tags: [Contexts]
 *     responses:
 *       200:
 *         description: List of contexts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Context'
 */
router.get('/', controller.getAllContexts);

/**
 * @swagger
 * /api/contexts/{id}:
 *   get:
 *     summary: Get a context by ID
 *     tags: [Contexts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Context found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Context'
 *       404:
 *         description: Context not found
 */
router.get('/:id', controller.getContext);

/**
 * @swagger
 * /api/contexts:
 *   post:
 *     summary: Create a new context
 *     tags: [Contexts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Context'
 *     responses:
 *       201:
 *         description: Context created
 *       400:
 *         description: Invalid input
 */
router.post('/', validateContext, controller.createContext);

/**
 * @swagger
 * /api/contexts/{id}:
 *   put:
 *     summary: Update a context
 *     tags: [Contexts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Context'
 *     responses:
 *       200:
 *         description: Context updated
 *       404:
 *         description: Context not found
 */
router.put('/:id', validateContext, controller.updateContext);

/**
 * @swagger
 * /api/contexts/{id}:
 *   delete:
 *     summary: Delete a context
 *     tags: [Contexts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Context deleted
 *       404:
 *         description: Context not found
 */
router.delete('/:id', controller.deleteContext);

/**
 * @swagger
 * /api/contexts/search:
 *   post:
 *     summary: Search contexts
 *     tags: [Contexts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query: { type: string }
 *               metadata: { type: object }
 *               dateRange: {
 *                 type: object
 *                 properties:
 *                   start: { type: string, format: date-time }
 *                   end: { type: string, format: date-time }
 *               }
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/search', validateSearch, controller.searchContexts);

/**
 * @swagger
 * /api/contexts/batch:
 *   post:
 *     summary: Batch create contexts
 *     tags: [Contexts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Context'
 */
router.post('/batch', validateBatchOperation, controller.batchCreateContexts);

/**
 * @swagger
 * /api/contexts/{id}/history:
 *   get:
 *     summary: Get context version history
 *     tags: [Contexts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id/history', controller.getContextHistory);

/**
 * @swagger
 * /api/contexts/{id}/restore/{version}:
 *   post:
 *     summary: Restore context to specific version
 *     tags: [Contexts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:id/restore/:version', controller.restoreContextVersion);

export default router; 