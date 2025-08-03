import express from "express";
import menuItemsController from "../controllers/menuItemsController.js";
import upload from "../middleware/upload.js";
const router = express.Router();

router.get("/", menuItemsController.getAllMenuItems);
router.get("/with-printers", menuItemsController.getMenuItemsWithPrinters);
router.get("/:id", menuItemsController.getMenuItemById);
router.post("/", upload.single('image'), menuItemsController.createMenuItem);
router.put("/:id", upload.single('image'), menuItemsController.updateMenuItem);
router.delete("/:id", menuItemsController.deleteMenuItem);

// Printer assignment routes
router.patch("/:id/assign-printer", menuItemsController.assignPrinter);
router.patch("/bulk-assign-printer", menuItemsController.bulkAssignPrinter);

export default router;
