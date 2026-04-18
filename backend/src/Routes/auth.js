import express from "express";
import { authController } from "../Controllers/authControllers.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// ── Routes publiques (sans connexion) ─────────────────────────────────────────
router.post("/signup", authController.signupEmploye);
router.post("/login", authController.loginEmploye);
router.post("/logout", authController.logoutEmploye);

// Mot de passe oublié — envoie un email avec un lien de reset
router.post("/forgot-password", authController.forgotPassword);

// Réinitialisation du mot de passe avec le token reçu par email
router.post("/reset-password/:token", authController.resetPassword);

router.get("/verify", authController.verifyToken);

// ── Routes protégées (connecté) ───────────────────────────────────────────────
router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);

export default router;