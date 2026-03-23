import express from 'express';
import busController from '../Controllers/busControllers.js';

const router = express.Router();

// Définition des routes
router.post('/ajouter', busController.ajouterBus);
router.post('/modifier/:id', busController.modifierBus); 
router.post('/statut/:id', busController.setStatutBus); 
router.get('/lister', busController.listerBus);

export default router;