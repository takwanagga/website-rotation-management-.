import express from "express";
import EmployeController from "../Controllers/employeController.js";
import employemodel from "../models/employe.js";

const router = express.Router();

router.post("/signup", EmployeController.signupEmploye) 
router.post("/login", EmployeController.loginEmploye)
router.post("/forgot-password", EmployeController.forgotPassword)
router.post("/ajouter", EmployeController.ajouterEmploye)
router.post("/modifier/:id", EmployeController.modifierEmploye)
router.get("/supprimer/:id", EmployeController.supprimerEmploye)
router.get("/lister", EmployeController.listerEmploye)

export default router;