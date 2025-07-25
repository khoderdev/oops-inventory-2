// import express from "express";
// import stockEntriesController from "../controllers/stockEntriesController.js";
// import { checkDayOperationStatus, logStockActivity, warnIfDayClosed } from "../middleware/dayOperationsMiddleware.js";

// const router = express.Router();

// // Apply day operation status check to all routes
// router.use(checkDayOperationStatus);

// // Read-only routes
// router.get("/", stockEntriesController.getAllStockEntries);
// router.get("/:id", stockEntriesController.getStockEntryById);

// // Stock modification routes with activity logging
// router.post("/", warnIfDayClosed, logStockActivity, stockEntriesController.createStockEntries);
// router.post("/add-stock", warnIfDayClosed, logStockActivity, stockEntriesController.addToStock);
// router.post("/record-waste", warnIfDayClosed, logStockActivity, stockEntriesController.recordWaste);
// router.post("/:id/add-to-entry", warnIfDayClosed, logStockActivity, stockEntriesController.addToSpecificEntry);
// router.post("/:id/waste-from-entry", warnIfDayClosed, logStockActivity, stockEntriesController.wasteFromSpecificEntry);
// router.put("/:id", warnIfDayClosed, logStockActivity, stockEntriesController.updateStockEntries);
// router.delete("/:id", warnIfDayClosed, logStockActivity, stockEntriesController.deleteStockEntries);
// router.get("/wastage-report", warnIfDayClosed, logStockActivity, stockEntriesController.getWastageReport);
// router.get("/:id", stockEntriesController.getStockEntryById);

// export default router;
import express from "express";
import stockEntriesController from "../controllers/stockEntriesController.js";
import { checkDayOperationStatus, logStockActivity, warnIfDayClosed } from "../middleware/dayOperationsMiddleware.js";

const router = express.Router();

// Apply day operation status check to all routes
router.use(checkDayOperationStatus);

// Read-only routes
router.get("/", stockEntriesController.getAllStockEntries);
router.get("/wastage-report", warnIfDayClosed, logStockActivity, stockEntriesController.getWastageReport);
router.get("/:id", stockEntriesController.getStockEntryById);

// Stock modification routes with activity logging
router.post("/", warnIfDayClosed, logStockActivity, stockEntriesController.createStockEntries);
router.post("/add-stock", warnIfDayClosed, logStockActivity, stockEntriesController.addToStock);
router.post("/record-waste", warnIfDayClosed, logStockActivity, stockEntriesController.wasteFromSpecificEntry);
router.post("/:id/add-to-entry", warnIfDayClosed, logStockActivity, stockEntriesController.addToSpecificEntry);
router.post("/:id/waste-from-entry", warnIfDayClosed, logStockActivity, stockEntriesController.wasteFromSpecificEntry);
router.put("/:id", warnIfDayClosed, logStockActivity, stockEntriesController.updateStockEntries);
router.delete("/:id", warnIfDayClosed, logStockActivity, stockEntriesController.deleteStockEntries);

export default router;
