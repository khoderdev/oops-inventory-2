import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Assignment, Material, MenuItem, MenuItemIngredient, Sale, Section, StockEntry } from "../models/index.js";

const salesController = {
  getNegativeStockReport: async (req, res, next) => {
    try {
      console.log("=== GENERATING NEGATIVE STOCK REPORT ===");

      const negativeStockEntries = await StockEntry.findAll({
        where: {
          [Op.or]: [{ purchasedIndividualQuantity: { [Op.lt]: 0 } }, { purchasedQuantity: { [Op.lt]: 0 } }]
        },
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "baseUnit", "unitType", "category"]
          }
        ],
        order: [["updatedAt", "DESC"]]
      });
      const report = {
        totalNegativeEntries: negativeStockEntries.length,
        negativeStockItems: negativeStockEntries.map(entry => ({
          stockEntryId: entry.id,
          materialId: entry.materialId,
          materialName: entry.material?.name || "Unknown",
          category: entry.material?.category || "unknown",
          supplier: entry.supplier,
          purchasedQuantity: entry.purchasedQuantity,
          purchasedUnit: entry.purchasedUnit,
          purchasedIndividualQuantity: entry.purchasedIndividualQuantity,
          purchasedIndividualUnit: entry.purchasedIndividualUnit,
          lastUpdated: entry.updatedAt,
          isVirtualEntry: entry.supplier === "VIRTUAL - Negative Stock"
        })),
        summary: {
          totalVirtualEntries: negativeStockEntries.filter(e => e.supplier === "VIRTUAL - Negative Stock").length,
          categorySummary: negativeStockEntries.reduce((acc, entry) => {
            const category = entry.material?.category || "unknown";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {})
        },
        generatedAt: new Date(),
        message: negativeStockEntries.length > 0 ? `Found ${negativeStockEntries.length} stock entries with negative quantities requiring reconciliation` : "No negative stock entries found - all inventory is positive"
      };

      console.log(`Negative stock report generated: ${negativeStockEntries.length} entries found`);
      res.status(200).json(report);
    } catch (error) {
      console.error("Error generating negative stock report:", error);
      next(error);
    }
  },

  getAllSales: async (req, res, next) => {
    try {
      const sales = await Sale.findAll({
        where: {
          isActive: true // Only return active sales (soft delete filter)
        },
        include: [
          {
            model: Section,
            as: "section",
            attributes: ["id", "name"]
          }
        ],
        order: [["saleDate", "DESC"]]
      });

      // Process sales to include menu item names
      const processedSales = await Promise.all(
        sales.map(async sale => {
          const saleData = sale.toJSON();

          // Process menu items to include names
          if (saleData.menuItems && Array.isArray(saleData.menuItems)) {
            const enrichedMenuItems = await Promise.all(
              saleData.menuItems.map(async menuItemSale => {
                try {
                  const menuItem = await MenuItem.findByPk(menuItemSale.menuItemId, {
                    include: [
                      {
                        model: MenuItemIngredient,
                        as: "menuItemIngredients",
                        include: [
                          {
                            model: Material,
                            as: "material",
                            attributes: ["id", "name", "baseUnit"]
                          }
                        ]
                      }
                    ]
                  });

                  if (menuItem) {
                    const ingredients =
                      menuItem.menuItemIngredients?.map(ingredient => ({
                        materialId: ingredient.materialId,
                        materialName: ingredient.material?.name || "Unknown Material",
                        quantity: ingredient.quantity,
                        unit: ingredient.unit
                      })) || [];

                    return {
                      ...menuItemSale,
                      menuItemName: menuItem.name,
                      menuItemDescription: menuItem.description,
                      ingredients: ingredients
                    };
                  } else {
                    return {
                      ...menuItemSale,
                      menuItemName: `Menu Item ${menuItemSale.menuItemId}`,
                      menuItemDescription: "Item not found",
                      ingredients: []
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching menu item ${menuItemSale.menuItemId}:`, error);
                  return {
                    ...menuItemSale,
                    menuItemName: `Menu Item ${menuItemSale.menuItemId}`,
                    menuItemDescription: "Error loading item",
                    ingredients: []
                  };
                }
              })
            );

            saleData.menuItems = enrichedMenuItems;
          }

          return saleData;
        })
      );

      res.status(200).json(processedSales);
    } catch (error) {
      console.error("Error fetching sales with menu item details:", error);
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
    let negativeStockWarnings = []; // Track ingredients with negative stock across all processing
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
        const defaultSection =
          (await Section.findOne({
            where: {
              name: ["Kitchen", "kitchen", "KITCHEN"]
            },
            transaction
          })) || (await Section.findOne({ transaction }));

        if (defaultSection) {
          finalSectionId = defaultSection.id;
        } else {
          await transaction.rollback();
          return res.status(400).json({ error: "No sections available for menu item sales" });
        }
      } else if (sectionId && sectionId !== "" && sectionId !== undefined) {
        finalSectionId = parseInt(sectionId);
      } else {
        // Fallback: find any available section
        const fallbackSection = await Section.findOne({ transaction });
        if (fallbackSection) {
          finalSectionId = fallbackSection.id;
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
          } else {
            // Non-package units - direct deduction
            assignmentDeductionQuantity = item.quantity;
            stockEntryDeductionQuantity = item.quantity;
          }

          // Log warnings but allow negative stock for individual items too
          const assignmentIndividualQuantity = assignment.assignedIndividualQuantity || assignment.assignedQuantity * (material.packageQuantity || 1);
          if (assignmentIndividualQuantity < assignmentDeductionQuantity) {
            const shortage = assignmentDeductionQuantity - assignmentIndividualQuantity;
            console.warn(`NEGATIVE STOCK WARNING (Assignment): ${material?.name || "item"} - Available: ${assignmentIndividualQuantity} ${material.baseUnit}, Required: ${assignmentDeductionQuantity}, Shortage: ${shortage}`);
            negativeStockWarnings.push({
              materialId: material.id,
              materialName: material.name,
              type: "assignment",
              availableQuantity: assignmentIndividualQuantity,
              requiredQuantity: assignmentDeductionQuantity,
              shortageQuantity: shortage,
              unit: material.baseUnit
            });
          }

          if (stockEntry.purchasedIndividualQuantity < stockEntryDeductionQuantity) {
            const shortage = stockEntryDeductionQuantity - stockEntry.purchasedIndividualQuantity;
            console.warn(`NEGATIVE STOCK WARNING (Stock Entry): ${material?.name || "item"} - Available: ${stockEntry.purchasedIndividualQuantity}, Required: ${stockEntryDeductionQuantity}, Shortage: ${shortage}`);
            negativeStockWarnings.push({
              materialId: material.id,
              materialName: material.name,
              type: "stockEntry",
              stockEntryId: stockEntry.id,
              availableQuantity: stockEntry.purchasedIndividualQuantity,
              requiredQuantity: stockEntryDeductionQuantity,
              shortageQuantity: shortage,
              unit: material.baseUnit
            });
          }

          // Update assignment individual quantity - deduct individual units only
          const newAssignedIndividualQuantity = assignmentIndividualQuantity - assignmentDeductionQuantity;

          // Only update assignedIndividualQuantity, keep assignedQuantity unchanged
          assignment.assignedIndividualQuantity = Math.round(newAssignedIndividualQuantity);
          await assignment.save();

          // Update stock entry quantities - deduct from individual quantity only (can go negative)
          const newIndividualQuantity = stockEntry.purchasedIndividualQuantity - stockEntryDeductionQuantity;

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

          // Log negative stock warning for individual item sales
          if (Math.round(newIndividualQuantity) < 0) {
            console.warn(`NEGATIVE STOCK: Stock entry ${stockEntry.id} for ${material.name} now has negative individual quantity: ${Math.round(newIndividualQuantity)}`);
          }

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

          console.log(`\n=== PROCESSING MENU ITEM SALE (NEGATIVE STOCK ENABLED) ===`);
          console.log(`Menu Item: ${menuItem.name} x${menuItemSale.quantity}`);
          console.log(`Ingredients to process: ${menuItem.menuItemIngredients.length}`);
          // Process each ingredient in the menu item
          for (const ingredient of menuItem.menuItemIngredients) {
            const material = ingredient.material;
            const totalIngredientQuantity = ingredient.quantity * menuItemSale.quantity; // Total needed for all sold menu items

            console.log(`\n--- PROCESSING INGREDIENT (NEGATIVE STOCK ALLOWED) ---`);
            console.log(`Ingredient: ${material.name}`);
            console.log(`Required per item: ${ingredient.quantity} ${ingredient.unit}`);
            console.log(`Total needed for ${menuItemSale.quantity} items: ${totalIngredientQuantity} ${ingredient.unit}`);
            console.log(`Material base unit: ${material.baseUnit}`);
            console.log(`Material unit type: ${material.unitType}`);

            // Find ALL stock entries for this material (including those with zero or negative quantity)
            // Remove the filter for positive quantity only - we now include all entries
            const stockEntries = await StockEntry.findAll({
              where: {
                materialId: material.id
                // Removed: purchasedIndividualQuantity: { [Op.gt]: 0 }
              },
              order: [["createdAt", "ASC"]], // FIFO - First In, First Out
              transaction
            });

            console.log(`Found ${stockEntries.length} stock entries for ${material.name} (including zero/negative)`);

            // Calculate total available quantity in base units (can now be negative)
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
            }

            console.log(`Required quantity in base units (${material.baseUnit}): ${requiredQuantityInBaseUnits}`);
            console.log(`Total available quantity: ${totalAvailableQuantity}`);

            // REMOVED: Stock availability check - we now allow negative stock
            // Log warning if going negative
            const willResultInNegativeStock = totalAvailableQuantity < requiredQuantityInBaseUnits;
            if (willResultInNegativeStock) {
              const shortage = requiredQuantityInBaseUnits - totalAvailableQuantity;
              const warningMessage = `NEGATIVE STOCK WARNING: ${material.name} - Available: ${totalAvailableQuantity} ${material.baseUnit}, Required: ${requiredQuantityInBaseUnits} ${material.baseUnit}, Shortage: ${shortage} ${material.baseUnit}`;
              console.warn(warningMessage);
              negativeStockWarnings.push({
                materialId: material.id,
                materialName: material.name,
                availableQuantity: totalAvailableQuantity,
                requiredQuantity: requiredQuantityInBaseUnits,
                shortageQuantity: shortage,
                unit: material.baseUnit
              });
            }

            // Handle case where no stock entries exist - create a virtual negative entry
            if (stockEntries.length === 0) {
              console.log(`No existing stock entries for ${material.name}, creating virtual negative stock entry`);

              // Create a new stock entry with negative quantity
              const virtualStockEntry = await StockEntry.create(
                {
                  materialId: material.id,
                  supplier: "VIRTUAL - Negative Stock",
                  purchasedQuantity: 0,
                  purchasedUnit: material.baseUnit,
                  purchasedIndividualQuantity: -requiredQuantityInBaseUnits, // Start with negative
                  purchasedIndividualUnit: material.baseUnit,
                  costPerPurchasedUnit: 0,
                  totalCost: 0,
                  purchaseDate: new Date(),
                  expiryDate: null
                },
                { transaction }
              );

              console.log(`Created virtual stock entry ${virtualStockEntry.id} with negative quantity: ${-requiredQuantityInBaseUnits}`);

              // Add to warnings
              negativeStockWarnings.push({
                materialId: material.id,
                materialName: material.name,
                availableQuantity: 0,
                requiredQuantity: requiredQuantityInBaseUnits,
                shortageQuantity: requiredQuantityInBaseUnits,
                unit: material.baseUnit,
                action: "Created virtual negative stock entry"
              });
            } else {
              // Deduct quantities from stock entries using FIFO (now allows negative values)
              let remainingToDeduct = requiredQuantityInBaseUnits;
              for (const stockEntry of stockEntries) {
                if (remainingToDeduct <= 0) break;

                const availableInThisEntry = stockEntry.purchasedIndividualQuantity;
                // MODIFIED: Remove Math.min to allow negative deduction
                const deductFromThisEntry = remainingToDeduct; // Deduct full remaining amount

                console.log(`Deducting ${deductFromThisEntry} from stock entry ${stockEntry.id} (current: ${availableInThisEntry}, will become: ${availableInThisEntry - deductFromThisEntry})`);

                // Update stock entry - can now go negative
                const newQuantity = Math.round(availableInThisEntry - deductFromThisEntry);
                stockEntry.purchasedIndividualQuantity = newQuantity;
                await stockEntry.save({ transaction });

                // Update remaining to deduct
                remainingToDeduct = Math.max(0, remainingToDeduct - Math.max(0, availableInThisEntry));

                console.log(`Stock entry ${stockEntry.id} updated: ${availableInThisEntry} -> ${newQuantity} (remaining to deduct: ${remainingToDeduct})`);

                // Log negative stock entry
                if (newQuantity < 0) {
                  console.warn(`NEGATIVE STOCK: Stock entry ${stockEntry.id} for ${material.name} now has negative quantity: ${newQuantity}`);
                }

                // If this entry handled all remaining deduction, break
                if (remainingToDeduct <= 0) break;
              }
            }

            console.log(`Successfully processed deduction of ${requiredQuantityInBaseUnits} ${material.baseUnit} of ${material.name}`);
          }
        }

        // Log all negative stock warnings at the end
        if (negativeStockWarnings.length > 0) {
          console.log(`\n=== NEGATIVE STOCK SUMMARY ===`);
          console.log(`${negativeStockWarnings.length} ingredients resulted in negative stock:`);
          negativeStockWarnings.forEach(warning => {
            console.log(`- ${warning.materialName}: ${warning.shortageQuantity} ${warning.unit} shortage${warning.action ? ` (${warning.action})` : ""}`);
          });
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
      console.log("\n=== FETCHING FRESH STOCK ENTRIES ===");
      const updatedStockEntries = await StockEntry.findAll({
        include: [
          {
            model: Material,
            as: "material"
          }
        ],
        order: [["id", "ASC"]] // Order by ID for consistent ordering
      });

      console.log(`Fetched ${updatedStockEntries.length} fresh stock entries`);

      // Log a few sample entries to verify data
      if (updatedStockEntries.length > 0) {
        console.log("Sample updated stock entry:", {
          id: updatedStockEntries[0].id,
          materialId: updatedStockEntries[0].materialId,
          purchasedIndividualQuantity: updatedStockEntries[0].purchasedIndividualQuantity,
          updatedAt: updatedStockEntries[0].updatedAt
        });
      }

      // Prepare response message and warnings
      let responseMessage = "Sale completed successfully with inventory deductions";
      const hasNegativeStock = negativeStockWarnings && negativeStockWarnings.length > 0;

      if (hasNegativeStock) {
        responseMessage += ` (WARNING: ${negativeStockWarnings.length} ingredients resulted in negative stock)`;
      }

      // Return sale data with updated stock entries and negative stock warnings
      return res.status(201).json({
        sale: sale,
        updatedStockEntries: updatedStockEntries,
        message: responseMessage,
        negativeStockWarnings: negativeStockWarnings || [],
        hasNegativeStock: hasNegativeStock
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

  // Delete sale (simple deletion without stock reversion)
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
  },

  // Revert sale with stock restoration
  revertSale: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    let stockRestorationReport = [];
    try {
      const { id } = req.params;
      // Fetch the sale with all necessary data
      const sale = await Sale.findByPk(id, { transaction });
      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ error: "Sale not found" });
      }
      console.log(`\n=== REVERTING SALE ${id} ===`);
      console.log(`Sale Date: ${sale.saleDate}`);
      console.log(`Total Amount: ${sale.totalAmount}`);
      console.log(`Items: ${JSON.stringify(sale.items)}`);
      console.log(`Menu Items: ${JSON.stringify(sale.menuItems)}`);
      // Revert individual items
      if (sale.items && sale.items.length > 0) {
        console.log(`\n--- REVERTING ${sale.items.length} INDIVIDUAL ITEMS ---`);
        for (const item of sale.items) {
          const assignment = await Assignment.findByPk(item.assignmentId, {
            include: [
              { model: Material, as: "material" },
              { model: StockEntry, as: "stockEntry" }
            ],
            transaction
          });
          if (!assignment) {
            console.warn(`Assignment ${item.assignmentId} not found during revert`);
            continue;
          }
          const material = assignment.material;
          const stockEntry = assignment.stockEntry;
          if (!stockEntry) {
            console.warn(`Stock entry not found for assignment ${item.assignmentId} during revert`);
            continue;
          }
          // Calculate restoration quantities (reverse of deduction logic)
          let assignmentRestorationQuantity, stockEntryRestorationQuantity;
          if (material && material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
            if (item.unit === material.baseUnit) {
              // Restore individual units directly
              assignmentRestorationQuantity = item.quantity;
              stockEntryRestorationQuantity = item.quantity;
            } else {
              // Restore package units converted to individual units
              assignmentRestorationQuantity = item.quantity * material.packageQuantity;
              stockEntryRestorationQuantity = item.quantity * material.packageQuantity;
            }
          } else {
            // Non-package units - direct restoration
            assignmentRestorationQuantity = item.quantity;
            stockEntryRestorationQuantity = item.quantity;
          }
          // Restore assignment quantities
          const oldAssignmentQuantity = assignment.assignedIndividualQuantity || 0;
          const newAssignmentQuantity = oldAssignmentQuantity + assignmentRestorationQuantity;
          assignment.assignedIndividualQuantity = Math.round(newAssignmentQuantity);
          await assignment.save({ transaction });
          // Restore stock entry quantities
          const oldStockQuantity = stockEntry.purchasedIndividualQuantity || 0;
          const newStockQuantity = oldStockQuantity + stockEntryRestorationQuantity;
          stockEntry.purchasedIndividualQuantity = Math.round(newStockQuantity);
          await stockEntry.save({ transaction });
          stockRestorationReport.push({
            type: "individual_item",
            materialId: material.id,
            materialName: material.name,
            assignmentId: assignment.id,
            stockEntryId: stockEntry.id,
            quantityRestored: assignmentRestorationQuantity,
            unit: material.baseUnit,
            oldAssignmentQuantity,
            newAssignmentQuantity: Math.round(newAssignmentQuantity),
            oldStockQuantity,
            newStockQuantity: Math.round(newStockQuantity)
          });
          console.log(`Restored individual item: ${material.name}`);
          console.log(`  Assignment: ${oldAssignmentQuantity} -> ${Math.round(newAssignmentQuantity)}`);
          console.log(`  Stock: ${oldStockQuantity} -> ${Math.round(newStockQuantity)}`);
        }
      }
      // Revert menu items
      if (sale.menuItems && sale.menuItems.length > 0) {
        console.log(`\n--- REVERTING ${sale.menuItems.length} MENU ITEMS ---`);
        for (const menuItemSale of sale.menuItems) {
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
            console.warn(`Menu item ${menuItemSale.menuItemId} not found during revert`);
            continue;
          }
          console.log(`\nReverting menu item: ${menuItem.name} x${menuItemSale.quantity}`);
          // Restore each ingredient
          for (const ingredient of menuItem.menuItemIngredients) {
            const material = ingredient.material;
            const totalIngredientQuantity = ingredient.quantity * menuItemSale.quantity;
            console.log(`\n--- RESTORING INGREDIENT ---`);
            console.log(`Ingredient: ${material.name}`);
            console.log(`Quantity to restore: ${totalIngredientQuantity} ${ingredient.unit}`);
            // Convert ingredient quantity to base units if needed
            let restorationQuantityInBaseUnits = totalIngredientQuantity;
            if (ingredient.unit !== material.baseUnit) {
              if (material.unitType === "mass") {
                if (ingredient.unit === "kg" && material.baseUnit === "g") {
                  restorationQuantityInBaseUnits = totalIngredientQuantity * 1000;
                } else if (ingredient.unit === "g" && material.baseUnit === "kg") {
                  restorationQuantityInBaseUnits = totalIngredientQuantity / 1000;
                }
              }
            }
            console.log(`Restoration quantity in base units (${material.baseUnit}): ${restorationQuantityInBaseUnits}`);
            // Find stock entries for this material (prioritize most recent entries for restoration)
            const stockEntries = await StockEntry.findAll({
              where: {
                materialId: material.id
              },
              order: [["createdAt", "DESC"]], // LIFO for restoration - restore to most recent entries first
              transaction
            });
            console.log(`Found ${stockEntries.length} stock entries for ${material.name}`);
            if (stockEntries.length === 0) {
              const newStockEntry = await StockEntry.create(
                {
                  materialId: material.id,
                  supplier: "RESTORED - From Sale Revert",
                  purchasedQuantity: 0,
                  purchasedUnit: material.baseUnit,
                  purchasedIndividualQuantity: restorationQuantityInBaseUnits,
                  purchasedIndividualUnit: material.baseUnit,
                  costPerPurchasedUnit: 0,
                  totalCost: 0,
                  purchaseDate: new Date(),
                  expiryDate: null
                },
                { transaction }
              );

              stockRestorationReport.push({
                type: "menu_item_ingredient",
                materialId: material.id,
                materialName: material.name,
                menuItemId: menuItem.id,
                menuItemName: menuItem.name,
                stockEntryId: newStockEntry.id,
                quantityRestored: restorationQuantityInBaseUnits,
                unit: material.baseUnit,
                action: "Created new stock entry",
                oldStockQuantity: 0,
                newStockQuantity: restorationQuantityInBaseUnits
              });

              console.log(`Created new stock entry ${newStockEntry.id} with restored quantity: ${restorationQuantityInBaseUnits}`);
            } else {
              // Restore quantities to existing stock entries (LIFO - most recent first)
              let remainingToRestore = restorationQuantityInBaseUnits;
              for (const stockEntry of stockEntries) {
                if (remainingToRestore <= 0) break;
                const oldQuantity = stockEntry.purchasedIndividualQuantity || 0;
                const restorationAmount = remainingToRestore; // Restore full remaining amount to this entry
                const newQuantity = Math.round(oldQuantity + restorationAmount);
                console.log(`Restoring ${restorationAmount} to stock entry ${stockEntry.id} (${oldQuantity} -> ${newQuantity})`);
                stockEntry.purchasedIndividualQuantity = newQuantity;
                await stockEntry.save({ transaction });
                stockRestorationReport.push({
                  type: "menu_item_ingredient",
                  materialId: material.id,
                  materialName: material.name,
                  menuItemId: menuItem.id,
                  menuItemName: menuItem.name,
                  stockEntryId: stockEntry.id,
                  quantityRestored: restorationAmount,
                  unit: material.baseUnit,
                  oldStockQuantity: oldQuantity,
                  newStockQuantity: newQuantity
                });
                remainingToRestore = 0; // All restored to this entry
                console.log(`Stock entry ${stockEntry.id} updated: ${oldQuantity} -> ${newQuantity}`);
              }
            }
          }
        }
      }
      // Delete the sale record
      await sale.destroy({ transaction });
      await transaction.commit();
      console.log(`\n=== SALE ${id} SUCCESSFULLY REVERTED ===`);
      console.log(`Stock restoration report: ${JSON.stringify(stockRestorationReport, null, 2)}`);
      res.status(200).json({
        message: "Sale successfully reverted",
        saleId: id,
        stockRestorationReport,
        totalItemsRestored: stockRestorationReport.length
      });
    } catch (error) {
      await transaction.rollback();
      console.error(`Error reverting sale ${id}:`, error);
      next(error);
    }
  },

  // Soft delete sale (mark as inactive without actually deleting)
  softDeleteSale: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      // Find the sale
      const sale = await Sale.findByPk(id, { transaction });
      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ error: "Sale not found" });
      }
      // Check if sale is already inactive
      if (!sale.isActive) {
        await transaction.rollback();
        return res.status(400).json({ error: "Sale is already inactive" });
      }
      console.log(`\n=== SOFT DELETING SALE ${id} ===`);
      console.log(`Sale Date: ${sale.saleDate}`);
      console.log(`Total Amount: ${sale.totalAmount}`);
      console.log(`Setting isActive to false - sale will be hidden from frontend`);
      // Mark sale as inactive (soft delete)
      await sale.update({ isActive: false }, { transaction });
      await transaction.commit();
      console.log(`\n=== SALE ${id} SUCCESSFULLY SOFT DELETED ===`);
      console.log(`Sale is now hidden from frontend but preserved in database`);
      res.status(200).json({
        message: "Sale successfully hidden",
        saleId: id,
        action: "soft_delete",
        note: "Sale record preserved in database but hidden from frontend"
      });
    } catch (error) {
      await transaction.rollback();
      console.error(`Error soft deleting sale ${id}:`, error);
      next(error);
    }
  }
};

export default salesController;
