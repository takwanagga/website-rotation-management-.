import express from 'express';
<<<<<<< HEAD
import { adminOnly, tousLesRoles } from '../middleware/auth.js';
import { getAdminStats, getEmployeeWorkHours } from '../Controllers/statsControllers.js';
=======
import { adminOnly } from '../middleware/auth.js';
import { getAdminStats } from '../Controllers/statsControllers.js';
>>>>>>> a49756bd5b0272b7aa8892ab327a7c1a3b40d74a

const router = express.Router();

router.get('/admin', adminOnly, getAdminStats);
<<<<<<< HEAD
router.get('/employee-hours/:employeeId', tousLesRoles, getEmployeeWorkHours);
=======
>>>>>>> a49756bd5b0272b7aa8892ab327a7c1a3b40d74a

export default router;
