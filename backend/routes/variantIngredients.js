import express from "express";
import variantIngredientsController from "../controllers/variantIngredientsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all variant ingredients with optional filtering
router.get("/", variantIngredientsController.getAllVariantIngredients);

// Get ingredients for a specific variant
router.get("/variant/:variantId", variantIngredientsController.getIngredientsByVariantId);

// Get a single variant ingredient by ID
router.get("/:id", variantIngredientsController.getVariantIngredientById);

// Create a new variant ingredient
router.post("/", variantIngredientsController.createVariantIngredient);

// Bulk create variant ingredients
router.post("/bulk", variantIngredientsController.bulkCreateVariantIngredients);

// Update a variant ingredient
router.put("/:id", variantIngredientsController.updateVariantIngredient);

// Toggle ingredient active status
router.patch("/:id/toggle-status", variantIngredientsController.toggleIngredientStatus);

// Delete a variant ingredient
router.delete("/:id", variantIngredientsController.deleteVariantIngredient);

export default router;
