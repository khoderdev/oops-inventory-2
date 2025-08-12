import express from "express";
import salesController from "../controllers/salesController.js";
import { authenticate, requirePermission, auditAction } from "../middleware/authMiddleware.js";
import { 
  checkDayOperationStatus, 
  logSaleActivity, 
  warnIfDayClosed 
} from "../middleware/dayOperationsMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Apply day operation status check to all routes
router.use(checkDayOperationStatus);

// Read operations
router.get("/", requirePermission("sales.read"), salesController.getAllSales);
router.get("/negative-stock-report", requirePermission("reports.read"), salesController.getNegativeStockReport);

// Staff/employee sales only - place before dynamic :id
router.get("/staff", requirePermission("sales.read"), salesController.getStaffSales);
router.get("/:id", requirePermission("sales.read"), salesController.getSalesById);

// Sales creation/modification routes with activity logging
router.post("/", requirePermission("sales.create"), warnIfDayClosed, logSaleActivity, auditAction("sale_create", "sale"), salesController.createSales);
router.put("/:id", requirePermission("sales.update"), warnIfDayClosed, logSaleActivity, auditAction("sale_update", "sale"), salesController.updateSales);
router.delete("/:id", requirePermission("sales.delete"), warnIfDayClosed, logSaleActivity, auditAction("sale_delete", "sale"), salesController.deleteSales);
router.post("/:id/revert", requirePermission("sales.revert"), warnIfDayClosed, logSaleActivity, auditAction("sale_revert", "sale"), salesController.revertSale);
router.post("/:id/soft-delete", requirePermission("sales.delete"), warnIfDayClosed, logSaleActivity, auditAction("sale_soft_delete", "sale"), salesController.softDeleteSale);

export default router;