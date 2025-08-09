import sequelize from "../config/database.js";
import { Material, MenuItem, MenuItemIngredient, Printer } from "../models/index.js";

const menuItemsController = {
  // Get all menu items with ingredients
  getAllMenuItems: async (req, res, next) => {
    try {
      const menuItems = await MenuItem.findAll({
        include: [
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          },
          {
            model: Printer,
            as: "assignedPrinter",
            required: false
          }
        ]
      });

      const formattedMenuItems = menuItems.map(item => ({
        ...item.get(),
        ingredients: item.menuItemIngredients.map(ingredient => ({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
        }))
      }));

      res.status(200).json(formattedMenuItems);
    } catch (error) {
      next(error);
    }
  },

  // Get menu item by ID with ingredients
  getMenuItemById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const menuItem = await MenuItem.findByPk(id, {
        include: [
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          },
          {
            model: Printer,
            as: "assignedPrinter",
            required: false
          }
        ]
      });

      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      const formattedMenuItem = {
        ...menuItem.get(),
        ingredients: menuItem.menuItemIngredients.map(ingredient => ({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
        }))
      };

      res.status(200).json(formattedMenuItem);
    } catch (error) {
      next(error);
    }
  },

  // Create new menu item with ingredients
  createMenuItem: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { name, price, category, description, ingredients, isPOSItem, image } = req.body;

      // Validate and convert price
      const priceValue = typeof price === "string" ? parseFloat(price) : price;
      if (isNaN(priceValue)) {
        await transaction.rollback();
        return res.status(400).json({ error: "Price must be a valid number" });
      }

      // Validate required fields
      if (!name || price === undefined || !category) {
        await transaction.rollback();
        return res.status(400).json({ error: "Name, price, and category are required" });
      }

      // Validate name is not empty
      if (name.trim() === "") {
        await transaction.rollback();
        return res.status(400).json({ error: "Name cannot be empty" });
      }

      // Validate price is non-negative
      if (priceValue < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Price cannot be negative" });
      }

      // Validate category
      const validCategories = ["appetizers", "burgers", "sandwiches", "plates", "pasta", "sushi", "pizza", "salads", "desserts", "cold", "hot", "alcohol", "breakfast", "shisha"];
      if (!validCategories.includes(category)) {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid category" });
      }

      // Validate ingredients (if provided)
      if (ingredients) {
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ error: "Ingredients must be a non-empty array" });
        }
        for (const ingredient of ingredients) {
          if (!ingredient.materialId || ingredient.quantity === undefined || !ingredient.unit || ingredient.cost === undefined) {
            await transaction.rollback();
            return res.status(400).json({ error: "All ingredient fields are required" });
          }
          if (ingredient.quantity <= 0) {
            await transaction.rollback();
            return res.status(400).json({ error: "Ingredient quantity must be positive" });
          }
          if (ingredient.unit.trim() === "") {
            await transaction.rollback();
            return res.status(400).json({ error: "Ingredient unit cannot be empty" });
          }
          if (ingredient.cost < 0) {
            await transaction.rollback();
            return res.status(400).json({ error: "Ingredient cost cannot be negative" });
          }
        }
      }

      // Handle image (either from file upload or base64)
      let imageUrl = null;
      if (req.file) {
        // File upload via multer
        imageUrl = `/uploads/menu/${req.file.filename}`;
      } else if (image) {
        // Base64 image data
        imageUrl = image;
      }

      // Create menu item with properly converted price
      const menuItem = await MenuItem.create(
        {
          name,
          price: priceValue,
          category,
          description,
          isPOSItem: isPOSItem !== undefined ? isPOSItem : false,
          image: imageUrl
        },
        { transaction }
      );

      // Create ingredients if provided
      if (ingredients && ingredients.length > 0) {
        const ingredientData = ingredients.map(ingredient => ({
          menuItemId: menuItem.id,
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
        }));
        await MenuItemIngredient.bulkCreate(ingredientData, { transaction });
      }

      // Fetch the created menu item with ingredients
      const createdMenuItem = await MenuItem.findByPk(menuItem.id, {
        include: [
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          }
        ],
        transaction
      });

      const formattedMenuItem = {
        ...createdMenuItem.get(),
        ingredients: createdMenuItem.menuItemIngredients.map(ingredient => ({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
        }))
      };

      await transaction.commit();
      res.status(201).json(formattedMenuItem);
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Update menu item with ingredients
  updateMenuItem: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { name, price, category, description, ingredients, isPOSItem, image } = req.body;

      const menuItem = await MenuItem.findByPk(id, { transaction });
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Handle price conversion if provided
      let priceValue = price;
      if (price !== undefined) {
        priceValue = typeof price === "string" ? parseFloat(price) : price;
        if (isNaN(priceValue)) {
          await transaction.rollback();
          return res.status(400).json({ error: "Price must be a valid number" });
        }
      }

      // Validate name if provided
      if (name !== undefined && name.trim() === "") {
        await transaction.rollback();
        return res.status(400).json({ error: "Name cannot be empty" });
      }

      // Validate price if provided
      if (price !== undefined && priceValue < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Price cannot be negative" });
      }

      // Validate category if provided
      const validCategories = ["appetizers", "burgers", "sandwiches", "plates", "pasta", "sushi", "pizza", "salads", "desserts", "beverages", "alcohol", "shisha", "cold", "hot", "breakfast"];
      if (category !== undefined && !validCategories.includes(category)) {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid category" });
      }

      // Validate ingredients if provided
      if (ingredients !== undefined) {
        if (!Array.isArray(ingredients)) {
          await transaction.rollback();
          return res.status(400).json({ error: "Ingredients must be an array" });
        }
        if (ingredients.length > 0) {
          for (const ingredient of ingredients) {
            if (!ingredient.materialId || ingredient.quantity === undefined || !ingredient.unit || ingredient.cost === undefined) {
              await transaction.rollback();
              return res.status(400).json({ error: "All ingredient fields are required" });
            }
            if (ingredient.quantity <= 0) {
              await transaction.rollback();
              return res.status(400).json({ error: "Ingredient quantity must be positive" });
            }
            if (ingredient.unit.trim() === "") {
              await transaction.rollback();
              return res.status(400).json({ error: "Ingredient unit cannot be empty" });
            }
            if (ingredient.cost < 0) {
              await transaction.rollback();
              return res.status(400).json({ error: "Ingredient cost cannot be negative" });
            }
          }
        }
      }

      // Handle image update (either from file upload or base64)
      let imageUrl = menuItem.image; // Keep existing image by default
      if (req.file) {
        // File upload via multer
        imageUrl = `/uploads/menu/${req.file.filename}`;
      } else if (image !== undefined) {
        // Base64 image data or null to remove image
        imageUrl = image;
      }

      // Update menu item with proper price handling
      await menuItem.update(
        {
          name: name !== undefined ? name : menuItem.name,
          price: price !== undefined ? priceValue : menuItem.price,
          category: category !== undefined ? category : menuItem.category,
          description: description !== undefined ? description : menuItem.description,
          isPOSItem: isPOSItem !== undefined ? isPOSItem : menuItem.isPOSItem,
          image: imageUrl
        },
        { transaction }
      );

      // Update ingredients if provided
      if (ingredients !== undefined) {
        // Delete existing ingredients
        await MenuItemIngredient.destroy({
          where: { menuItemId: id },
          transaction
        });

        // Create new ingredients if any
        if (ingredients.length > 0) {
          const ingredientData = ingredients.map(ingredient => ({
            menuItemId: id,
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost
          }));
          await MenuItemIngredient.bulkCreate(ingredientData, { transaction });
        }
      }

      // Fetch the updated menu item with ingredients
      const updatedMenuItem = await MenuItem.findByPk(id, {
        include: [
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          }
        ],
        transaction
      });

      const formattedMenuItem = {
        ...updatedMenuItem.get(),
        ingredients: updatedMenuItem.menuItemIngredients.map(ingredient => ({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
        }))
      };

      await transaction.commit();
      res.status(200).json(formattedMenuItem);
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Delete menu item
  deleteMenuItem: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const menuItem = await MenuItem.findByPk(id, { transaction });

      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Delete associated ingredients
      await MenuItemIngredient.destroy({
        where: { menuItemId: id },
        transaction
      });

      // Delete menu item
      await menuItem.destroy({ transaction });

      await transaction.commit();
      res.status(204).send();
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Assign printer to menu item
  assignPrinter: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { printerId } = req.body;

      // Validate printer exists if printerId is provided
      if (printerId) {
        const printer = await Printer.findByPk(printerId);
        if (!printer) {
          return res.status(404).json({ error: "Printer not found" });
        }
      }

      // Update menu item with printer assignment
      const [updatedRowsCount] = await MenuItem.update(
        { printerId: printerId || null },
        { where: { id } }
      );

      if (updatedRowsCount === 0) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Fetch updated menu item with printer info
      const updatedMenuItem = await MenuItem.findByPk(id, {
        include: [
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          },
          {
            model: Printer,
            as: "assignedPrinter",
            attributes: ["id", "name", "type", "status"]
          }
        ]
      });

      res.status(200).json({
        message: printerId ? "Printer assigned successfully" : "Printer assignment removed",
        menuItem: updatedMenuItem
      });
    } catch (error) {
      console.error("Error assigning printer to menu item:", error);
      next(error);
    }
  },

  // Get menu items with their assigned printers
  getMenuItemsWithPrinters: async (req, res, next) => {
    try {
      const menuItems = await MenuItem.findAll({
        include: [
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          },
          {
            model: Printer,
            as: "assignedPrinter",
            attributes: ["id", "name", "type", "status", "location"],
            required: false // LEFT JOIN to include items without printers
          }
        ],
        order: [["id", "ASC"]]
      });

      const formattedMenuItems = menuItems.map(item => ({
        ...item.get(),
        ingredients: item.menuItemIngredients.map(ingredient => ({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
        }))
      }));

      res.status(200).json(formattedMenuItems);
    } catch (error) {
      console.error("Error fetching menu items with printers:", error);
      next(error);
    }
  },

  // Bulk assign printer to multiple menu items
  bulkAssignPrinter: async (req, res, next) => {
    try {
      const { menuItemIds, printerId } = req.body;

      if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
        return res.status(400).json({ error: "Menu item IDs array is required" });
      }

      // Validate printer exists if printerId is provided
      if (printerId) {
        const printer = await Printer.findByPk(printerId);
        if (!printer) {
          return res.status(404).json({ error: "Printer not found" });
        }
      }

      // Update multiple menu items
      const [updatedRowsCount] = await MenuItem.update(
        { printerId: printerId || null },
        { where: { id: menuItemIds } }
      );

      res.status(200).json({
        message: `${updatedRowsCount} menu items updated`,
        updatedCount: updatedRowsCount
      });
    } catch (error) {
      console.error("Error bulk assigning printer:", error);
      next(error);
    }
  },

  // Bulk update category for multiple menu items
  bulkUpdateCategory: async (req, res, next) => {
    try {
      const { menuItemIds, category } = req.body;

      // Validate input
      if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
        return res.status(400).json({ error: "Menu item IDs array is required" });
      }

      if (!category || typeof category !== 'string') {
        return res.status(400).json({ error: "Category is required and must be a string" });
      }

      // Validate category
      const validCategories = [
        "appetizers", "burgers", "sandwiches", "plates", "pasta", 
        "sushi", "pizza", "salads", "desserts", "beverages", 
        "cold", "hot", "alcohol", "breakfast", "shisha"
      ];
      
      if (!validCategories.includes(category)) {
        return res.status(400).json({ 
          error: "Invalid category", 
          validCategories 
        });
      }

      // Update multiple menu items
      const [updatedRowsCount] = await MenuItem.update(
        { category },
        { where: { id: menuItemIds } }
      );

      if (updatedRowsCount === 0) {
        return res.status(404).json({ error: "No menu items found with the provided IDs" });
      }

      // Fetch updated menu items to return them
      const updatedMenuItems = await MenuItem.findAll({
        where: { id: menuItemIds },
        include: [
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          },
          {
            model: Printer,
            as: "assignedPrinter",
            required: false
          }
        ]
      });

      const formattedMenuItems = updatedMenuItems.map(item => ({
        ...item.get(),
        ingredients: item.menuItemIngredients.map(ingredient => ({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
        }))
      }));

      res.status(200).json({
        message: `${updatedRowsCount} menu items updated to category: ${category}`,
        updatedCount: updatedRowsCount,
        menuItems: formattedMenuItems
      });
    } catch (error) {
      console.error("Error bulk updating category:", error);
      next(error);
    }
  },
};

export default menuItemsController;
