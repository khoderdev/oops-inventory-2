import express from "express";
import authController from "../controllers/authController.js";
import { authenticate, auditAction } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/login", auditAction("login", "authentication"), authController.login);

// Protected routes (authentication required)
router.use(authenticate); // All routes below require authentication

router.post("/logout", auditAction("logout", "authentication"), authController.logout);
router.post("/logout-all", auditAction("logout_all", "authentication"), authController.logoutAll);
router.get("/profile", authController.getProfile);
router.put("/profile", auditAction("profile_update", "user"), authController.updateProfile);
router.put("/change-password", auditAction("password_change", "authentication"), authController.changePassword);
router.post("/refresh-token", auditAction("token_refresh", "authentication"), authController.refreshToken);
router.post("/verify-pin", auditAction("pin_verification", "authentication"), authController.verifyPin);
router.put("/change-pin", auditAction("pin_change", "authentication"), authController.changePin);
router.put("/reset-user-pin/:userId", auditAction("admin_pin_reset", "authentication"), authController.resetUserPin);
router.get("/sessions", authController.getSessions);
router.delete("/sessions/:sessionId", auditAction("session_revoke", "authentication"), authController.revokeSession);

export default router;
