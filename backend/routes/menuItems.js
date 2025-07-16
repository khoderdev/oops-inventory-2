import express from "express";
import menuItemsController from "../controllers/menuItemsController.js";
const router = express.Router();

router.get("/", menuItemsController.getAllMenuItems);
router.get("/:id", menuItemsController.getMenuItemById);
router.post("/", menuItemsController.createMenuItem);
router.put("/:id", menuItemsController.updateMenuItem);
router.delete("/:id", menuItemsController.deleteMenuItem);
export default router;
