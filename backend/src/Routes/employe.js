// routes/employe.js
import express from "express";
import {employeController} from "../Controllers/employeController.js";
import { authenticate, authorize, adminOnly, tousLesRoles } from "../middleware/auth.js";

const router = express.Router();

// ── Routes publiques (sans connexion) ────────────────────────────────────────
router.post("/signup",employeController.signupEmploye);
router.post("/login",employeController.loginEmploye);
router.post("/logout",employeController.logoutEmploye);
router.post("/forgot-password", employeController.forgotPassword);

// ── Routes protégées (connecté) ───────────────────────────────────────────────
router.get("/me",     authenticate, employeController.getCurrentUser);
router.get("/verify", authenticate, getCurrentUser);

// ── Routes admin uniquement ───────────────────────────────────────────────────
// ✅ Correction : authorize('admin') sans tableau imbriqué inutile
// ✅ Correction : PUT pour modifier, DELETE pour supprimer
router.post(  "/ajouter",        ...adminOnly, employeController.ajouterEmploye);
router.put(   "/modifier/:id",   ...adminOnly, employeController.modifierEmploye);  // ✅ POST → PUT
router.delete("/supprimer/:id",  ...adminOnly, employeController.supprimerEmploye); // ✅ GET → DELETE

// ── Lister : tous les rôles connectés ────────────────────────────────────────
router.get("/lister", ...tousLesRoles, employeController.listerEmploye);

export default router;