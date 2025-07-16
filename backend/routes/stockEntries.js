import express from "express";
import stockEntriesController from "../controllers/stockEntriesController.js";
const router = express.Router();

router.get("/", stockEntriesController.getAllStockEntries);
router.get("/:id", stockEntriesController.getStockEntryById);
router.post("/", stockEntriesController.createStockEntries);
router.put("/:id", stockEntriesController.updateStockEntries);
router.delete("/:id", stockEntriesController.deleteStockEntries);

export default router;
