import express from "express";
import stockEntriesController from "../controllers/stockEntriesController.js";
const router = express.Router();

router.get("/", stockEntriesController.getAllStockEntries);
router.get("/:id", stockEntriesController.getStockEntryById);
router.post("/", stockEntriesController.createStockEntries);
router.post("/add-stock", stockEntriesController.addToStock);
router.post("/record-waste", stockEntriesController.recordWaste);
router.post("/:id/add-to-entry", stockEntriesController.addToSpecificEntry);
router.post("/:id/waste-from-entry", stockEntriesController.wasteFromSpecificEntry);
router.put("/:id", stockEntriesController.updateStockEntries);
router.delete("/:id", stockEntriesController.deleteStockEntries);

export default router;
