import express from 'express';
import { adminOnly } from '../middleware/auth.js';
import settingsControllers from '../Controllers/settingsControllers.js';

const router = express.Router();

router.get('/', adminOnly, settingsControllers.getSettings);
router.post('/', adminOnly, settingsControllers.updateSettings);

export default router;
