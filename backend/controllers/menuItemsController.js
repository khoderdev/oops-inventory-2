import sequelize from "../config/database.js";
import { MenuItem, MenuItemIngredient, MenuItemSauce, Variants, VariantIngredient } from "../models/index.js";
import Category from "../models/Category.js";
import Material from "../models/materials.js";
import { isValidBeverageUnit, formatVolume } from "../utils/volumeConversionUtils.js";

const menuItemsController = {
  getMenuItemsWithPrinters: async (req, res, next) => {
    try {
      const menuItems = await MenuItem.findAll({
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "value"],
            required: false
          }
        ]
      });
      
      res.status(200).json(menuItems);
    } catch (error) {
      next(error);
    }
  },

  getMenuItemCategories: async (req, res, next) => {
    try {
      const categories = await Category.findAll({
        where: { isActive: true },
        order: [["name", "ASC"]]
      });
      
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  },

  getMenuItemsByType: async (req, res, next) => {
    try {
      const { type } = req.params;
      const { isActive } = req.query;
      
      const where = {};
      
      // Filter by type (food or beverage)
      if (type === "beverage") {
        where.isBeverage = true;
      } else if (type === "food") {
        where.isBeverage = false;
      }
      
      // Filter by active status if provided
      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }
      
      const menuItems = await MenuItem.findAll({
        where,
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
        ingredients: [
          ...item.menuItemIngredients.map(ingredient => ({
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost,
            type: "material"
          })),
          ...item.menuItemSauces.map(sauce => ({
            materialId: `sauce-${sauce.sauceId}`,
            quantity: sauce.quantity,
            unit: sauce.unit,
            cost: sauce.cost,
            type: "sauce"
          }))
        ],
        variants: item.variants || []
      }));
      
      res.status(200).json(formattedMenuItems);
    } catch (error) {
      next(error);
    }
  },

  updateMenuItem: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { name, price, category, description, isPOSItem, image, imageBase64, ingredients, isBeverage, unit, availableQuantity, costPerUnit, variants } = req.body;
      
      const menuItem = await MenuItem.findByPk(id);
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({ error: "Menu item not found" });
      }
      
      // Handle category
      let categoryId = null;
      if (typeof category === "object" && category?.id) {
        categoryId = category.id;
      } else if (typeof category === "string") {
        try {
          const parsedCategory = JSON.parse(category);
          if (parsedCategory?.id) {
            categoryId = parsedCategory.id;
          } else {
            const categoryRecord = await Category.findOne({ where: { value: category, isActive: true } });
            if (categoryRecord) categoryId = categoryRecord.id;
          }
        } catch (e) {
          const categoryRecord = await Category.findOne({ where: { value: category, isActive: true } });
          if (categoryRecord) categoryId = categoryRecord.id;
        }
      } else if (typeof category === "number") {
        categoryId = category;
      }
      
      // Update basic fields
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (price !== undefined) updateData.price = typeof price === "string" ? parseFloat(price) : price;
      if (categoryId) updateData.categoryId = categoryId;
      if (description !== undefined) updateData.description = description;
      if (isPOSItem !== undefined) updateData.isPOSItem = Boolean(isPOSItem);
      
      // Handle image
      let imageUrl = null;
      if (req.file) imageUrl = `/uploads/menu/${req.file.filename}`;
      else if (imageBase64 && imageBase64.startsWith("data:image/")) imageUrl = imageBase64;
      else if (image) imageUrl = image;
      if (imageUrl) updateData.image = imageUrl;
      
      // Handle beverage fields
      if (isBeverage !== undefined) updateData.isBeverage = Boolean(isBeverage);
      if (unit !== undefined) updateData.unit = unit;
      if (availableQuantity !== undefined) {
        updateData.availableQuantity = typeof availableQuantity === "string" ? parseFloat(availableQuantity) : availableQuantity;
      }
      if (costPerUnit !== undefined) {
        updateData.costPerUnit = typeof costPerUnit === "string" ? parseFloat(costPerUnit) : costPerUnit;
      }
      
      // Update the menu item
      await menuItem.update(updateData, { transaction });
      
      // Handle ingredients if provided
      if (ingredients) {
        // Parse ingredients if needed
        let parsedIngredients = [];
        if (typeof ingredients === "string") parsedIngredients = JSON.parse(ingredients);
        else if (Array.isArray(ingredients)) parsedIngredients = ingredients;
        
        // Delete existing ingredients
        await MenuItemIngredient.destroy({ where: { menuItemId: id }, transaction });
        await MenuItemSauce.destroy({ where: { menuItemId: id }, transaction });
        
        // Group ingredients by variant
        const regularIngredients = [];
        const variantIngredientsMap = {};
        
        parsedIngredients.forEach(ing => {
          if (ing.variantName) {
            if (!variantIngredientsMap[ing.variantName]) {
              variantIngredientsMap[ing.variantName] = [];
            }
            variantIngredientsMap[ing.variantName].push(ing);
          } else {
            regularIngredients.push(ing);
          }
        });
        
        // Process regular ingredients
        const materialIngredients = regularIngredients
          .filter(i => i.materialId)
          .map(i => ({
            menuItemId: menuItem.id,
            materialId: Number(i.materialId),
            quantity: Number(i.quantity),
            unit: i.unit,
            cost: Number(i.cost) || 0
          }));
        
        const sauceIngredients = regularIngredients
          .filter(i => i.sauceId)
          .map(i => ({
            menuItemId: menuItem.id,
            sauceId: Number(i.sauceId),
            quantity: Number(i.quantity),
            unit: i.unit,
            cost: Number(i.cost) || 0
          }));
        
        // Insert regular ingredients
        if (materialIngredients.length > 0) {
          await MenuItemIngredient.bulkCreate(materialIngredients, { transaction });
        }
        
        if (sauceIngredients.length > 0) {
          await MenuItemSauce.bulkCreate(sauceIngredients, { transaction });
        }
      }
      
      // Handle variants if provided
      if (variants && typeof variants === "object") {
        // Delete existing variants and their ingredients
        const existingVariants = await Variants.findAll({ where: { menuItemId: id } });
        const variantIds = existingVariants.map(v => v.id);
        
        if (variantIds.length > 0) {
          await VariantIngredient.destroy({ where: { variantId: variantIds }, transaction });
        }
        
        await Variants.destroy({ where: { menuItemId: id }, transaction });
        
        // Create new variants
        const variantData = [];
        for (const [name, info] of Object.entries(variants)) {
          if (!info.volume || !info.unit || !info.price) continue;
          
          variantData.push({
            menuItemId: menuItem.id,
            name,
            volume: Number(info.volume),
            unit: info.unit,
            price: Number(info.price),
            isActive: true,
            sortOrder: variantData.length
          });
        }
        
        if (variantData.length > 0) {
          const createdVariants = await Variants.bulkCreate(variantData, { transaction });
          
          // Process variant ingredients if any
          if (Object.keys(variantIngredientsMap).length > 0) {
            // Map variant names to IDs
            const variantNameToIdMap = {};
            createdVariants.forEach(variant => {
              variantNameToIdMap[variant.name] = variant.id;
            });
            
            // Prepare variant ingredients data
            let variantIngredientsData = [];
            
            Object.entries(variantIngredientsMap).forEach(([variantName, ingredients]) => {
              const variantId = variantNameToIdMap[variantName];
              
              if (!variantId) return;
              
              ingredients.forEach(ing => {
                if (ing.materialId) {
                  variantIngredientsData.push({
                    variantId,
                    materialId: ing.materialId || null,
                    sauceId: ing.sauceId || null,
                    quantity: Number(ing.quantity),
                    unit: ing.unit,
                    cost: Number(ing.cost) || 0,
                    sortOrder: 0,
                    isActive: true,
                    notes: null
                  });
                }
              });
            });
            
            if (variantIngredientsData.length > 0) {
              await VariantIngredient.bulkCreate(variantIngredientsData, { transaction });
            }
          }
        }
      }
      
      // Fetch updated menu item with relations
      const updatedMenuItem = await MenuItem.findByPk(id, {
        include: [
          { model: Category, as: "category", attributes: ["id", "name", "value"], required: false },
          { model: MenuItemIngredient, as: "menuItemIngredients", include: [{ model: Material, as: "material" }] },
          { model: MenuItemSauce, as: "menuItemSauces" },
          { model: Variants, as: "variants", where: { isActive: true }, required: false, order: [["sortOrder", "ASC"]] }
        ],
        transaction
      });
      
      await transaction.commit();
      
      // Format response
      const formattedMenuItem = {
        ...updatedMenuItem.get(),
        ingredients: [
          ...updatedMenuItem.menuItemIngredients.map(ingredient => ({
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost,
            type: "material"
          })),
          ...updatedMenuItem.menuItemSauces.map(sauce => ({
            materialId: `sauce-${sauce.sauceId}`,
            quantity: sauce.quantity,
            unit: sauce.unit,
            cost: sauce.cost,
            type: "sauce"
          }))
        ],
        variants: updatedMenuItem.variants || []
      };
      
      res.status(200).json(formattedMenuItem);
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating menu item:", error);
      next(error);
    }
  },

  deleteMenuItem: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      
      // Check if menu item exists
      const menuItem = await MenuItem.findByPk(id);
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({ error: "Menu item not found" });
      }
      
      // Delete related records
      await MenuItemIngredient.destroy({ where: { menuItemId: id }, transaction });
      await MenuItemSauce.destroy({ where: { menuItemId: id }, transaction });
      
      // Delete variants and variant ingredients
      const variants = await Variants.findAll({ where: { menuItemId: id } });
      const variantIds = variants.map(v => v.id);
      
      if (variantIds.length > 0) {
        await VariantIngredient.destroy({ where: { variantId: variantIds }, transaction });
      }
      
      await Variants.destroy({ where: { menuItemId: id }, transaction });
      
      // Delete the menu item
      await menuItem.destroy({ transaction });
      
      await transaction.commit();
      
      res.status(200).json({ message: "Menu item deleted successfully" });
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting menu item:", error);
      next(error);
    }
  },

  bulkUpdateCategory: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { menuItemIds, categoryId } = req.body;
      
      if (!menuItemIds || !Array.isArray(menuItemIds) || menuItemIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Menu item IDs are required" });
      }
      
      if (!categoryId) {
        await transaction.rollback();
        return res.status(400).json({ error: "Category ID is required" });
      }
      
      // Check if category exists
      const category = await Category.findByPk(categoryId);
      if (!category) {
        await transaction.rollback();
        return res.status(404).json({ error: "Category not found" });
      }
      
      // Update menu items
      await MenuItem.update(
        { categoryId },
        { where: { id: menuItemIds }, transaction }
      );
      
      await transaction.commit();
      
      res.status(200).json({ message: `Updated ${menuItemIds.length} menu items to category ${category.name}` });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating menu item categories:", error);
      next(error);
    }
  },

  assignPrinter: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { printerId } = req.body;
      
      if (!printerId) {
        return res.status(400).json({ error: "Printer ID is required" });
      }
      
      const menuItem = await MenuItem.findByPk(id);
      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      
      await menuItem.update({ printerId });
      
      res.status(200).json({ message: "Printer assigned successfully" });
    } catch (error) {
      console.error("Error assigning printer:", error);
      next(error);
    }
  },

  bulkAssignPrinter: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { menuItemIds, printerId } = req.body;
      
      if (!menuItemIds || !Array.isArray(menuItemIds) || menuItemIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Menu item IDs are required" });
      }
      
      if (!printerId) {
        await transaction.rollback();
        return res.status(400).json({ error: "Printer ID is required" });
      }
      
      // Update menu items
      await MenuItem.update(
        { printerId },
        { where: { id: menuItemIds }, transaction }
      );
      
      await transaction.commit();
      
      res.status(200).json({ message: `Assigned printer to ${menuItemIds.length} menu items` });
    } catch (error) {
      await transaction.rollback();
      console.error("Error bulk assigning printer:", error);
      next(error);
    }
  },

  createBeverageVariants: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { menuItemId, variants } = req.body;
      
      if (!menuItemId) {
        await transaction.rollback();
        return res.status(400).json({ error: "Menu item ID is required" });
      }
      
      if (!variants || !Array.isArray(variants) || variants.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Variants are required" });
      }
      
      // Check if menu item exists
      const menuItem = await MenuItem.findByPk(menuItemId);
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({ error: "Menu item not found" });
      }
      
      // Create variants
      const variantData = variants.map((variant, index) => ({
        menuItemId,
        name: variant.name,
        volume: Number(variant.volume),
        unit: variant.unit,
        price: Number(variant.price),
        isActive: variant.isActive !== false,
        sortOrder: index
      }));
      
      const createdVariants = await Variants.bulkCreate(variantData, { transaction });
      
      await transaction.commit();
      
      res.status(201).json(createdVariants);
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating beverage variants:", error);
      next(error);
    }
  },

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

      console.log(`✅ [createMenuItem] Created menu item: ${menuItem.name} (ID: ${menuItem.id})`);

      // --- Group ingredients by variant ---
      const regularIngredients = [];
      const variantIngredientsMap = {};

      parsedIngredients.forEach(ing => {
        if (ing.variantName) {
          if (!variantIngredientsMap[ing.variantName]) {
            variantIngredientsMap[ing.variantName] = [];
          }
          variantIngredientsMap[ing.variantName].push(ing);
          console.log(`🔍 [createMenuItem] Added ingredient to variant ${ing.variantName}:`, JSON.stringify(ing));
        } else {
          regularIngredients.push(ing);
        }
      });

      console.log(`🔍 [createMenuItem] Found ${regularIngredients.length} regular ingredients and ${Object.keys(variantIngredientsMap).length} variant types with ingredients`);

      // --- Process regular ingredients ---
      const materialIngredients = regularIngredients
        .filter(i => i.materialId)
        .map(i => ({
          menuItemId: menuItem.id,
          materialId: Number(i.materialId),
          quantity: Number(i.quantity),
          unit: i.unit,
          cost: Number(i.cost) || 0
        }));

      const sauceIngredients = regularIngredients
        .filter(i => i.sauceId)
        .map(i => ({
          menuItemId: menuItem.id,
          sauceId: Number(i.sauceId),
          quantity: Number(i.quantity),
          unit: i.unit,
          cost: Number(i.cost) || 0
        }))
        .filter(s => s.sauceId && s.quantity > 0 && s.unit && s.cost >= 0);

      // --- Insert regular ingredients into DB ---
      if (materialIngredients.length > 0) {
        await MenuItemIngredient.bulkCreate(materialIngredients, { transaction });
        console.log(`✅ [createMenuItem] Created ${materialIngredients.length} regular material ingredients`);
      }

      if (sauceIngredients.length > 0) {
        await MenuItemSauce.bulkCreate(sauceIngredients, { transaction });
        console.log(`✅ [createMenuItem] Created ${sauceIngredients.length} regular sauce ingredients`);
      }

      // Regular ingredients have already been processed above
      
      // --- Handle variants ---
      if (variants && typeof variants === "object") {
        const variantData = [];

        for (const [name, info] of Object.entries(variants)) {
          // Validate variant data
          if (!info.volume || !info.unit || !info.price) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Invalid variant data for "${name}". Volume, unit, and price are required.`
            });
          }

          const volume = Number(info.volume);
          const price = Number(info.price);

          // Validate numeric values
          if (isNaN(volume) || volume <= 0) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Invalid volume for variant "${name}". Must be a positive number.`
            });
          }

          if (isNaN(price) || price < 0) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Invalid price for variant "${name}". Must be a non-negative number.`
            });
          }

          // Validate unit for beverage items
          if (beverageData.isBeverage !== false && !isValidBeverageUnit(info.unit)) {
            console.warn(`⚠️ [createMenuItem] Non-standard beverage unit for variant "${name}": ${info.unit}`);
            // Don't block creation but log the warning
          }

          variantData.push({
            menuItemId: menuItem.id,
            name,
            volume,
            unit: info.unit,
            price,
            isActive: true,
            sortOrder: variantData.length
          });

          console.log(`✅ [createMenuItem] Validated variant: ${name} - ${formatVolume(volume, info.unit)} @ $${price.toFixed(2)}`);
        }

        if (variantData.length > 0) {
          // Create variants in database
          console.log(`🔍 [createMenuItem] Creating ${variantData.length} variants in database`);
          const createdVariants = await Variants.bulkCreate(variantData, { transaction });

          // Process variant ingredients if any
          if (Object.keys(variantIngredientsMap).length > 0) {
            console.log(`🔍 [createMenuItem] Processing variant ingredients for ${Object.keys(variantIngredientsMap).length} variant types`);

            // Map variant names to IDs
            const variantNameToIdMap = {};
            createdVariants.forEach(variant => {
              variantNameToIdMap[variant.name] = variant.id;
              console.log(`🔍 [createMenuItem] Mapped variant ${variant.name} to ID ${variant.id}`);
            });

            // Prepare variant ingredients data
            let variantIngredientsData = [];

            Object.entries(variantIngredientsMap).forEach(([variantName, ingredients]) => {
              const variantId = variantNameToIdMap[variantName];
              console.log(`🔍 [createMenuItem] Processing ${ingredients.length} ingredients for variant ${variantName} (ID: ${variantId || "not found"})`);

              if (!variantId) {
                console.warn(`⚠️ [createMenuItem] No variant ID found for variant name: ${variantName}`);
                return;
              }

              ingredients.forEach(ing => {
                if (ing.materialId) {
                  const ingredientData = {
                    variantId,
                    materialId: ing.materialId || null,
                    sauceId: ing.sauceId || null,
                    quantity: Number(ing.quantity),
                    unit: ing.unit,
                    cost: Number(ing.cost) || 0,
                    sortOrder: 0,
                    isActive: true,
                    notes: null
                  };

                  variantIngredientsData.push(ingredientData);
                  console.log(`🔍 [createMenuItem] Added variant ingredient:`, JSON.stringify(ingredientData));
                }
              });
            });

            if (variantIngredientsData.length > 0) {
              console.log(`🔍 [createMenuItem] Saving ${variantIngredientsData.length} variant ingredients to database`);
              await VariantIngredient.bulkCreate(variantIngredientsData, { transaction });
              console.log(`✅ [createMenuItem] Successfully created ${variantIngredientsData.length} variant ingredients for ${menuItem.name}`);
            } else {
              console.warn(`⚠️ [createMenuItem] No variant ingredients to save after processing`);
            }
          }
        }
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

      await transaction.commit();

      // Format response
      const formattedMenuItem = {
        ...createdMenuItem.get(),
        ingredients: [
          ...createdMenuItem.menuItemIngredients.map(ingredient => ({
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost,
            type: "material"
          })),
          ...createdMenuItem.menuItemSauces.map(sauce => ({
            materialId: `sauce-${sauce.sauceId}`,
            quantity: sauce.quantity,
            unit: sauce.unit,
            cost: sauce.cost,
            type: "sauce"
          }))
        ],
        variants: createdMenuItem.variants || []
      };

      res.status(201).json(formattedMenuItem);
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating menu item:", error);
      next(error);
    }
  }
};

export default menuItemsController;
