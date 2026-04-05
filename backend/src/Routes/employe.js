import express from "express";
import {
  signupEmploye,
  ajouterEmploye,
  loginEmploye,
  modifierEmploye,
  supprimerEmploye,
  listerEmploye,
  forgotPassword,
  getCurrentUser,
} from "../Controllers/employeController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signupEmploye);
router.post("/login", loginEmploye);
router.post("/forgot-password", forgotPassword);
router.get("/me", authenticate, getCurrentUser);
router.get("/verify", authenticate, getCurrentUser);
router.post("/ajouter", authenticate, authorize(["admin"]), ajouterEmploye);
router.post("/modifier/:id", authenticate, authorize(["admin"]), modifierEmploye);
router.get("/supprimer/:id", authenticate, authorize(["admin"]), supprimerEmploye);
router.get("/lister", authenticate, listerEmploye);

export default router;