import express from "express";
import attendanceController from "../controllers/attendanceController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (for kiosk/check-in stations)
router.post("/check-in", attendanceController.checkIn);
router.post("/check-out", attendanceController.checkOut);

// Protected routes (for management)
router.get("/status", authenticate, (req, res, next) => {
  if (req.query.employeeId) {
    // If employeeId is provided, get specific employee status
    return attendanceController.getEmployeeStatus(req, res);
  } else {
    // Otherwise, get all employees status
    return attendanceController.getCurrentAttendanceStatus(req, res);
  }
});
router.get("/employee/:employeeId", authenticate, attendanceController.getEmployeeAttendance);
router.post("/generate-code/:employeeId", authenticate, requireRole("admin", "manager"), attendanceController.generateAttendanceCode);

export default router;
