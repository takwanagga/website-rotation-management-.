import express from 'express';
import ligneController from '../Controllers/ligneControllers.js';

const router = express.Router();


router.post('/ajouter', ligneController.ajouterLigne);
router.post('/modifier/:id', ligneController.modifierLigne);
router.post('/statut/:id', ligneController.setStatutLigne);
router.get('/lister', ligneController.listerLigne);

export default router;