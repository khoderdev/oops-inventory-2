import express from "express";
import stockEntriesController from "../controllers/stockEntriesController.js";
import { auditAction, authenticate, requirePermission } from "../middleware/authMiddleware.js";
import { checkDayOperationStatus, logStockActivity, warnIfDayClosed } from "../middleware/dayOperationsMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Apply day operation status check to all routes
router.use(checkDayOperationStatus);

// Read-only routes
router.get("/", requirePermission("stock.read"), stockEntriesController.getAllStockEntries);
router.get("/wastage-report", requirePermission("reports.read"), warnIfDayClosed, logStockActivity, stockEntriesController.getWastageReport);
router.get("/:id", requirePermission("stock.read"), stockEntriesController.getStockEntryById);

// Stock modification routes with activity logging
router.post("/", requirePermission("stock.create"), warnIfDayClosed, logStockActivity, auditAction("stock_create", "stock"), stockEntriesController.createStockEntries);

router.post("/add-stock", requirePermission("stock.create"), warnIfDayClosed, logStockActivity, auditAction("stock_add", "stock"), stockEntriesController.addToStock);

router.post("/record-waste", requirePermission("stock.update"), warnIfDayClosed, logStockActivity, auditAction("stock_waste", "stock"), stockEntriesController.wasteFromSpecificEntry);

router.post("/:id/add-to-entry", requirePermission("stock.update"), warnIfDayClosed, logStockActivity, auditAction("stock_add_to_entry", "stock"), stockEntriesController.addToSpecificEntry);

router.post("/:id/waste-from-entry", requirePermission("stock.update"), warnIfDayClosed, logStockActivity, auditAction("stock_waste_from_entry", "stock"), stockEntriesController.wasteFromSpecificEntry);

router.put("/:id", requirePermission("stock.update"), warnIfDayClosed, logStockActivity, auditAction("stock_update", "stock"), stockEntriesController.updateStockEntries);

router.patch("/:id/pos", requirePermission("stock.update"), auditAction("stock_pos_update", "stock"), stockEntriesController.updateStockEntryPOS);

router.delete("/:id", requirePermission("stock.delete"), warnIfDayClosed, logStockActivity, auditAction("stock_delete", "stock"), stockEntriesController.deleteStockEntries);

// Printer assignment routes
router.get("/with-printers", requirePermission("stock.read"), stockEntriesController.getStockEntriesWithPrinters);

router.patch("/:id/assign-printer", requirePermission("stock.update"), auditAction("stock_printer_assign", "stock"), stockEntriesController.assignPrinter);

router.patch("/bulk-assign-printer", requirePermission("stock.update"), auditAction("stock_bulk_printer_assign", "stock"), stockEntriesController.bulkAssignPrinter);

export default router;
