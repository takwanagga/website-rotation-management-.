import express from 'express';
import planningControllers from '../Controllers/planningControllers.js';
 
const router = express.Router();
 // filterer les plannings par date, employé, ligne ou bus
router.get('/range', planningControllers.listerPlanningParDateRange);
router.get('/employe/:employeId', planningControllers.listerPlanningParEmploye);
router.get('/ligne/:ligneId', planningControllers.listerPlanningParLigne);
router.get('/bus/:busId', planningControllers.listerPlanningParBus);
 // CRUD planning
router.post('/ajouter', planningControllers.ajouterPlanning);
router.post('/modifier/:id', planningControllers.modifierPlanning);
router.delete('/supprimer/:id', planningControllers.supprimerPlanning);
router.post('/publier/:id', planningControllers.publierPlanning);
  
router.get('/:id', planningControllers.obtenirPlanningParId);
 
export default router;