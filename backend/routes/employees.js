import express from "express";
import { createEmployee, deleteEmployee, getAllEmployees, getEmployeeById, getEmployeeStats, updateEmployee } from "../controllers/employeeController.js";
import { approveSettlement, createSettlement, deleteSettlement, getAllSettlements, getPendingSettlements, getSettlementById, getSettlementStats, markAsPaid, previewSettlement, updateSettlement } from "../controllers/employeeSettlementController.js";
import { deleteUsage, getMonthlyUsageSummary, getUsageHistory, getUsageStats, recordUsage, updateUsage , updateSettlementStatus} from "../controllers/employeeUsageController.js";
import { authenticate, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Employee usage tracking routes (specific routes first)
router.post("/usage", requirePermission("employee.usageRecord"), recordUsage);
router.get("/usage", requirePermission("employee.usageView"), getUsageHistory);
router.get("/usage/stats", requirePermission("employee.usageView"), getUsageStats);
router.put("/usage/:id", requirePermission("employee.usageRecord"), updateUsage);
router.delete("/usage/:id", requirePermission("employee.usageRecord"), deleteUsage);

// Employee settlement routes (specific routes first)
router.get("/settlements", requirePermission("employee.settlementView"), getAllSettlements);
router.get("/settlements/pending", requirePermission("employee.settlementView"), getPendingSettlements);
router.get("/settlements/stats", requirePermission("employee.settlementView"), getSettlementStats);
router.post("/settlements", requirePermission("employee.settlementCreate"), createSettlement);
router.post("/settlements/preview", requirePermission("employee.settlementCreate"), previewSettlement);
router.get("/settlements/:id", requirePermission("employee.settlementView"), getSettlementById);
router.put("/settlements/:id", requirePermission("employee.settlementProcess"), updateSettlement);
router.patch("/settlements/:id/status", requirePermission("employee.settlementProcess"), updateSettlementStatus);
router.put("/settlements/:id/approve", requirePermission("employee.settlementApprove"), approveSettlement);
router.put("/settlements/:id/pay", requirePermission("employee.settlementProcess"), markAsPaid);
router.delete("/settlements/:id", requirePermission("employee.settlementDelete"), deleteSettlement);

// Employee stats route (specific route before parameterized routes)
router.get("/stats", requirePermission("employee.read"), getEmployeeStats);

// Employee CRUD routes (parameterized routes last)
router.get("/", requirePermission("employee.read"), getAllEmployees);
router.get("/:id", requirePermission("employee.read"), getEmployeeById);
router.post("/", requirePermission("employee.create"), createEmployee);
router.put("/:id", requirePermission("employee.update"), updateEmployee);
router.delete("/:id", requirePermission("employee.delete"), deleteEmployee);

// Employee salary management routes (parameterized routes)
router.get("/:id/salary", requirePermission("employee.viewSalary"), getEmployeeById); // Salary info included in employee details
router.put("/:id/salary", requirePermission("employee.manageSalary"), updateEmployee); // Salary updated via employee update

// Employee usage monthly route (parameterized route)
router.get("/:id/usage/monthly", requirePermission("employee.usageView"), getMonthlyUsageSummary);

export default router;
