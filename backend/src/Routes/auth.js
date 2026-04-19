import express from "express";
import { authController } from "../Controllers/authControllers.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", authController.signupEmploye);
router.post("/login", authController.loginEmploye);
router.post("/logout", authController.logoutEmploye);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

router.get("/verify", authController.verifyToken);

router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);

export default router;