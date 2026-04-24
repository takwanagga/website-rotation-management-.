import express from 'express';
import { adminOnly, tousLesRoles } from '../middleware/auth.js';
import { getAdminStats, getEmployeeWorkHours } from '../Controllers/statsControllers.js';



const router = express.Router();

router.get('/admin', adminOnly, getAdminStats);

router.get('/employee-hours/:employeeId', tousLesRoles, getEmployeeWorkHours);


export default router;
