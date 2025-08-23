import express from "express";
import menuItemsController from "../controllers/menuItemsController.js";
import upload from "../middleware/upload.js";
const router = express.Router();

router.get("/", menuItemsController.getAllMenuItems);
router.get("/with-printers", menuItemsController.getMenuItemsWithPrinters);
router.get("/categories", menuItemsController.getMenuItemCategories);
router.get("/type/:type", menuItemsController.getMenuItemsByType);

// Add direct routes for beverages and food for backward compatibility
router.get("/beverages", (req, res, next) => {
  req.params.type = "beverage";
  menuItemsController.getMenuItemsByType(req, res, next);
});
router.get("/beverage", (req, res, next) => {
  req.params.type = "beverage";
  menuItemsController.getMenuItemsByType(req, res, next);
});
router.get("/food", (req, res, next) => {
  req.params.type = "food";
  menuItemsController.getMenuItemsByType(req, res, next);
});

// This route should be last as it's a catch-all for IDs
router.get("/:id", menuItemsController.getMenuItemById);
router.post("/", upload.single("image"), menuItemsController.createMenuItem);
router.put("/:id", upload.single("image"), menuItemsController.updateMenuItem);
router.delete("/:id", menuItemsController.deleteMenuItem);
// Bulk category update route
router.patch("/bulk-update-category", menuItemsController.bulkUpdateCategory);
// Printer assignment routes
router.patch("/:id/assign-printer", menuItemsController.assignPrinter);
router.patch("/bulk-assign-printer", menuItemsController.bulkAssignPrinter);
// Beverage variant creation route
router.post("/beverage-variants", menuItemsController.createBeverageVariants);

export default router;
