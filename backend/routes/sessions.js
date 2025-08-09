import express from "express";
import sessionController from "../controllers/sessionController.js";
import { authenticate, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

// All session management routes require authentication and admin permissions
router.use(authenticate);

// Get all active sessions
router.get("/", requirePermission("auth.manageSessions"), sessionController.getActiveSessions);

// Get online users in real-time
router.get("/online", requirePermission("auth.manageSessions"), sessionController.getOnlineUsers);

// Get session statistics
router.get("/stats", requirePermission("auth.manageSessions"), sessionController.getSessionStats);

// Get session activity timeline
router.get("/activity", requirePermission("auth.manageSessions"), sessionController.getSessionActivity);

// Get specific user's sessions
router.get("/user/:userId", requirePermission("auth.manageSessions"), sessionController.getUserSessions);

// Force logout user from all devices
router.post("/user/:userId/logout", requirePermission("auth.manageSessions"), sessionController.forceLogoutUser);

// Force logout user from specific device
router.post("/user/:userId/device/:deviceId/logout", requirePermission("auth.manageSessions"), sessionController.forceLogoutDevice);

// Cleanup expired sessions manually
router.post("/cleanup", requirePermission("auth.manageSessions"), sessionController.cleanupSessions);

export default router;
