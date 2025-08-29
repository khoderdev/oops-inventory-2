import sequelize from "../config/database.js";
import { MenuItem, MenuItemIngredient, MenuItemSauce, Sauce, Variants } from "../models/index.js";
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
            model: MenuItemSauce,
            as: "menuItemSauces",
            attributes: ["id", "menuItemId", "sauceId", "quantity", "unit", "cost"]
          },
          {
            model: Variants,
            as: "variants",
            attributes: ["id", "name", "volume", "unit", "price", "isActive", "sortOrder"],
            where: { isActive: true },
            required: false,
            order: [
              ["sortOrder", "ASC"],
              ["name", "ASC"]
            ]
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
          type: "material"
        })),
        variants: item.variants || []
      }));

      res.status(200).json(formattedMenuItems);
    } catch (error) {
      next(error);
    }
  },

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
            order: [
              ["sortOrder", "ASC"],
              ["name", "ASC"]
            ]
          }
        ]
      });

      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      const formattedMenuItem = {
        ...menuItem.get(),
        ingredients: [
          // Materials (regular ingredients)
          ...menuItem.menuItemIngredients.map(ingredient => ({
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost,
            type: "material"
          })),
          // Sauces (converted to material-like format with sauce- prefix)
          ...menuItem.menuItemSauces.map(sauce => ({
            materialId: `sauce-${sauce.sauceId}`,
            quantity: sauce.quantity,
            unit: sauce.unit,
            cost: sauce.cost,
            type: "sauce"
          }))
        ],
        variants: menuItem.variants || []
      };
      res.status(200).json(formattedMenuItem);
    } catch (error) {
      next(error);
    }
  },

  createMenuItem: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { name, price, category, description, isPOSItem, image, imageBase64, ingredients, isBeverage, unit, availableQuantity, costPerUnit, variants } = req.body;

      if (!name || price === undefined || !category) {
        await transaction.rollback();
        return res.status(400).json({ error: "Name, price, and category are required" });
      }

      const priceValue = typeof price === "string" ? parseFloat(price) : price;
      if (isNaN(priceValue) || priceValue < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Price must be a non-negative number" });
      }

      // --- Handle category ---
      let categoryId = null;
      let categoryValue = null;

      if (typeof category === "object" && category?.id) {
        categoryId = category.id;
        categoryValue = category.name || category.value;
      } else if (typeof category === "string") {
        try {
          const parsedCategory = JSON.parse(category);
          if (parsedCategory?.id) {
            categoryId = parsedCategory.id;
            categoryValue = parsedCategory.name || parsedCategory.value;
          } else {
            const categoryRecord = (await Category.findOne({ where: { value: category, isActive: true } })) || (await Category.findOne({ where: { name: category, isActive: true } }));
            if (categoryRecord) {
              categoryId = categoryRecord.id;
              categoryValue = categoryRecord.value;
            }
          }
        } catch (e) {
          const categoryRecord = (await Category.findOne({ where: { value: category, isActive: true } })) || (await Category.findOne({ where: { name: category, isActive: true } }));
          if (categoryRecord) {
            categoryId = categoryRecord.id;
            categoryValue = categoryRecord.value;
          }
        }
      } else if (typeof category === "number") {
        categoryId = category;
        const categoryRecord = await Category.findByPk(categoryId);
        if (categoryRecord) categoryValue = categoryRecord.value;
      }

      if (!categoryId) {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid menu item category" });
      }

      const categoryRecord = await Category.findOne({ where: { id: categoryId, isActive: true } });
      if (!categoryRecord) {
        await transaction.rollback();
        return res.status(400).json({ error: `Category with ID ${categoryId} not found or inactive.` });
      }

      // --- Parse ingredients ---
      let parsedIngredients = [];
      if (ingredients) {
        if (typeof ingredients === "string") parsedIngredients = JSON.parse(ingredients);
        else if (Array.isArray(ingredients)) parsedIngredients = ingredients;
      }

      // --- Ensure required ingredients ---
      const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
      const requiresIngredients = !noIngredientsCategories.includes(categoryValue?.toLowerCase());
      if (requiresIngredients && parsedIngredients.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: `${categoryValue} items require at least one ingredient or sauce` });
      }

      // --- Validate ingredients ---
      parsedIngredients.forEach(ing => {
        if (!(ing.materialId || ing.sauceId) || !ing.unit || ing.quantity === undefined || ing.cost === undefined) {
          throw new Error("All ingredient fields are required");
        }
        if (ing.quantity <= 0) throw new Error("Ingredient quantity must be positive");
        if (ing.cost < 0) throw new Error("Ingredient cost cannot be negative");
      });

      // --- Handle beverage/stock info ---
      const beverageData = {};
      if (isBeverage !== undefined) beverageData.isBeverage = Boolean(isBeverage);
      if (unit !== undefined) beverageData.unit = unit;
      if (availableQuantity !== undefined) {
        const qty = typeof availableQuantity === "string" ? parseFloat(availableQuantity) : availableQuantity;
        if (isNaN(qty) || qty < 0) throw new Error("Available quantity must be non-negative");
        beverageData.availableQuantity = qty;
      }
      if (costPerUnit !== undefined) {
        const cost = typeof costPerUnit === "string" ? parseFloat(costPerUnit) : costPerUnit;
        if (isNaN(cost) || cost < 0) throw new Error("Cost per unit must be non-negative");
        beverageData.costPerUnit = cost;
      }

      // --- Handle image ---
      let imageUrl = null;
      if (req.file) imageUrl = `/uploads/menu/${req.file.filename}`;
      else if (imageBase64 && imageBase64.startsWith("data:image/")) imageUrl = imageBase64;
      else if (image) imageUrl = image;

      // --- Create MenuItem ---
      const menuItem = await MenuItem.create(
        {
          name: name.trim(),
          price: priceValue,
          categoryId,
          description,
          isPOSItem: isPOSItem ?? false,
          image: imageUrl,
          ...beverageData
        },
        { transaction }
      );

      // --- Separate and insert ingredients and sauces ---
      const materialIngredients = parsedIngredients
        .filter(i => i.materialId)
        .map(i => ({
          menuItemId: menuItem.id,
          materialId: Number(i.materialId),
          quantity: Number(i.quantity),
          unit: i.unit,
          cost: Number(i.cost)
        }));

      const sauceIngredients = parsedIngredients
        .filter(i => i.sauceId)
        .map(i => ({
          menuItemId: menuItem.id,
          sauceId: Number(i.sauceId),
          quantity: Number(i.quantity),
          unit: i.unit,
          cost: Number(i.cost)
        }))
        .filter(s => s.sauceId && s.quantity > 0 && s.unit && s.cost >= 0);

      // --- Insert into DB ---
      if (materialIngredients.length > 0) await MenuItemIngredient.bulkCreate(materialIngredients, { transaction });
      if (sauceIngredients.length > 0) await MenuItemSauce.bulkCreate(sauceIngredients, { transaction });

      // --- Handle variants ---
      if (variants && typeof variants === "object") {
        const variantData = Object.entries(variants).map(([name, info], index) => ({
          menuItemId: menuItem.id,
          name,
          volume: Number(info.volume),
          unit: info.unit,
          price: Number(info.price),
          isActive: true,
          sortOrder: index
        }));
        await Variants.bulkCreate(variantData, { transaction });
      }

      // --- Fetch full item with relations ---
      const createdMenuItem = await MenuItem.findByPk(menuItem.id, {
        include: [
          { model: Category, as: "category", attributes: ["id", "name", "value"], required: false },
          { model: MenuItemIngredient, as: "menuItemIngredients", include: [{ model: Material, as: "material" }] },
          { model: MenuItemSauce, as: "menuItemSauces" },
          { model: Variants, as: "variants", where: { isActive: true }, required: false, order: [["sortOrder", "ASC"]] }
        ],
        transaction
      });

      // --- Format single ingredients array ---
      const formattedMenuItem = {
        ...createdMenuItem.get(),
        ingredients: [
          ...createdMenuItem.menuItemIngredients.map(i => ({
            materialId: i.materialId,
            quantity: i.quantity,
            unit: i.unit,
            cost: i.cost
          })),
          ...createdMenuItem.menuItemSauces.map(s => ({
            sauceId: s.sauceId,
            quantity: s.quantity,
            unit: s.unit,
            cost: s.cost
          }))
        ],
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
      const { name, price, category, description, ingredients, isPOSItem, image, imageBase64, isBeverage, unit, availableQuantity, costPerUnit, variants } = req.body;

      const menuItem = await MenuItem.findByPk(id, { transaction });
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({ error: "Menu item not found" });
      }

      // --- Price validation ---
      let priceValue = price;
      if (price !== undefined) {
        priceValue = typeof price === "string" ? parseFloat(price) : price;
        if (isNaN(priceValue) || priceValue < 0) {
          await transaction.rollback();
          return res.status(400).json({ error: "Price must be a non-negative number" });
        }
      }

      // --- Name validation ---
      if (name !== undefined && name.trim() === "") {
        await transaction.rollback();
        return res.status(400).json({ error: "Name cannot be empty" });
      }

      // --- Category processing ---
      let categoryId = null;
      let categoryValue = null;
      if (category !== undefined) {
        if (typeof category === "object" && category?.id) {
          categoryId = category.id;
          categoryValue = category.name || category.value;
        } else if (typeof category === "string") {
          try {
            const parsedCategory = JSON.parse(category);
            if (parsedCategory?.id) {
              categoryId = parsedCategory.id;
              categoryValue = parsedCategory.name || parsedCategory.value;
            } else {
              const catRecord = (await Category.findOne({ where: { value: category, isActive: true } })) || (await Category.findOne({ where: { name: category, isActive: true } }));
              if (catRecord) {
                categoryId = catRecord.id;
                categoryValue = catRecord.value;
              }
            }
          } catch (e) {
            const catRecord = (await Category.findOne({ where: { value: category, isActive: true } })) || (await Category.findOne({ where: { name: category, isActive: true } }));
            if (catRecord) {
              categoryId = catRecord.id;
              categoryValue = catRecord.value;
            }
          }
        } else if (typeof category === "number") {
          categoryId = category;
          const catRecord = await Category.findByPk(categoryId);
          if (catRecord) categoryValue = catRecord.value;
        }

        if (!categoryId) {
          await transaction.rollback();
          return res.status(400).json({ error: "Invalid menu item category" });
        }

        const categoryRecord = await Category.findOne({ where: { id: categoryId, isActive: true } });
        if (!categoryRecord) {
          await transaction.rollback();
          return res.status(400).json({ error: `Category with ID ${categoryId} not found or inactive.` });
        }
      }

      // --- Parse ingredients ---
      let parsedIngredients = [];
      if (ingredients !== undefined) {
        if (typeof ingredients === "string") parsedIngredients = JSON.parse(ingredients);
        else if (Array.isArray(ingredients)) parsedIngredients = ingredients;

        // --- Validate ingredients and sauces ---
        parsedIngredients.forEach(ing => {
          if (!(ing.materialId || ing.sauceId) || !ing.unit || ing.quantity === undefined || ing.cost === undefined) {
            throw new Error("All ingredient fields are required");
          }
          if (ing.quantity <= 0) throw new Error("Ingredient quantity must be positive");
          if (ing.cost < 0) throw new Error("Ingredient cost cannot be negative");
        });
      }

      // --- Handle beverage/stock info ---
      const beverageData = {};
      if (isBeverage !== undefined) beverageData.isBeverage = Boolean(isBeverage);
      if (unit !== undefined) beverageData.unit = unit;
      if (availableQuantity !== undefined) {
        const qty = typeof availableQuantity === "string" ? parseFloat(availableQuantity) : availableQuantity;
        if (isNaN(qty) || qty < 0) throw new Error("Available quantity must be non-negative");
        beverageData.availableQuantity = qty;
      }
      if (costPerUnit !== undefined) {
        const cost = typeof costPerUnit === "string" ? parseFloat(costPerUnit) : costPerUnit;
        if (isNaN(cost) || cost < 0) throw new Error("Cost per unit must be non-negative");
        beverageData.costPerUnit = cost;
      }

      // --- Handle image ---
      let imageUrl = menuItem.image;
      if (image === null || image === '') {
        // Explicitly set to null to remove the image
        imageUrl = null;
      } else if (req.file) {
        imageUrl = `/uploads/menu/${req.file.filename}`;
      } else if (imageBase64 && imageBase64.startsWith("data:image/")) {
        imageUrl = imageBase64;
      } else if (image) {
        imageUrl = image;
      }

      // --- Update MenuItem ---
      await menuItem.update(
        {
          name: name !== undefined ? name.trim() : menuItem.name,
          price: price !== undefined ? priceValue : menuItem.price,
          categoryId: categoryId !== null ? categoryId : menuItem.categoryId,
          description: description !== undefined ? description : menuItem.description,
          isPOSItem: isPOSItem !== undefined ? isPOSItem : menuItem.isPOSItem,
          image: imageUrl,
          ...beverageData
        },
        { transaction }
      );

      // --- Delete old ingredients and sauces ---
      await MenuItemIngredient.destroy({ where: { menuItemId: id }, transaction });
      await MenuItemSauce.destroy({ where: { menuItemId: id }, transaction });

      // --- Insert new ingredients ---
      const materialIngredients = parsedIngredients
        .filter(i => i.materialId)
        .map(i => ({
          menuItemId: id,
          materialId: Number(i.materialId),
          quantity: Number(i.quantity),
          unit: i.unit,
          cost: Number(i.cost)
        }));

      const sauceIngredients = parsedIngredients
        .filter(i => i.sauceId)
        .map(i => ({
          menuItemId: id,
          sauceId: Number(i.sauceId),
          quantity: Number(i.quantity),
          unit: i.unit,
          cost: Number(i.cost)
        }))
        .filter(s => s.sauceId && s.quantity > 0 && s.unit && s.cost >= 0);

      if (materialIngredients.length > 0) await MenuItemIngredient.bulkCreate(materialIngredients, { transaction });
      if (sauceIngredients.length > 0) await MenuItemSauce.bulkCreate(sauceIngredients, { transaction });

      // --- Handle variants ---
      if (variants && typeof variants === "object") {
        await Variants.destroy({ where: { menuItemId: id }, transaction });
        const variantData = Object.entries(variants).map(([name, info], index) => ({
          menuItemId: id,
          name,
          volume: Number(info.volume),
          unit: info.unit,
          price: Number(info.price),
          isActive: true,
          sortOrder: index
        }));
        await Variants.bulkCreate(variantData, { transaction });
      }

      // --- Fetch updated item ---
      const updatedMenuItem = await MenuItem.findByPk(id, {
        include: [
          { model: Category, as: "category", attributes: ["id", "name", "value"], required: false },
          { model: MenuItemIngredient, as: "menuItemIngredients", include: [{ model: Material, as: "material" }] },
          { model: MenuItemSauce, as: "menuItemSauces" },
          { model: Variants, as: "variants", where: { isActive: true }, required: false, order: [["sortOrder", "ASC"]] }
        ],
        transaction
      });

      const formattedMenuItem = {
        ...updatedMenuItem.get(),
        ingredients: [
          ...updatedMenuItem.menuItemIngredients.map(i => ({
            materialId: i.materialId,
            quantity: i.quantity,
            unit: i.unit,
            cost: i.cost,
            type: "material"
          })),
          ...updatedMenuItem.menuItemSauces.map(s => ({
            sauceId: s.sauceId,
            quantity: s.quantity,
            unit: s.unit,
            cost: s.cost,
            type: "sauce"
          }))
        ],
        variants: updatedMenuItem.variants || []
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
      console.log("[MenuItemsController.deleteMenuItem] Request received", { id });
      const menuItem = await MenuItem.findByPk(id, { transaction });
      if (!menuItem) {
        console.warn("[MenuItemsController.deleteMenuItem] Menu item not found", { id });
        await transaction.rollback();
        return res.status(404).json({ error: "Menu item not found" });
      }
      console.log("[MenuItemsController.deleteMenuItem] Deleting related records", { id });
      const deletedVariants = await Variants.destroy({ where: { menuItemId: id }, transaction });
      console.log("[MenuItemsController.deleteMenuItem] Variants deleted", { id, count: deletedVariants });
      const deletedIngredients = await MenuItemIngredient.destroy({
        where: { menuItemId: id },
        transaction
      });
      console.log("[MenuItemsController.deleteMenuItem] Ingredients deleted", { id, count: deletedIngredients });
      await menuItem.destroy({ transaction });
      console.log("[MenuItemsController.deleteMenuItem] Menu item deleted", { id });
      await transaction.commit();
      console.log("[MenuItemsController.deleteMenuItem] Transaction committed", { id });
      return res.status(204).send();
    } catch (error) {
      console.error("[MenuItemsController.deleteMenuItem] Error during deletion", { error });
      await transaction.rollback();
      return next(error);
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

  // Get menu items by type (food or beverage)
  getMenuItemsByType: async (req, res, next) => {
    try {
      const { type } = req.params;
      const { isActive } = req.query;

      // Validate type parameter
      if (!["food", "beverage"].includes(type)) {
        return res.status(400).json({ error: "Type must be either 'food' or 'beverage'" });
      }

      // Build where clause
      const whereClause = {
        isBeverage: type === "beverage"
      };

      // Add isActive filter if provided
      if (isActive !== undefined) {
        whereClause.isActive = isActive === "true";
      }

      // Log the request for debugging
      console.log(`Getting ${type} menu items. Query params:`, req.query);
      console.log("Where clause:", whereClause);

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
            model: MenuItemSauce,
            as: "menuItemSauces",
            attributes: ["id", "menuItemId", "sauceId", "quantity", "unit", "cost"]
          },
          {
            model: Variants,
            as: "variants",
            attributes: ["id", "name", "volume", "unit", "price", "isActive", "sortOrder"],
            where: { isActive: true },
            required: false,
            order: [
              ["sortOrder", "ASC"],
              ["name", "ASC"]
            ]
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
        sauces: item.menuItemSauces.map(sauce => ({
          // Only include these properties, exclude the nested sauce object
          sauceId: sauce.sauceId,
          quantity: sauce.quantity,
          unit: sauce.unit,
          cost: sauce.cost
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
            model: MenuItemSauce,
            as: "menuItemSauces",
            include: [{ model: Sauce, as: "sauce" }]
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
        })),
        sauces: item.menuItemSauces.map(sauce => ({
          sauceId: sauce.sauceId,
          quantity: sauce.quantity,
          unit: sauce.unit,
          cost: sauce.cost,
          sauce: sauce.sauce
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
      const { baseMenuItem, selectedVariants, priceAdjustments, nameFormat } = req.body;
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
