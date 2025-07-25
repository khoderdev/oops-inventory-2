import express from "express";
import userController from "../controllers/userController.js";
import { auditAction, authenticate, requireOwnershipOrRole, requirePermission, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin/manager only)
router.get("/", requirePermission("users.read"), userController.getAllUsers);

// Create new user (admin only)
router.post("/", requirePermission("users.create"), auditAction("user_create", "user"), userController.createUser);

// Get user by ID (admin/manager or self)
router.get("/:id", requireOwnershipOrRole("id", ["admin", "manager"]), userController.getUserById);

// Update user (admin/manager or self with restrictions)
router.put("/:id", requireOwnershipOrRole("id", ["admin", "manager"]), auditAction("user_update", "user"), userController.updateUser);

// Delete user (admin only)
router.delete("/:id", requirePermission("users.delete"), auditAction("user_delete", "user"), userController.deleteUser);

// Reset user password (admin/manager only)
router.put("/:id/reset-password", requireRole(["admin", "manager"]), auditAction("password_reset", "user"), userController.resetUserPassword);

// Unlock user account (admin only)
router.put("/:id/unlock", requireRole("admin"), auditAction("user_unlock", "user"), userController.unlockUser);

// Get user activity logs (admin/manager or self)
router.get("/:id/activity", requireOwnershipOrRole("id", ["admin", "manager"]), userController.getUserActivity);

export default router;
