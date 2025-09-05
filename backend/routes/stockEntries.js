import express from "express";
import stockEntriesController from "../controllers/stockEntriesController.js";
import { auditAction, authenticate, requirePermission } from "../middleware/authMiddleware.js";
import { checkDayOperationStatus, logStockActivity, warnIfDayClosed } from "../middleware/dayOperationsMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";
import beverageStockController from "../controllers/beverageStockController.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);
// Apply day operation status check to all routes
router.use(checkDayOperationStatus);
// Read-only routes with caching
router.get(
  "/",
  requirePermission("stock.read"),
  cacheMiddleware(30, req => `stock-entries:${JSON.stringify(req.query)}`),
  stockEntriesController.getAllStockEntries
);

// Total current stock value (read-only, cached briefly)
router.get(
  "/total-value",
  requirePermission("stock.read"),
  cacheMiddleware(30, req => `stock-entries-total-value:${JSON.stringify(req.query)}`),
  stockEntriesController.getTotalCurrentStockValue
);

router.get(
  "/with-printers",
  requirePermission("stock.read"),
  cacheMiddleware(180, req => `stock-entries-printers:${JSON.stringify(req.query)}`),
  stockEntriesController.getStockEntriesWithPrinters
);

router.get(
  "/wastage-report",
  requirePermission("reports.read"),
  warnIfDayClosed,
  logStockActivity,
  cacheMiddleware(300, req => `wastage-report:${JSON.stringify(req.query)}`),
  stockEntriesController.getWastageReport
);

// Get all categories from stock entries with materials
router.get(
  "/categories",
  requirePermission("stock.read"),
  cacheMiddleware(300, () => "stock-entries-categories"),
  stockEntriesController.getMaterialCategories
);

// Get all beverage stock entries with pagination and filtering
router.get("/beverage", beverageStockController.getBeverageStockEntries);
// Get unique beverage names from stock entries
router.get("/beverage/names/unique", beverageStockController.getUniqueBeverageNames);
// Get beverage stock entry by ID
router.get("/beverage/:id", beverageStockController.getBeverageStockEntryById);
router.get(
  "/:id",
  requirePermission("stock.read"),
  cacheMiddleware(300, req => `stock-entry:${req.params.id}`),
  stockEntriesController.getStockEntryById
);

// Get material categories for stock entries
router.get(
  "/categories/materials",
  requirePermission("stock.read"),
  cacheMiddleware(600, () => "stock-material-categories"),
  stockEntriesController.getMaterialCategories
);

// Stock modification routes with activity logging and cache invalidation
router.post(
  "/",
  requirePermission("stock.create"),
  warnIfDayClosed,
  logStockActivity,
  auditAction("stock_create", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("materials");
    });
    next();
  },
  stockEntriesController.createStockEntries
);

router.post(
  "/add-stock",
  requirePermission("stock.create"),
  warnIfDayClosed,
  logStockActivity,
  auditAction("stock_add", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("materials");
    });
    next();
  },
  stockEntriesController.addToStock
);

router.post(
  "/record-waste",
  requirePermission("stock.update"),
  warnIfDayClosed,
  logStockActivity,
  auditAction("stock_waste", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("wastage-report");
      clearCacheByPattern("materials");
    });
    next();
  },
  stockEntriesController.wasteFromSpecificEntry
);

router.post(
  "/:id/add-to-entry",
  requirePermission("stock.update"),
  warnIfDayClosed,
  logStockActivity,
  auditAction("stock_add_to_entry", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("stock-entry");
      clearCacheByPattern("materials");
    });
    next();
  },
  stockEntriesController.addToSpecificEntry
);

router.post(
  "/:id/waste-from-entry",
  requirePermission("stock.update"),
  warnIfDayClosed,
  logStockActivity,
  auditAction("stock_waste_from_entry", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("stock-entry");
      clearCacheByPattern("wastage-report");
      clearCacheByPattern("materials");
    });
    next();
  },
  stockEntriesController.wasteFromSpecificEntry
);

router.put(
  "/:id",
  requirePermission("stock.update"),
  warnIfDayClosed,
  logStockActivity,
  auditAction("stock_update", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("stock-entry");
      clearCacheByPattern("materials");
    });
    next();
  },
  stockEntriesController.updateStockEntries
);

router.patch(
  "/:id/pos",
  requirePermission("stock.update"),
  auditAction("stock_pos_update", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("stock-entry");
    });
    next();
  },
  stockEntriesController.updateStockEntryPOS
);

router.delete(
  "/:id",
  requirePermission("stock.delete"),
  warnIfDayClosed,
  logStockActivity,
  auditAction("stock_delete", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("stock-entry");
      clearCacheByPattern("materials");
    });
    next();
  },
  stockEntriesController.deleteAllStockEntries
);

router.delete(
  "/delete-all",
  requirePermission("stock.delete"),
  warnIfDayClosed,
  logStockActivity,
  auditAction("stock_delete_all", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("stock-entry");
      clearCacheByPattern("materials");
    });
    next();
  },
  stockEntriesController.deleteAllStockEntries
);

// Printer assignment routes with cache invalidation
router.patch(
  "/:id/assign-printer",
  requirePermission("stock.update"),
  auditAction("stock_printer_assign", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("stock-entries-printers");
      clearCacheByPattern("stock-entry");
    });
    next();
  },
  stockEntriesController.assignPrinter
);

router.patch(
  "/bulk-assign-printer",
  requirePermission("stock.update"),
  auditAction("stock_bulk_printer_assign", "stock"),
  (req, res, next) => {
    import("../middleware/cacheMiddleware.js").then(({ clearCacheByPattern }) => {
      clearCacheByPattern("stock-entries");
      clearCacheByPattern("stock-entries-printers");
    });
    next();
  },
  stockEntriesController.bulkAssignPrinter
);

export default router;
