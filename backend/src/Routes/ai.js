import express from 'express';
import { generatePlanningIA } from '../Controllers/aiControleers.js';
import { adminOnly } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /ai/generate-planning
 * Body: { date: "YYYY-MM-DD", saveToDb?: boolean }
 * Protected: admin only
 */
router.post('/generate-planning', ...adminOnly, generatePlanningIA);

export default router;