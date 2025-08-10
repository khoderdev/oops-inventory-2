import express from "express";
import stockEntriesController from "../controllers/stockEntriesController.js";
import { auditAction, authenticate, requirePermission } from "../middleware/authMiddleware.js";
import { checkDayOperationStatus, logStockActivity, warnIfDayClosed } from "../middleware/dayOperationsMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Apply day operation status check to all routes
router.use(checkDayOperationStatus);

// Read-only routes with caching
router.get("/", 
  requirePermission("stock.read"), 
  cacheMiddleware(120, (req) => `stock-entries:${JSON.stringify(req.query)}`), // 2 min cache
  stockEntriesController.getAllStockEntries
);

router.get("/with-printers", 
  requirePermission("stock.read"), 
  cacheMiddleware(180, (req) => `stock-entries-printers:${JSON.stringify(req.query)}`), // 3 min cache
  stockEntriesController.getStockEntriesWithPrinters
);

router.get("/wastage-report", 
  requirePermission("reports.read"), 
  warnIfDayClosed, 
  logStockActivity, 
  cacheMiddleware(300, (req) => `wastage-report:${JSON.stringify(req.query)}`), // 5 min cache
  stockEntriesController.getWastageReport
);

router.get("/:id", 
  requirePermission("stock.read"), 
  cacheMiddleware(300, (req) => `stock-entry:${req.params.id}`), // 5 min cache
  stockEntriesController.getStockEntryById
);

// Stock modification routes with activity logging and cache invalidation
router.post("/", requirePermission("stock.create"), warnIfDayClosed, logStockActivity, auditAction("stock_create", "stock"), (req, res, next) => {
  // Clear stock entries cache after creation
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("materials"); // Also clear materials cache as stock affects materials
  });
  next();
}, stockEntriesController.createStockEntries);

router.post("/add-stock", requirePermission("stock.create"), warnIfDayClosed, logStockActivity, auditAction("stock_add", "stock"), (req, res, next) => {
  // Clear stock entries cache after adding stock
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("materials");
  });
  next();
}, stockEntriesController.addToStock);

router.post("/record-waste", requirePermission("stock.update"), warnIfDayClosed, logStockActivity, auditAction("stock_waste", "stock"), (req, res, next) => {
  // Clear cache after waste recording
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("wastage-report");
    clearCacheByPattern("materials");
  });
  next();
}, stockEntriesController.wasteFromSpecificEntry);

router.post("/:id/add-to-entry", requirePermission("stock.update"), warnIfDayClosed, logStockActivity, auditAction("stock_add_to_entry", "stock"), (req, res, next) => {
  // Clear cache after adding to specific entry
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("stock-entry");
    clearCacheByPattern("materials");
  });
  next();
}, stockEntriesController.addToSpecificEntry);

router.post("/:id/waste-from-entry", requirePermission("stock.update"), warnIfDayClosed, logStockActivity, auditAction("stock_waste_from_entry", "stock"), (req, res, next) => {
  // Clear cache after waste from specific entry
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("stock-entry");
    clearCacheByPattern("wastage-report");
    clearCacheByPattern("materials");
  });
  next();
}, stockEntriesController.wasteFromSpecificEntry);

router.put("/:id", requirePermission("stock.update"), warnIfDayClosed, logStockActivity, auditAction("stock_update", "stock"), (req, res, next) => {
  // Clear cache after stock entry update
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("stock-entry");
    clearCacheByPattern("materials");
  });
  next();
}, stockEntriesController.updateStockEntries);

router.patch("/:id/pos", requirePermission("stock.update"), auditAction("stock_pos_update", "stock"), (req, res, next) => {
  // Clear cache after POS visibility update
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("stock-entry");
  });
  next();
}, stockEntriesController.updateStockEntryPOS);

router.delete("/:id", requirePermission("stock.delete"), warnIfDayClosed, logStockActivity, auditAction("stock_delete", "stock"), (req, res, next) => {
  // Clear cache after stock entry deletion
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("stock-entry");
    clearCacheByPattern("materials");
  });
  next();
}, stockEntriesController.deleteStockEntries);

// Printer assignment routes with cache invalidation
router.patch("/:id/assign-printer", requirePermission("stock.update"), auditAction("stock_printer_assign", "stock"), (req, res, next) => {
  // Clear cache after printer assignment
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("stock-entries-printers");
    clearCacheByPattern("stock-entry");
  });
  next();
}, stockEntriesController.assignPrinter);

router.patch("/bulk-assign-printer", requirePermission("stock.update"), auditAction("stock_bulk_printer_assign", "stock"), (req, res, next) => {
  // Clear cache after bulk printer assignment
  import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
    clearCacheByPattern("stock-entries");
    clearCacheByPattern("stock-entries-printers");
  });
  next();
}, stockEntriesController.bulkAssignPrinter);

export default router;
