import express from 'express';
import notificationControllers from '../Controllers/notificationControllers.js';

const router = express.Router();

// ── CRUD ──────────────────────────────────────────────────────────────────────
router.post('/ajouter', notificationControllers.ajouterNotification);
router.delete('/supprimer/:id', notificationControllers.supprimerNotification);

// ── Statut ────────────────────────────────────────────────────────────────────
router.post('/vue/:id', notificationControllers.marquerVue);
router.get('/vue/:id/statut', notificationControllers.verifierSiVue);
router.post('/supprime/:id', notificationControllers.marquerSupprime);
router.get('/supprime/:id/statut', notificationControllers.verifierSiSupprime);

// ── Lister ────────────────────────────────────────────────────────────────────
router.get('/destinataire/:destinataireId', notificationControllers.listerNotificationsParDestinataire);
router.get('/nonvues/:destinataireId', notificationControllers.listerNotificationsNonVues);

// ── Par ID (last to avoid shadowing named routes) ──────────────────────────────
router.get('/:id', notificationControllers.obtenirNotificationParId);

export default router;