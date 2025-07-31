import sequelize from "../config/database.js";
import { Material, MenuItem, MenuItemIngredient } from "../models/index.js";

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
      const { name, price, category, description, ingredients, isPOSItem } = req.body;

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
      const validCategories = ["appetizers", "burgers", "sandwiches", "plates", "salads", "desserts", "beverages", "shisha"];
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

      // Create menu item with properly converted price
      const menuItem = await MenuItem.create(
        {
          name,
          price: priceValue,
          category,
          description,
          isPOSItem: isPOSItem !== undefined ? isPOSItem : false
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
      const { name, price, category, description, ingredients, isPOSItem } = req.body;

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
      const validCategories = ["appetizers", "burgers", "sandwiches", "plates", "salads", "desserts", "beverages", "shisha"];
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

      // Update menu item with proper price handling
      await menuItem.update(
        {
          name: name !== undefined ? name : menuItem.name,
          price: price !== undefined ? priceValue : menuItem.price,
          category: category !== undefined ? category : menuItem.category,
          description: description !== undefined ? description : menuItem.description,
          isPOSItem: isPOSItem !== undefined ? isPOSItem : menuItem.isPOSItem
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
  }
};

export default menuItemsController;
