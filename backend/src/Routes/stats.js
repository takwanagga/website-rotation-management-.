import express from 'express';
import { adminOnly } from '../middleware/auth.js';
import { getAdminStats } from '../Controllers/statsControllers.js';

const router = express.Router();

router.get('/admin', adminOnly, getAdminStats);

export default router;
