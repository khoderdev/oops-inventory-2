import express from "express";
import attendanceController from "../controllers/attendanceController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (for kiosk/check-in stations)
router.post("/check-in", attendanceController.checkIn);
router.post("/check-out", attendanceController.checkOut);

// Protected routes (for management)
router.get("/status", authenticate, attendanceController.getCurrentAttendanceStatus);
router.get("/employee/:employeeId", authenticate, attendanceController.getEmployeeAttendance);
router.post("/generate-code/:employeeId", authenticate, requireRole("admin", "manager"), attendanceController.generateAttendanceCode);

export default router;
