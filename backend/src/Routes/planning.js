import express from 'express';
import planningControllers from '../Controllers/planningControllers.js';
 
const router = express.Router();
 
// Routes CRUD de base
router.post('/ajouter', planningControllers.ajouterPlanning);
router.post('/modifier/:id', planningControllers.modifierPlanning);
router.delete('/supprimer/:id', planningControllers.supprimerPlanning);
router.get('/range', planningControllers.listerPlanningParDateRange);
router.get('/:id', planningControllers.obtenirPlanningParId);
router.post('/publier/:id', planningControllers.publierPlanning);
 
// Routes de filtrage par ressource
router.get('/employe/:employeId', planningControllers.listerPlanningParEmploye);
router.get('/ligne/:ligneId', planningControllers.listerPlanningParLigne);
router.get('/bus/:busId', planningControllers.listerPlanningParBus);
 
export default router;