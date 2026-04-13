// routes/employe.js
import express from "express";
import { employeController } from "../Controllers/employeController.js";
import { authenticate, authorize, adminOnly, tousLesRoles } from "../middleware/auth.js";

const router = express.Router();

// ── Routes admin uniquement ───────────────────────────────────────────────────
router.post(  "/ajouter",        ...adminOnly, employeController.ajouterEmploye);
router.put(   "/modifier/:id",   ...adminOnly, employeController.modifierEmploye);
router.delete("/supprimer/:id",  ...adminOnly, employeController.supprimerEmploye);

// ── Lister : tous les rôles connectés ────────────────────────────────────────
router.get("/lister", ...tousLesRoles, employeController.listerEmploye);

export default router;