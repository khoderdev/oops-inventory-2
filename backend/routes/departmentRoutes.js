// routes/departmentRoutes.js
import express from "express";
import { getAllDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment, getDepartmentStats } from "../controllers/departmentController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticate);

// Public routes (read-only)
router.get("/", getAllDepartments);
router.get("/stats", getDepartmentStats);
router.get("/:id", getDepartmentById);

// Protected routes (require admin privileges)
router.post("/", requireRole(["admin", "manager"]), createDepartment);
router.put("/:id", requireRole(["admin", "manager"]), updateDepartment);
router.delete("/:id", requireRole(["admin"]), deleteDepartment);

export default router;
