import sequelize from "../config/database.js";
import { MenuItem, MenuItemIngredient, Variants } from "../models/index.js";
import Category from "../models/Category.js";
import Material from "../models/materials.js";
import { v4 as uuidv4 } from "uuid";

const menuItemsController = {
  getAllMenuItems: async (req, res, next) => {
    try {
      const menuItems = await MenuItem.findAll({
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "value"],
            required: false
          },
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          },
          {
            model: Variants,
            as: "variants",
            attributes: ["id", "name", "volume", "unit", "price", "isActive", "sortOrder"],
            where: { isActive: true },
            required: false,
            order: [["sortOrder", "ASC"], ["name", "ASC"]]
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
        })),
        variants: item.variants || []
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
            model: Category,
            as: "category",
            attributes: ["id", "name", "value"],
            required: false
          },
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          },
          {
            model: Variants,
            as: "variants",
            attributes: ["id", "name", "volume", "unit", "price", "isActive", "sortOrder"],
            where: { isActive: true },
            required: false,
            order: [["sortOrder", "ASC"], ["name", "ASC"]]
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
        })),
        variants: menuItem.variants || []
      };
      res.status(200).json(formattedMenuItem);
    } catch (error) {
      next(error);
    }
  },

  // Create new menu item with ingredients and variants
  createMenuItem: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const {
        name,
        price,
        category,
        description,
        isPOSItem,
        image,
        imageBase64,
        ingredients,
        isBeverage,
        unit,
        availableQuantity,
        costPerUnit,
        variants
      } = req.body;
      const priceValue = typeof price === "string" ? parseFloat(price) : price;
      if (isNaN(priceValue)) {
        await transaction.rollback();
        return res.status(400).json({ error: "Price must be a valid number" });
      }
      if (!name || price === undefined || !category) {
        await transaction.rollback();
        return res.status(400).json({ error: "Name, price, and category are required" });
      }
      if (name.trim() === "") {
        await transaction.rollback();
        return res.status(400).json({ error: "Name cannot be empty" });
      }
      if (priceValue < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Price cannot be negative" });
      }
      let categoryId = null;
      let categoryValue = null;
      if (typeof category === "object" && category !== null && category.id) {
        categoryId = category.id;
        categoryValue = category.name || category.value;
      } else if (typeof category === "string") {
        try {
          const parsedCategory = JSON.parse(category);
          if (parsedCategory && typeof parsedCategory === "object" && parsedCategory.id) {
            categoryId = parsedCategory.id;
            categoryValue = parsedCategory.name || parsedCategory.value;
          } else {
          }
        } catch (e) {
          let categoryRecord = await Category.findOne({
            where: { value: category, isActive: true }
          });
          if (!categoryRecord) {
            categoryRecord = await Category.findOne({
              where: { name: category, isActive: true }
            });
          }
          if (categoryRecord) {
            categoryId = categoryRecord.id;
            categoryValue = categoryRecord.value;
          }
        }
      } else if (typeof category === "number") {
        categoryId = category;
        const categoryRecord = await Category.findByPk(categoryId);
        if (categoryRecord && categoryRecord.isActive) {
          categoryValue = categoryRecord.value;
        } else {
        }
      }
      if (!categoryId) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Invalid menu item category: ${JSON.stringify(category)}. Please use a valid category from the database.`
        });
      }
      const categoryRecord = await Category.findOne({
        where: { id: categoryId, isActive: true }
      });
      if (!categoryRecord) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Category with ID ${categoryId} not found or inactive.`
        });
      }
      let parsedIngredients = null;
      if (ingredients) {
        if (typeof ingredients === "string") {
          try {
            parsedIngredients = JSON.parse(ingredients);
          } catch (e) {
            await transaction.rollback();
            return res.status(400).json({ error: "Invalid ingredients format - must be valid JSON" });
          }
        } else if (Array.isArray(ingredients)) {
          parsedIngredients = ingredients;
        }
      }
      const noIngredientsCategories = ['alcohol', 'cold', 'hot', 'shisha'];
      const requiresIngredients = !noIngredientsCategories.includes(categoryValue?.toLowerCase());
      let beverageData = {};
      if (isBeverage !== undefined) {
        beverageData.isBeverage = Boolean(isBeverage);
      }
      if (unit !== undefined) {
        beverageData.unit = unit;
      }
      if (availableQuantity !== undefined) {
        const quantity = typeof availableQuantity === "string" ? parseFloat(availableQuantity) : availableQuantity;
        if (isNaN(quantity) || quantity < 0) {
          await transaction.rollback();
          return res.status(400).json({ error: "Available quantity must be a non-negative number" });
        }
        beverageData.availableQuantity = quantity;
      }
      if (costPerUnit !== undefined) {
        const cost = typeof costPerUnit === "string" ? parseFloat(costPerUnit) : costPerUnit;
        if (isNaN(cost) || cost < 0) {
          await transaction.rollback();
          return res.status(400).json({ error: "Cost per unit must be a non-negative number" });
        }
        beverageData.costPerUnit = cost;
      }
      let parsedVariants = null;
      if (variants) {
        if (typeof variants === "string") {
          try {
            parsedVariants = JSON.parse(variants);
          } catch (e) {
            await transaction.rollback();
            return res.status(400).json({ error: "Invalid variants format - must be valid JSON" });
          }
        } else if (typeof variants === "object") {
          parsedVariants = variants;
        }
      }
      if (parsedIngredients && parsedIngredients.length > 0) {
        for (const ingredient of parsedIngredients) {
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
      } else {
        if (requiresIngredients) {
          await transaction.rollback();
          return res.status(400).json({ 
            error: `Ingredients are required for ${categoryValue} items. Please add at least one ingredient.` 
          });
        }
        parsedIngredients = [];
      }
      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/menu/${req.file.filename}`;
      } else if (imageBase64 && typeof imageBase64 === "string" && imageBase64.startsWith("data:image/")) {
        imageUrl = imageBase64;
      } else if (image) {
        imageUrl = image;
      }
      const menuItem = await MenuItem.create(
        {
          name,
          price: priceValue,
          categoryId,
          description,
          isPOSItem: isPOSItem !== undefined ? isPOSItem : false,
          image: imageUrl,
          ...beverageData
        },
        { transaction }
      );
      if (parsedIngredients && parsedIngredients.length > 0) {
        const ingredientData = parsedIngredients.map(ingredient => {
          const cost = typeof ingredient.cost === 'string' 
            ? parseFloat(ingredient.cost).toFixed(6) 
            : parseFloat(ingredient.cost).toFixed(6);
          const quantity = typeof ingredient.quantity === 'string'
            ? parseFloat(ingredient.quantity).toFixed(6)
            : parseFloat(ingredient.quantity).toFixed(6);
          return {
            menuItemId: menuItem.id,
            materialId: ingredient.materialId,
            quantity: quantity,
            unit: ingredient.unit,
            cost: cost
          };
        });
        await MenuItemIngredient.bulkCreate(ingredientData, { transaction });
      }
      if (parsedVariants && typeof parsedVariants === "object") {
        const variantEntries = Object.entries(parsedVariants);
        if (variantEntries.length > 0) {
          const variantData = variantEntries.map(([variantName, variantInfo], index) => {
            if (!variantInfo.volume || !variantInfo.unit || variantInfo.price === undefined) {
              throw new Error(`Variant "${variantName}" is missing required fields (volume, unit, price)`);
            }
            const volume = typeof variantInfo.volume === "string" ? parseFloat(variantInfo.volume) : variantInfo.volume;
            const price = typeof variantInfo.price === "string" ? parseFloat(variantInfo.price) : variantInfo.price;
            if (isNaN(volume) || volume <= 0) {
              throw new Error(`Variant "${variantName}" has invalid volume`);
            }
            if (isNaN(price) || price < 0) {
              throw new Error(`Variant "${variantName}" has invalid price`);
            }
            return {
              menuItemId: menuItem.id,
              name: variantName,
              volume: volume,
              unit: variantInfo.unit,
              price: price,
              isActive: true,
              sortOrder: index
            };
          });
          await Variants.bulkCreate(variantData, { transaction });
        }
      }
      const createdMenuItem = await MenuItem.findByPk(menuItem.id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "value"],
            required: false
          },
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          },
          {
            model: Variants,
            as: "variants",
            attributes: ["id", "name", "volume", "unit", "price", "isActive", "sortOrder"],
            where: { isActive: true },
            required: false,
            order: [["sortOrder", "ASC"], ["name", "ASC"]]
          }
        ],
        transaction
      });

      const formattedMenuItem = {
        ...createdMenuItem.get(),
        variants: createdMenuItem.variants || []
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
      const { name, price, category, description, ingredients, isPOSItem, image, imageBase64, isBeverage, unit, availableQuantity, costPerUnit } = req.body;
      const menuItem = await MenuItem.findByPk(id, { transaction });
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({ error: "Menu item not found" });
      }
      let priceValue = price;
      if (price !== undefined) {
        priceValue = typeof price === "string" ? parseFloat(price) : price;
        if (isNaN(priceValue)) {
          await transaction.rollback();
          return res.status(400).json({ error: "Price must be a valid number" });
        }
      }
      if (name !== undefined && name.trim() === "") {
        await transaction.rollback();
        return res.status(400).json({ error: "Name cannot be empty" });
      }
      if (price !== undefined && priceValue < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Price cannot be negative" });
      }
      let categoryId = undefined;
      let categoryValue = null;
      if (category !== undefined) {
        if (typeof category === "object" && category !== null && category.id) {
          categoryId = category.id;
          categoryValue = category.name || category.value;
        } else if (typeof category === "string") {
          try {
            const parsedCategory = JSON.parse(category);
            if (parsedCategory && typeof parsedCategory === "object" && parsedCategory.id) {
              categoryId = parsedCategory.id;
              categoryValue = parsedCategory.name || parsedCategory.value;
            } else {
            }
          } catch (e) {
            let categoryRecord = await Category.findOne({
              where: { value: category, isActive: true }
            });
            if (!categoryRecord) {
              categoryRecord = await Category.findOne({
                where: { name: category, isActive: true }
              });
            }
            if (categoryRecord) {
              categoryId = categoryRecord.id;
              categoryValue = categoryRecord.value;
            } else {
            }
          }
        } else if (typeof category === "number") {
          categoryId = category;
          const categoryRecord = await Category.findByPk(categoryId);
          if (categoryRecord && categoryRecord.isActive) {
            categoryValue = categoryRecord.value;
          }
        }
        if (!categoryId) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Invalid menu item category: ${JSON.stringify(category)}. Please use a valid category from the database.`
          });
        }
        const categoryRecord = await Category.findOne({
          where: { id: categoryId, isActive: true }
        });
        if (!categoryRecord) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Category with ID ${categoryId} not found or inactive.`
          });
        }
      }
      let parsedIngredients = ingredients;
      if (ingredients !== undefined) {
        if (typeof ingredients === "string") {
          try {
            parsedIngredients = JSON.parse(ingredients);
          } catch (e) {
            await transaction.rollback();
            return res.status(400).json({ error: "Invalid ingredients format - must be valid JSON array" });
          }
        }
        if (!Array.isArray(parsedIngredients)) {
          await transaction.rollback();
          return res.status(400).json({ error: "Ingredients must be an array" });
        }
        if (parsedIngredients.length > 0) {
          for (const ingredient of parsedIngredients) {
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
      let imageUrl = menuItem.image;
      if (req.file) {
        imageUrl = `/uploads/menu/${req.file.filename}`;
      } else if (imageBase64 !== undefined && typeof imageBase64 === "string" && imageBase64.startsWith("data:image/")) {
        imageUrl = imageBase64;
      } else if (image !== undefined) {
        if (typeof image === "string") {
          if (image.startsWith("[") || image.startsWith("{")) {
            try {
              const parsedImage = JSON.parse(image);
              imageUrl = null;
            } catch (e) {
              imageUrl = image;
            }
          } else {
            imageUrl = image;
          }
        } else if (typeof image === "object") {
          imageUrl = menuItem.image;
        } else {
          imageUrl = image;
        }
      }
      // Handle beverage-specific fields
      let beverageData = {};
      if (isBeverage !== undefined) {
        beverageData.isBeverage = Boolean(isBeverage);
      }
      if (unit !== undefined) {
        beverageData.unit = unit;
      }
      if (availableQuantity !== undefined) {
        const quantity = typeof availableQuantity === "string" ? parseFloat(availableQuantity) : availableQuantity;
        if (isNaN(quantity) || quantity < 0) {
          await transaction.rollback();
          return res.status(400).json({ error: "Available quantity must be a non-negative number" });
        }
        beverageData.availableQuantity = quantity;
      }
      if (costPerUnit !== undefined) {
        const cost = typeof costPerUnit === "string" ? parseFloat(costPerUnit) : costPerUnit;
        if (isNaN(cost) || cost < 0) {
          await transaction.rollback();
          return res.status(400).json({ error: "Cost per unit must be a non-negative number" });
        }
        beverageData.costPerUnit = cost;
      }
      
      await menuItem.update(
        {
          name: name !== undefined ? name : menuItem.name,
          price: price !== undefined ? priceValue : menuItem.price,
          categoryId: categoryId !== undefined ? categoryId : menuItem.categoryId,
          description: description !== undefined ? description : menuItem.description,
          isPOSItem: isPOSItem !== undefined ? isPOSItem : menuItem.isPOSItem,
          image: imageUrl,
          ...beverageData
        },
        { transaction }
      );
      if (ingredients !== undefined) {
        await MenuItemIngredient.destroy({
          where: { menuItemId: id },
          transaction
        });
        if (parsedIngredients.length > 0) {
          const ingredientData = parsedIngredients.map(ingredient => {
            const cost = typeof ingredient.cost === 'string' 
              ? parseFloat(ingredient.cost).toFixed(6) 
              : parseFloat(ingredient.cost).toFixed(6);
            const quantity = typeof ingredient.quantity === 'string'
              ? parseFloat(ingredient.quantity).toFixed(6)
              : parseFloat(ingredient.quantity).toFixed(6);
            return {
              menuItemId: id,
              materialId: ingredient.materialId,
              quantity: quantity,
              unit: ingredient.unit,
              cost: cost
            };
          });
          await MenuItemIngredient.bulkCreate(ingredientData, { transaction });
        }
      }
      const updatedMenuItem = await MenuItem.findByPk(id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "value"],
            required: false
          },
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
      await MenuItemIngredient.destroy({
        where: { menuItemId: id },
        transaction
      });
      await menuItem.destroy({ transaction });
      await transaction.commit();
      res.status(204).send();
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  assignPrinter: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { printerId } = req.body;
      if (printerId) {
        const printer = await Printer.findByPk(printerId);
        if (!printer) {
          return res.status(404).json({ error: "Printer not found" });
        }
      }
      const [updatedRowsCount] = await MenuItem.update({ printerId: printerId || null }, { where: { id } });
      if (updatedRowsCount === 0) {
        return res.status(404).json({ error: "Menu item not found" });
      }
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
            required: false
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
      if (printerId) {
        const printer = await Printer.findByPk(printerId);
        if (!printer) {
          return res.status(404).json({ error: "Printer not found" });
        }
      }
      const [updatedRowsCount] = await MenuItem.update({ printerId: printerId || null }, { where: { id: menuItemIds } });
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
  // Get menu items by type (food or beverage)
  getMenuItemsByType: async (req, res, next) => {
    try {
      const { type } = req.params;
      const { isActive } = req.query;
      
      // Validate type parameter
      if (!['food', 'beverage'].includes(type)) {
        return res.status(400).json({ error: "Type must be either 'food' or 'beverage'" });
      }
      
      // Build where clause
      const whereClause = {
        isBeverage: type === 'beverage'
      };
      
      // Add isActive filter if provided
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }
      
      // Log the request for debugging
      console.log(`Getting ${type} menu items. Query params:`, req.query);
      console.log('Where clause:', whereClause);
      
      const menuItems = await MenuItem.findAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "value"],
            required: false
          },
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          },
          {
            model: Variants,
            as: "variants",
            attributes: ["id", "name", "volume", "unit", "price", "isActive", "sortOrder"],
            where: { isActive: true },
            required: false,
            order: [["sortOrder", "ASC"], ["name", "ASC"]]
          }
        ]
      });
      
      const formattedMenuItems = menuItems.map(item => ({
        ...item.get(),
        ingredients: item.menuItemIngredients.map(ingredient => ({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost,
          material: ingredient.material
        })),
        variants: item.variants || []
      }));
      
      res.status(200).json(formattedMenuItems);
    } catch (error) {
      next(error);
    }
  },

  bulkUpdateCategory: async (req, res, next) => {
    try {
      const { menuItemIds, category } = req.body;
      if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
        return res.status(400).json({ error: "Menu item IDs array is required" });
      }
      if (!category || typeof category !== "string") {
        return res.status(400).json({ error: "Category is required and must be a string" });
      }
      if (!(await isValidCategory(category, "menu_items"))) {
        return res.status(400).json({
          error: `Invalid menu item category: ${category}. Please use a valid category from the database.`
        });
      }
      const [updatedRowsCount] = await MenuItem.update({ category }, { where: { id: menuItemIds } });
      if (updatedRowsCount === 0) {
        return res.status(404).json({ error: "No menu items found with the provided IDs" });
      }
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

  // Get available menu item categories
  getMenuItemCategories: async (req, res, next) => {
    try {
      const categories = await getMenuItemCategories();
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (err) {
      next(err);
    }
  },

  // Create beverage variants with custom sizes, price adjustments, and naming formats
  createBeverageVariants: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { 
        baseMenuItem,
        selectedVariants,
        priceAdjustments,
        nameFormat
      } = req.body;
      if (!baseMenuItem || !baseMenuItem.id) {
        await transaction.rollback();
        return res.status(400).json({ error: "Base menu item is required" });
      }
      if (!Array.isArray(selectedVariants) || selectedVariants.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "At least one variant size must be selected" });
      }
      if (!priceAdjustments || typeof priceAdjustments !== "object") {
        await transaction.rollback();
        return res.status(400).json({ error: "Price adjustments are required" });
      }
      if (!nameFormat || (nameFormat !== "prefix" && nameFormat !== "suffix")) {
        await transaction.rollback();
        return res.status(400).json({ error: "Valid name format (prefix or suffix) is required" });
      }
      const menuItem = await MenuItem.findByPk(baseMenuItem.id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "value"],
            required: false
          },
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [{ model: Material, as: "material" }]
          }
        ],
        transaction
      });

      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({ error: "Base menu item not found" });
      }
      const createdVariants = [];
      for (const size of selectedVariants) {
        const priceMultiplier = priceAdjustments[size] !== undefined ? parseFloat(priceAdjustments[size]) : 1.0;
        if (isNaN(priceMultiplier)) {
          await transaction.rollback();
          return res.status(400).json({ error: `Invalid price multiplier for size ${size}` });
        }
        let variantName;
        if (nameFormat === "prefix") {
          variantName = `${size.charAt(0).toUpperCase() + size.slice(1)} ${menuItem.name}`;
        } else {
          variantName = `${menuItem.name} (${size.charAt(0).toUpperCase() + size.slice(1)})`;
        }
        const adjustedPrice = parseFloat((menuItem.price * priceMultiplier).toFixed(2));
        const newVariant = await MenuItem.create(
          {
            name: variantName,
            price: adjustedPrice,
            categoryId: menuItem.categoryId,
            description: `${size.charAt(0).toUpperCase() + size.slice(1)} variant of ${menuItem.name}`,
            isPOSItem: menuItem.isPOSItem,
            image: menuItem.image,
            parentItemId: menuItem.id,
            variantSize: size,
            variantId: uuidv4()
          },
          { transaction }
        );
        if (menuItem.menuItemIngredients && menuItem.menuItemIngredients.length > 0) {
          const ingredientData = menuItem.menuItemIngredients.map(ingredient => ({
            menuItemId: newVariant.id,
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost
          }));
          await MenuItemIngredient.bulkCreate(ingredientData, { transaction });
        }
        const completeVariant = await MenuItem.findByPk(newVariant.id, {
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "value"],
              required: false
            },
            {
              model: MenuItemIngredient,
              as: "menuItemIngredients",
              include: [{ model: Material, as: "material" }]
            }
          ],
          transaction
        });
        const formattedVariant = {
          ...completeVariant.get(),
          ingredients: completeVariant.menuItemIngredients.map(ingredient => ({
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost
          }))
        };
        createdVariants.push(formattedVariant);
      }
      await transaction.commit();
      res.status(201).json({
        message: `Successfully created ${createdVariants.length} variants for ${menuItem.name}`,
        variants: createdVariants
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating beverage variants:", error);
      next(error);
    }
  }
};

export default menuItemsController;
