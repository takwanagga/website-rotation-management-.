// routes/employe.js
import express from "express";
import { employeController } from "../Controllers/employeController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// ── Routes admin uniquement ───────────────────────────────────────────────────
router.post(  "/ajouter", authenticate, authorize("admin"), employeController.ajouterEmploye);
router.post(   "/modifier/:id",   authenticate, authorize("admin"), employeController.modifierEmploye);
router.post("/supprimer/:id",  authenticate, authorize("admin"), employeController.supprimerEmploye);

// ── Lister : tous les rôles connectés ────────────────────────────────────────
router.get("/lister", authenticate, authorize("admin"), employeController.listerEmploye);

export default router;