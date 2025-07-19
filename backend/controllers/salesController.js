import sequelize from "../config/database.js";
import { Op } from "sequelize";
import { Assignment, Material, MenuItem, MenuItemIngredient, Sale, StockEntry, Section } from "../models/index.js";

const salesController = {
  getAllSales: async (req, res, next) => {
    try {
      const sales = await Sale.findAll();
      res.status(200).json(sales);
    } catch (error) {
      next(error);
    }
  },

  getSalesById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const sale = await Sale.findByPk(id);
      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.status(200).json(sale);
    } catch (error) {
      next(error);
    }
  },

  // Create new sale
  createSales: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { saleDate, totalAmount, items, menuItems, sectionId, id, createdAt, updatedAt } = req.body;

      if (!saleDate || totalAmount === undefined) {
        await transaction.rollback();
        return res.status(400).json({ error: "Sale date and total amount are required" });
      }

      if (totalAmount < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Total amount cannot be negative" });
      }

      if (isNaN(Date.parse(saleDate))) {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid sale date" });
      }

      // Validate sectionId - required for individual items, optional for menu items
      const hasIndividualItems = items && items.length > 0;
      const hasMenuItems = menuItems && menuItems.length > 0;
      
      if (hasIndividualItems && (!sectionId || sectionId === "" || isNaN(parseInt(sectionId)))) {
        await transaction.rollback();
        return res.status(400).json({ error: "Valid section ID is required for individual item sales" });
      }
      
      // For menu item only sales, assign a default section ID if none provided
      let finalSectionId;
      if (hasMenuItems && !hasIndividualItems && (!sectionId || sectionId === "" || sectionId === undefined)) {
        // Find a suitable section for menu items (prefer Kitchen, or any available section)
        const defaultSection = await Section.findOne({
          where: {
            name: ['Kitchen', 'kitchen', 'KITCHEN']
          },
          transaction
        }) || await Section.findOne({ transaction });
        
        if (defaultSection) {
          finalSectionId = defaultSection.id;
          console.log(`Menu-only sale: assigning default section '${defaultSection.name}' (ID: ${finalSectionId})`);
        } else {
          await transaction.rollback();
          return res.status(400).json({ error: "No sections available for menu item sales" });
        }
      } else if (sectionId && sectionId !== "" && sectionId !== undefined) {
        finalSectionId = parseInt(sectionId);
        console.log(`Using provided sectionId=${finalSectionId}`);
      } else {
        // Fallback: find any available section
        const fallbackSection = await Section.findOne({ transaction });
        if (fallbackSection) {
          finalSectionId = fallbackSection.id;
          console.log(`Fallback: assigning section '${fallbackSection.name}' (ID: ${finalSectionId})`);
        } else {
          await transaction.rollback();
          return res.status(400).json({ error: "No sections available" });
        }
      }

      // Process individual items and update section assignments AND stock entries
      if (items && items.length > 0) {
        for (const item of items) {
          const assignment = await Assignment.findByPk(item.assignmentId, {
            include: [
              { model: Material, as: "material" },
              { model: StockEntry, as: "stockEntry" }
            ],
            transaction
          });

          if (!assignment) {
            await transaction.rollback();
            return res.status(400).json({ error: `Assignment ${item.assignmentId} not found` });
          }

          const material = assignment.material;
          const stockEntry = assignment.stockEntry;

          if (!stockEntry) {
            await transaction.rollback();
            return res.status(400).json({ error: `Stock entry not found for assignment ${item.assignmentId}` });
          }

          // Calculate deduction quantities - use individual units for both assignment and stock
          let assignmentDeductionQuantity, stockEntryDeductionQuantity;

          if (material && material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
            // Package unit conversion logic - deduct individual units directly
            if (item.unit === material.baseUnit) {
              // Selling individual units (bottles) - deduct directly
              assignmentDeductionQuantity = item.quantity;
              stockEntryDeductionQuantity = item.quantity;
            } else {
              // Selling package units (boxes) - convert to individual units
              assignmentDeductionQuantity = item.quantity * material.packageQuantity;
              stockEntryDeductionQuantity = item.quantity * material.packageQuantity;
            }

            console.log(`Package unit sale conversion for ${material.name}:`, {
              soldQuantity: item.quantity,
              soldUnit: item.unit,
              packageQuantity: material.packageQuantity,
              assignmentDeductionQuantity,
              stockEntryDeductionQuantity,
              assignmentUnit: assignment.assignedUnit,
              stockEntryUnit: stockEntry.purchasedUnit
            });
          } else {
            // Non-package units - direct deduction
            assignmentDeductionQuantity = item.quantity;
            stockEntryDeductionQuantity = item.quantity;
          }

          // Check if sufficient quantity is available in assignment (use assignedIndividualQuantity if available)
          const assignmentIndividualQuantity = assignment.assignedIndividualQuantity || (assignment.assignedQuantity * (material.packageQuantity || 1));
          if (assignmentIndividualQuantity < assignmentDeductionQuantity) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Insufficient quantity in assignment for ${material?.name || "item"}. Available: ${assignmentIndividualQuantity} ${material.baseUnit}, Required: ${assignmentDeductionQuantity}`
            });
          }

          // Check if sufficient quantity is available in stock entry
          if (stockEntry.purchasedIndividualQuantity < stockEntryDeductionQuantity) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Insufficient quantity in stock entry for ${material?.name || "item"}. Available: ${stockEntry.purchasedIndividualQuantity}, Requested: ${stockEntryDeductionQuantity}`
            });
          }

          // Update assignment individual quantity - deduct individual units only
          const newAssignedIndividualQuantity = assignmentIndividualQuantity - assignmentDeductionQuantity;
          
          // Only update assignedIndividualQuantity, keep assignedQuantity unchanged
          assignment.assignedIndividualQuantity = Math.round(newAssignedIndividualQuantity);
          await assignment.save();

          // Update stock entry quantities - deduct from individual quantity only
          const newIndividualQuantity = stockEntry.purchasedIndividualQuantity - stockEntryDeductionQuantity;

          if (newIndividualQuantity < 0) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Insufficient individual quantity in stock. Available: ${stockEntry.purchasedIndividualQuantity}, Required: ${stockEntryDeductionQuantity}`
            });
          }

          console.log("Stock entry update values:", {
            stockEntryId: stockEntry.id,
            oldPackageQuantity: stockEntry.purchasedQuantity,
            newPackageQuantity: stockEntry.purchasedQuantity, // Keep package quantity unchanged
            oldIndividualQuantity: stockEntry.purchasedIndividualQuantity,
            newIndividualQuantity,
            isInteger: Number.isInteger(newIndividualQuantity)
          });

          // Only update individual quantity, keep package quantity unchanged
          stockEntry.purchasedIndividualQuantity = Math.round(newIndividualQuantity);
          await stockEntry.save();

          console.log(`Updated assignment ${assignment.id}: assignedQuantity unchanged (${assignment.assignedQuantity}), individual quantity ${assignmentIndividualQuantity} -> ${newAssignedIndividualQuantity}`);
          console.log(`Updated stock entry ${stockEntry.id}: individual quantity ${stockEntry.purchasedIndividualQuantity + stockEntryDeductionQuantity} -> ${newIndividualQuantity}`);
        }
      }

      // Process menu items and deduct ingredient quantities from stock entries
      if (menuItems && menuItems.length > 0) {
        for (const menuItemSale of menuItems) {
          // Fetch the menu item with its ingredients
          const menuItem = await MenuItem.findByPk(menuItemSale.menuItemId, {
            include: [
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
            return res.status(400).json({ error: `Menu item ${menuItemSale.menuItemId} not found` });
          }

          console.log(`\n=== PROCESSING MENU ITEM SALE ===`);
          console.log(`Menu Item: ${menuItem.name} x${menuItemSale.quantity}`);
          console.log(`Ingredients to process: ${menuItem.menuItemIngredients.length}`);

          // Process each ingredient in the menu item
          for (const ingredient of menuItem.menuItemIngredients) {
            const material = ingredient.material;
            const totalIngredientQuantity = ingredient.quantity * menuItemSale.quantity; // Total needed for all sold menu items

            console.log(`\n--- PROCESSING INGREDIENT ---`);
            console.log(`Ingredient: ${material.name}`);
            console.log(`Required per item: ${ingredient.quantity} ${ingredient.unit}`);
            console.log(`Total needed for ${menuItemSale.quantity} items: ${totalIngredientQuantity} ${ingredient.unit}`);
            console.log(`Material base unit: ${material.baseUnit}`);
            console.log(`Material unit type: ${material.unitType}`);

            // Find stock entries for this material (ordered by creation date - FIFO)
            const stockEntries = await StockEntry.findAll({
              where: {
                materialId: material.id,
                purchasedIndividualQuantity: {
                  [Op.gt]: 0 // Only entries with available quantity
                }
              },
              order: [['createdAt', 'ASC']], // FIFO - First In, First Out
              transaction
            });

            if (stockEntries.length === 0) {
              await transaction.rollback();
              return res.status(400).json({
                error: `No stock available for ingredient: ${material.name}`
              });
            }

            // Calculate total available quantity in base units
            const totalAvailableQuantity = stockEntries.reduce((sum, entry) => {
              return sum + (entry.purchasedIndividualQuantity || 0);
            }, 0);

            // Convert ingredient quantity to base units if needed
            let requiredQuantityInBaseUnits = totalIngredientQuantity;
            if (ingredient.unit !== material.baseUnit) {
              // Handle unit conversion (simplified - you may need more complex conversion logic)
              if (material.unitType === "mass") {
                if (ingredient.unit === "kg" && material.baseUnit === "g") {
                  requiredQuantityInBaseUnits = totalIngredientQuantity * 1000;
                } else if (ingredient.unit === "g" && material.baseUnit === "kg") {
                  requiredQuantityInBaseUnits = totalIngredientQuantity / 1000;
                }
              }
              // Add more conversion logic as needed
            }

            console.log(`Required quantity in base units (${material.baseUnit}): ${requiredQuantityInBaseUnits}`);
            console.log(`Total available quantity: ${totalAvailableQuantity}`);

            // Check if sufficient quantity is available
            if (totalAvailableQuantity < requiredQuantityInBaseUnits) {
              await transaction.rollback();
              return res.status(400).json({
                error: `Insufficient stock for ingredient: ${material.name}. Available: ${totalAvailableQuantity} ${material.baseUnit}, Required: ${requiredQuantityInBaseUnits} ${material.baseUnit}`
              });
            }

            // Deduct quantities from stock entries using FIFO
            let remainingToDeduct = requiredQuantityInBaseUnits;
            for (const stockEntry of stockEntries) {
              if (remainingToDeduct <= 0) break;

              const availableInThisEntry = stockEntry.purchasedIndividualQuantity;
              const deductFromThisEntry = Math.min(remainingToDeduct, availableInThisEntry);

              console.log(`Deducting ${deductFromThisEntry} from stock entry ${stockEntry.id} (available: ${availableInThisEntry})`);

              // Update stock entry
              stockEntry.purchasedIndividualQuantity = Math.round(availableInThisEntry - deductFromThisEntry);
              await stockEntry.save({ transaction });

              remainingToDeduct -= deductFromThisEntry;

              console.log(`Stock entry ${stockEntry.id} updated: ${availableInThisEntry} -> ${stockEntry.purchasedIndividualQuantity}`);
            }

            console.log(`Successfully deducted ${requiredQuantityInBaseUnits} ${material.baseUnit} of ${material.name}`);
          }

          console.log(`Completed processing menu item: ${menuItem.name}`);
        }
      }

      // Create the sale record
      const sale = await Sale.create(
        {
          id: id,
          saleDate: new Date(saleDate),
          totalAmount,
          sectionId: finalSectionId,
          items: items || [],
          menuItems: menuItems || [], // Store menuItems as JSON
          createdAt: createdAt || new Date(),
          updatedAt: updatedAt || new Date()
        },
        { transaction }
      );

      await transaction.commit();
      
      // Fetch updated stock entries AFTER transaction commit to ensure fresh data
      console.log('\n=== FETCHING FRESH STOCK ENTRIES ===');
      const updatedStockEntries = await StockEntry.findAll({
        include: [
          {
            model: Material,
            as: 'material'
          }
        ],
        order: [['id', 'ASC']] // Order by ID for consistent ordering
      });

      console.log(`Fetched ${updatedStockEntries.length} fresh stock entries`);
      
      // Log a few sample entries to verify data
      if (updatedStockEntries.length > 0) {
        console.log('Sample updated stock entry:', {
          id: updatedStockEntries[0].id,
          materialId: updatedStockEntries[0].materialId,
          purchasedIndividualQuantity: updatedStockEntries[0].purchasedIndividualQuantity,
          updatedAt: updatedStockEntries[0].updatedAt
        });
      }
      
      // Return sale data with updated stock entries
      return res.status(201).json({
        sale: sale,
        updatedStockEntries: updatedStockEntries,
        message: 'Sale completed successfully with inventory deductions'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Update sale
  updateSales: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { menuItemId, saleDate, totalAmount } = req.body;

      const sale = await Sale.findByPk(id, { transaction });
      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ error: "Sale not found" });
      }

      // Validate menuItemId if provided
      if (menuItemId !== undefined) {
        const menuItem = await MenuItem.findByPk(menuItemId, { transaction });
        if (!menuItem) {
          await transaction.rollback();
          return res.status(404).json({ error: "Menu item not found" });
        }
      }

      // Validate totalAmount if provided
      if (totalAmount !== undefined && totalAmount < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Total amount cannot be negative" });
      }

      // Validate saleDate if provided
      if (saleDate !== undefined && isNaN(Date.parse(saleDate))) {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid sale date" });
      }

      // Update sale
      await sale.update(
        {
          menuItemId: menuItemId !== undefined ? menuItemId : sale.menuItemId,
          saleDate: saleDate !== undefined ? new Date(saleDate) : sale.saleDate,
          totalAmount: totalAmount !== undefined ? totalAmount : sale.totalAmount
        },
        { transaction }
      );

      // Fetch the updated sale with associated menu item
      const updatedSale = await Sale.findByPk(id, {
        include: [
          {
            model: MenuItem,
            as: "menuItem",
            include: [
              {
                model: MenuItemIngredient,
                as: "menuItemIngredients",
                include: [{ model: Material, as: "material" }]
              }
            ]
          }
        ],
        transaction
      });

      // Format response to match Sale interface
      const formattedSale = {
        ...updatedSale.get(),
        menuItem: {
          ...updatedSale.menuItem.get(),
          ingredients: updatedSale.menuItem.menuItemIngredients.map(ingredient => ({
            materialId: ingredient.materialId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost
          }))
        }
      };

      await transaction.commit();
      res.status(200).json(formattedSale);
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Delete sale
  deleteSales: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const sale = await Sale.findByPk(id, { transaction });

      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ error: "Sale not found" });
      }

      // Delete sale
      await sale.destroy({ transaction });

      await transaction.commit();
      res.status(204).send();
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
};

export default salesController;
