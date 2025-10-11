import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { auditSalesOperation } from "../middleware/auditMiddleware.js";
import { Assignment, Material, MenuItem, MenuItemIngredient, Sale, SaleMenuItem, Section, StockEntry, User, Order } from "../models/index.js";

const salesController = {
  getNegativeStockReport: async (req, res, next) => {
    try {
      console.log("🔍 Starting negative stock report generation...");

      const negativeStockEntries = await StockEntry.findAll({
        where: {
          [Op.or]: [{ purchasedIndividualQuantity: { [Op.lt]: 0 } }, { purchasedQuantity: { [Op.lt]: 0 } }]
        },
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "baseUnit", "unitType", "categoryId"]
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
          categoryId: entry.material?.categoryId || null,
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
            const categoryId = entry.material?.categoryId || "uncategorized";
            acc[categoryId] = (acc[categoryId] || 0) + 1;
            return acc;
          }, {})
        },
        generatedAt: new Date(),
        message: negativeStockEntries.length > 0 ? `Found ${negativeStockEntries.length} stock entries with negative quantities requiring reconciliation` : "No negative stock entries found - all inventory is positive"
      };
      console.log("✅ Successfully generated negative stock report");
      res.status(200).json(report);
    } catch (error) {
      console.error("❌ Error generating negative stock report:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Send detailed error response for debugging
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to generate negative stock report",
        details: error.message
      });
    }
  },

  getAllSales: async (req, res, next) => {
    try {
      // Exclude sales that are linked to staff/employee orders
      const staffSaleIdSubquery = `(
        SELECT "saleId" FROM "Orders"
        WHERE "saleId" IS NOT NULL
          AND CAST("orderType" AS text) IN ('employees','staff')
      )`;

      const sales = await Sale.findAll({
        where: {
          isActive: true,
          id: { [Op.notIn]: sequelize.literal(staffSaleIdSubquery) }
        },
        include: [
          {
            model: Section,
            as: "section",
            attributes: ["id", "name"]
          },
          {
            model: User,
            as: "creator",
            attributes: ["username"]
          },
          {
            model: Order,
            as: "order",
            attributes: ["id", "orderNumber", "orderType", "discountType", "discountValue", "discountAmount", "discountReason", "notes"]
          }
        ],
        order: [["saleDate", "DESC"]]
      });

      // Process sales to include menu item names
      const processedSales = await Promise.all(
        sales.map(async sale => {
          const saleData = sale.toJSON();

          // Keep order data for editing capability
          if (saleData.order) {
            saleData.orderNumber = saleData.order.orderNumber;
            saleData.orderId = saleData.order.id; // Add orderId for easy access
            // Keep the full order object for frontend use
          }

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

  // Staff/Employee sales only
  getStaffSales: async (req, res, next) => {
    try {
      // Only sales that are linked to staff/employee orders
      const staffSaleIdSubquery = `(
        SELECT "saleId" FROM "Orders"
        WHERE "saleId" IS NOT NULL
          AND CAST("orderType" AS text) IN ('employees','staff')
      )`;

      const sales = await Sale.findAll({
        where: {
          isActive: true,
          id: { [Op.in]: sequelize.literal(staffSaleIdSubquery) }
        },
        include: [
          {
            model: Section,
            as: "section",
            attributes: ["id", "name"]
          },
          {
            model: User,
            as: "creator",
            attributes: ["username"]
          }
        ],
        order: [["saleDate", "DESC"]]
      });

      // Process sales to include menu item names (same as getAllSales)
      const processedSales = await Promise.all(
        sales.map(async sale => {
          const saleData = sale.toJSON();

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
                      ingredients
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
      console.error("Error fetching staff sales:", error);
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
      const { saleDate, totalAmount, items, menuItems, sectionId, id, createdAt, updatedAt, fromExistingOrder } = req.body;

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

      // Validate that we have either items or menu items
      const hasIndividualItems = items && items.length > 0;
      const hasMenuItems = menuItems && menuItems.length > 0;

      if (!hasIndividualItems && !hasMenuItems) {
        await transaction.rollback();
        return res.status(400).json({ error: "At least one item or menu item is required" });
      }

      // For menu item only sales, assign a default section ID if none provided
      let finalSectionId;
      if (hasMenuItems && !hasIndividualItems && (!sectionId || sectionId === "" || sectionId === undefined)) {
        // Find a suitable section for menu items (prefer Kitchen, or any available section)
        let defaultSection =
          (await Section.findOne({
            where: {
              name: ["Kitchen", "kitchen", "KITCHEN"]
            },
            transaction
          })) || (await Section.findOne({ transaction }));

        if (!defaultSection) {
          // Create a default section if none exists
          console.log("🏗️ No sections found, creating default section for menu item sales");
          defaultSection = await Section.create(
            {
              name: "Kitchen"
            },
            { transaction }
          );
          console.log("✅ Created default Kitchen section with ID:", defaultSection.id);
        }
        finalSectionId = defaultSection.id;
      } else if (sectionId && sectionId !== "" && sectionId !== undefined) {
        finalSectionId = parseInt(sectionId);
      } else {
        // Fallback: find any available section
        let fallbackSection = await Section.findOne({ transaction });
        if (!fallbackSection) {
          // Create a default section if none exists
          console.log("🏗️ No sections found, creating default fallback section");
          fallbackSection = await Section.create(
            {
              name: "Default Section"
            },
            { transaction }
          );
          console.log("✅ Created default section with ID:", fallbackSection.id);
        }
        finalSectionId = fallbackSection.id;
      }

      // Process individual items and update section assignments AND stock entries
      if (items && items.length > 0) {
        for (const item of items) {
          let assignment = null;
          let material = null;
          let stockEntry = null;
          let isPOSItem = false;

          // Check if this is a POS item (no assignment required)
          if (!item.assignmentId || item.assignmentId === null) {
            // For items without assignment, check if there are POS-enabled stock entries
            material = await Material.findByPk(item.materialId, { transaction });

            if (!material) {
              await transaction.rollback();
              return res.status(400).json({ error: `Material ${item.materialId} not found` });
            }

            // Find POS-enabled stock entries for this material
            const posStockEntries = await StockEntry.findAll({
              where: {
                materialId: item.materialId,
                isPOSItem: true
              },
              order: [["createdAt", "ASC"]], // FIFO
              transaction
            });

            if (posStockEntries.length === 0) {
              await transaction.rollback();
              return res.status(400).json({ error: `No POS-enabled stock entries found for material: ${material.name}. Either assign to a section or enable POS visibility for stock entries.` });
            }

            isPOSItem = true;
            console.log(`Processing POS item: ${material.name} (${posStockEntries.length} POS-enabled stock entries found)`);
          } else {
            // Regular item with assignment
            assignment = await Assignment.findByPk(item.assignmentId, {
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

            material = assignment.material;
            stockEntry = assignment.stockEntry;

            if (!stockEntry) {
              await transaction.rollback();
              return res.status(400).json({ error: `Stock entry not found for assignment ${item.assignmentId}` });
            }
          }

          // Handle POS items differently - deduct from stock entries but skip assignment logic
          if (isPOSItem) {
            console.log(`Processing POS item: ${material.name} - deducting from stock entries`);

            // Calculate deduction quantity for POS item
            let stockDeductionQuantity;
            if (material && material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
              // Package unit conversion logic - deduct individual units directly
              stockDeductionQuantity = item.quantity; // POS items are sold in base units (bottles, pieces, etc.)
            } else {
              // Non-package units - direct deduction
              stockDeductionQuantity = item.quantity;
            }

            // Find POS-enabled stock entries for this material using FIFO
            const stockEntries = await StockEntry.findAll({
              where: {
                materialId: material.id,
                isPOSItem: true
              },
              order: [["createdAt", "ASC"]], // FIFO - First In, First Out
              transaction
            });

            if (stockEntries.length === 0) {
              console.warn(`No stock entries found for POS item: ${material.name}`);
              // Allow sale even without stock entries for POS items
              continue;
            }

            // Deduct from stock entries using FIFO logic with calculated totals
            let remainingToDeduct = stockDeductionQuantity;
            for (const stockEntry of stockEntries) {
              if (remainingToDeduct <= 0) break;

              // Determine which calculated field to use based on material type and available data
              let availableQuantity = 0;
              let fieldToUpdate = null;
              let unitType = "unknown";

              if (stockEntry.totalVolume > 0 && (material.unitType === "volume" || material.unitType === "package")) {
                availableQuantity = stockEntry.totalVolume;
                fieldToUpdate = "totalVolume";
                unitType = "volume";
              } else if (stockEntry.totalMass > 0 && material.unitType === "mass") {
                availableQuantity = stockEntry.totalMass;
                fieldToUpdate = "totalMass";
                unitType = "mass";
              } else if (stockEntry.totalPieces > 0 && (material.unitType === "piece" || material.unitType === "package")) {
                availableQuantity = stockEntry.totalPieces;
                fieldToUpdate = "totalPieces";
                unitType = "pieces";
              } else {
                // Fallback to raw purchase data
                availableQuantity = stockEntry.purchasedIndividualQuantity || 0;
                fieldToUpdate = "purchasedIndividualQuantity";
                unitType = "fallback";
              }

              const deductFromThisEntry = Math.min(remainingToDeduct, availableQuantity);

              if (deductFromThisEntry > 0) {
                // Update the appropriate field
                const newQuantity = availableQuantity - deductFromThisEntry;
                const updateData = { [fieldToUpdate]: Math.round(newQuantity) };

                // Also update cost per unit if we're updating calculated fields
                if (unitType === "volume" && newQuantity > 0 && stockEntry.totalCost > 0) {
                  updateData.costPerVolumeUnit = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
                } else if (unitType === "mass" && newQuantity > 0 && stockEntry.totalCost > 0) {
                  updateData.costPerMassUnit = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
                } else if (unitType === "pieces" && newQuantity > 0 && stockEntry.totalCost > 0) {
                  updateData.costPerPiece = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
                }

                await stockEntry.update(updateData, { transaction });

                console.log(`Deducted ${deductFromThisEntry} from ${fieldToUpdate} (${unitType}) in stock entry ${stockEntry.id} for POS item ${material.name}`);

                // Log negative stock warning if needed
                if (Math.round(newQuantity) < 0) {
                  console.warn(`NEGATIVE STOCK: Stock entry ${stockEntry.id} for POS item ${material.name} now has negative ${fieldToUpdate}: ${Math.round(newQuantity)}`);
                  negativeStockWarnings.push({
                    materialId: material.id,
                    materialName: material.name,
                    type: "stockEntry",
                    stockEntryId: stockEntry.id,
                    availableQuantity: availableQuantity,
                    requiredQuantity: deductFromThisEntry,
                    shortageQuantity: Math.max(0, deductFromThisEntry - availableQuantity),
                    unit: material.baseUnit,
                    fieldUpdated: fieldToUpdate
                  });
                }

                remainingToDeduct -= deductFromThisEntry;
              }
            }

            // If we couldn't deduct everything, log a warning
            if (remainingToDeduct > 0) {
              console.warn(`Could not deduct full quantity for POS item ${material.name}. Remaining: ${remainingToDeduct} ${material.baseUnit}`);
              negativeStockWarnings.push({
                materialId: material.id,
                materialName: material.name,
                type: "insufficient_stock",
                availableQuantity: stockDeductionQuantity - remainingToDeduct,
                requiredQuantity: stockDeductionQuantity,
                shortageQuantity: remainingToDeduct,
                unit: material.baseUnit
              });
            }

            continue; // Skip assignment logic for POS items
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
          // Update stock entry quantities using calculated totals
          // Determine which calculated field to use based on material type and available data
          let availableQuantity = 0;
          let fieldToUpdate = null;
          let unitType = "unknown";

          if (stockEntry.totalVolume > 0 && (material.unitType === "volume" || material.unitType === "package")) {
            availableQuantity = stockEntry.totalVolume;
            fieldToUpdate = "totalVolume";
            unitType = "volume";
          } else if (stockEntry.totalMass > 0 && material.unitType === "mass") {
            availableQuantity = stockEntry.totalMass;
            fieldToUpdate = "totalMass";
            unitType = "mass";
          } else if (stockEntry.totalPieces > 0 && (material.unitType === "piece" || material.unitType === "package")) {
            availableQuantity = stockEntry.totalPieces;
            fieldToUpdate = "totalPieces";
            unitType = "pieces";
          } else {
            // Fallback to raw purchase data
            availableQuantity = stockEntry.purchasedIndividualQuantity || 0;
            fieldToUpdate = "purchasedIndividualQuantity";
            unitType = "fallback";
          }

          const newQuantity = availableQuantity - stockEntryDeductionQuantity;
          const updateData = { [fieldToUpdate]: Math.round(newQuantity) };

          // Also update cost per unit if we're updating calculated fields
          if (unitType === "volume" && newQuantity > 0 && stockEntry.totalCost > 0) {
            updateData.costPerVolumeUnit = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
          } else if (unitType === "mass" && newQuantity > 0 && stockEntry.totalCost > 0) {
            updateData.costPerMassUnit = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
          } else if (unitType === "pieces" && newQuantity > 0 && stockEntry.totalCost > 0) {
            updateData.costPerPiece = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
          }

          await stockEntry.update(updateData, { transaction });

          // Log negative stock warning for individual item sales
          if (Math.round(newQuantity) < 0) {
            console.warn(`NEGATIVE STOCK: Stock entry ${stockEntry.id} for ${material.name} now has negative ${fieldToUpdate}: ${Math.round(newQuantity)}`);
          }
        }
      }

      // Process menu items and deduct ingredient quantities from stock entries
      // Skip ingredient deduction if this sale comes from an existing order (stock already deducted)
      if (menuItems && menuItems.length > 0 && !fromExistingOrder) {
        console.log("🍽️ Processing menu items for ingredient stock deduction...");
      } else if (menuItems && menuItems.length > 0 && fromExistingOrder) {
        console.log("⏭️ Skipping ingredient stock deduction - sale created from existing order (stock already deducted)");
      }

      if (menuItems && menuItems.length > 0 && !fromExistingOrder) {
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

          // Process each ingredient in the menu item
          for (const ingredient of menuItem.menuItemIngredients) {
            const material = ingredient.material;
            const totalIngredientQuantity = ingredient.quantity * menuItemSale.quantity; // Total needed for all sold menu items
            // Find ALL stock entries for this material (including those with zero or negative quantity)
            // Remove the filter for positive quantity only - we now include all entries
            const stockEntries = await StockEntry.findAll({
              where: {
                materialId: material.id
              },
              order: [["createdAt", "ASC"]], // FIFO - First In, First Out
              transaction
            });

            // Calculate total available quantity using calculated totals (can now be negative)
            const totalAvailableQuantity = stockEntries.reduce((sum, entry) => {
              let availableInEntry = 0;

              if (entry.totalVolume > 0 && (material.unitType === "volume" || material.unitType === "package")) {
                availableInEntry = entry.totalVolume;
              } else if (entry.totalMass > 0 && material.unitType === "mass") {
                availableInEntry = entry.totalMass;
              } else if (entry.totalPieces > 0 && (material.unitType === "piece" || material.unitType === "package")) {
                availableInEntry = entry.totalPieces;
              } else {
                // Fallback to raw purchase data
                availableInEntry = entry.purchasedIndividualQuantity || 0;
              }

              return sum + availableInEntry;
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
              // Deduct quantities from stock entries using FIFO with calculated totals (now allows negative values)
              let remainingToDeduct = requiredQuantityInBaseUnits;
              for (const stockEntry of stockEntries) {
                if (remainingToDeduct <= 0) break;

                // Determine which calculated field to use based on material type and available data
                let availableInThisEntry = 0;
                let fieldToUpdate = null;
                let unitType = "unknown";

                if (stockEntry.totalVolume > 0 && (material.unitType === "volume" || material.unitType === "package")) {
                  availableInThisEntry = stockEntry.totalVolume;
                  fieldToUpdate = "totalVolume";
                  unitType = "volume";
                } else if (stockEntry.totalMass > 0 && material.unitType === "mass") {
                  availableInThisEntry = stockEntry.totalMass;
                  fieldToUpdate = "totalMass";
                  unitType = "mass";
                } else if (stockEntry.totalPieces > 0 && (material.unitType === "piece" || material.unitType === "package")) {
                  availableInThisEntry = stockEntry.totalPieces;
                  fieldToUpdate = "totalPieces";
                  unitType = "pieces";
                } else {
                  // Fallback to raw purchase data
                  availableInThisEntry = stockEntry.purchasedIndividualQuantity || 0;
                  fieldToUpdate = "purchasedIndividualQuantity";
                  unitType = "fallback";
                }

                // MODIFIED: Remove Math.min to allow negative deduction
                const deductFromThisEntry = remainingToDeduct; // Deduct full remaining amount

                // Update stock entry - can now go negative
                const newQuantity = Math.round(availableInThisEntry - deductFromThisEntry);
                const updateData = { [fieldToUpdate]: newQuantity };

                // Also update cost per unit if we're updating calculated fields
                if (unitType === "volume" && newQuantity > 0 && stockEntry.totalCost > 0) {
                  updateData.costPerVolumeUnit = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
                } else if (unitType === "mass" && newQuantity > 0 && stockEntry.totalCost > 0) {
                  updateData.costPerMassUnit = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
                } else if (unitType === "pieces" && newQuantity > 0 && stockEntry.totalCost > 0) {
                  updateData.costPerPiece = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
                }

                await stockEntry.update(updateData, { transaction });

                // Update remaining to deduct
                remainingToDeduct = Math.max(0, remainingToDeduct - Math.max(0, availableInThisEntry));

                // Log negative stock entry
                if (newQuantity < 0) {
                  console.warn(`NEGATIVE STOCK: Stock entry ${stockEntry.id} for ${material.name} now has negative ${fieldToUpdate}: ${newQuantity}`);
                }

                // If this entry handled all remaining deduction, break
                if (remainingToDeduct <= 0) break;
              }
            }
          }
        }
      }

      // Get the user ID from the request
      const userId = req.user?.id;

      // Create the sale record
      const sale = await Sale.create(
        {
          id: id,
          saleDate: new Date(saleDate),
          totalAmount,
          sectionId: finalSectionId,
          userId: userId, // Add the userId to associate the sale with the creator
          items: items || [],
          menuItems: menuItems || [], // Store menuItems as JSON
          createdAt: createdAt || new Date(),
          updatedAt: updatedAt || new Date()
        },
        { transaction }
      );

      await transaction.commit();

      // Log successful sale creation
      if (userId) {
        await auditSalesOperation(userId, "CREATE", sale.toJSON(), null, req);
      }

      // Fetch updated stock entries AFTER transaction commit to ensure fresh data
      const updatedStockEntries = await StockEntry.findAll({
        include: [
          {
            model: Material,
            as: "material"
          }
        ],
        order: [["id", "ASC"]] // Order by ID for consistent ordering
      });
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
      const { menuItemId, saleDate, totalAmount, menuItems } = req.body;

      console.log('📝 Updating sale with ID:', id);
      console.log('📦 Request body:', req.body);

      const sale = await Sale.findByPk(id, { transaction });
      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ error: "Sale not found" });
      }

      // Store original values for audit
      const originalSale = sale.toJSON();

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

      // Update sale basic properties
      await sale.update(
        {
          menuItemId: menuItemId !== undefined ? menuItemId : sale.menuItemId,
          saleDate: saleDate !== undefined ? new Date(saleDate) : sale.saleDate,
          totalAmount: totalAmount !== undefined ? totalAmount : sale.totalAmount,
          // Store menuItems as JSON if provided
          menuItems: menuItems !== undefined ? menuItems : sale.menuItems
        },
        { transaction }
      );
      
      // Handle menu items if provided
      if (menuItems && Array.isArray(menuItems)) {
        console.log(`🍽️ Processing ${menuItems.length} menu items for sale ${id}`);
        
        // First, delete existing SaleMenuItem records for this sale
        await SaleMenuItem.destroy({
          where: { saleId: id },
          transaction
        });
        
        // Then create new SaleMenuItem records
        for (const item of menuItems) {
          // Validate the menu item exists
          const menuItem = await MenuItem.findByPk(item.menuItemId, { transaction });
          if (!menuItem) {
            console.warn(`⚠️ Menu item ${item.menuItemId} not found, skipping`);
            continue;
          }
          
          await SaleMenuItem.create({
            saleId: id,
            menuItemId: item.menuItemId,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0
          }, { transaction });
          
          console.log(`✅ Added menu item ${item.menuItemId} to sale ${id}`);
        }
      }

      // Fetch the updated sale with associated data
      const updatedSale = await Sale.findByPk(id, {
        include: [
          {
            model: SaleMenuItem,
            as: "menuItem",
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
            ]
          }
        ],
        transaction
      });

      // Format response to match Sale interface
      // Convert SaleMenuItem records to the expected format
      const saleMenuItems = updatedSale.menuItem ? updatedSale.menuItem.map(saleMenuItem => {
        // Get the menu item data if available
        const menuItemData = saleMenuItem.menuItem ? {
          ...saleMenuItem.menuItem.get(),
          ingredients: saleMenuItem.menuItem.menuItemIngredients ? 
            saleMenuItem.menuItem.menuItemIngredients.map(ingredient => ({
              materialId: ingredient.materialId,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              cost: ingredient.cost
            })) : []
        } : null;
        
        // Format each SaleMenuItem
        return {
          menuItemId: saleMenuItem.menuItemId,
          menuItemName: menuItemData?.name || 'Unknown Item',
          quantity: saleMenuItem.quantity,
          unitPrice: saleMenuItem.unitPrice,
          totalPrice: saleMenuItem.totalPrice,
          menuItem: menuItemData
        };
      }) : [];
      
      // Combine the existing JSON menuItems with the SaleMenuItem records
      const combinedMenuItems = [...(updatedSale.menuItems || []), ...saleMenuItems];
      
      // Remove duplicates based on menuItemId
      const uniqueMenuItems = [];
      const menuItemIds = new Set();
      
      for (const item of combinedMenuItems) {
        if (!menuItemIds.has(item.menuItemId)) {
          uniqueMenuItems.push(item);
          menuItemIds.add(item.menuItemId);
        }
      }
      
      const formattedSale = {
        ...updatedSale.get(),
        menuItems: uniqueMenuItems
      };
      
      console.log('🔄 Formatted sale response:', {
        id: formattedSale.id,
        totalAmount: formattedSale.totalAmount,
        menuItemsCount: formattedSale.menuItems.length
      });

      await transaction.commit();

      // Log successful sale update
      const userId = req.user?.id;
      if (userId) {
        await auditSalesOperation(userId, "UPDATE", formattedSale, originalSale, req);
      }

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

      // Store sale data for audit before deletion
      const deletedSale = sale.toJSON();

      // Delete sale
      await sale.destroy({ transaction });
      await transaction.commit();

      // Log successful sale deletion
      const userId = req.user?.id;
      if (userId) {
        await auditSalesOperation(userId, "DELETE", deletedSale, null, req);
      }

      res.status(204).send();
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // In salesController.js
  bulkDeleteSaleItems: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { saleId } = req.params;
      const { itemIds, type: itemType } = req.body;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "No item IDs provided" });
      }

      const sale = await Sale.findByPk(saleId, { transaction });
      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ error: "Sale not found" });
      }

      // Store sale data for audit before modification
      const originalSale = sale.toJSON();

      // Delete items based on type
      if (itemType === "material") {
        await SaleMaterial.destroy({
          where: {
            id: itemIds,
            saleId
          },
          transaction
        });
      } else if (itemType === "menu") {
        await SaleMenuItem.destroy({
          where: {
            id: itemIds,
            saleId
          },
          transaction
        });
      } else {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid item type" });
      }

      // Check if sale has any items left
      const remainingItems = await Promise.all([SaleMaterial.count({ where: { saleId }, transaction }), SaleMenuItem.count({ where: { saleId }, transaction })]);

      const totalRemaining = remainingItems.reduce((sum, count) => sum + count, 0);

      if (totalRemaining === 0) {
        // If no items left, delete the entire sale
        await sale.destroy({ transaction });
        await transaction.commit();

        // Log successful sale deletion
        if (req.user?.id) {
          await auditSalesOperation(req.user.id, "DELETE", originalSale, null, req);
        }

        return res.status(200).json({
          message: "All items deleted and sale removed as it contained no more items",
          saleDeleted: true
        });
      }

      await transaction.commit();

      // Log successful bulk item deletion
      if (req.user?.id) {
        await auditSalesOperation(
          req.user.id,
          "BULK_DELETE_ITEMS",
          {
            saleId,
            itemIds,
            itemType,
            remainingItems: totalRemaining
          },
          originalSale,
          req
        );
      }

      res.status(200).json({
        message: `Successfully deleted ${itemIds.length} items from sale`,
        saleDeleted: false,
        remainingItems: totalRemaining
      });
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
      // Revert individual items
      if (sale.items && sale.items.length > 0) {
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
        }
      }
      // Revert menu items
      if (sale.menuItems && sale.menuItems.length > 0) {
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
          // Restore each ingredient
          for (const ingredient of menuItem.menuItemIngredients) {
            const material = ingredient.material;
            const totalIngredientQuantity = ingredient.quantity * menuItemSale.quantity;
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
            // Find stock entries for this material (prioritize most recent entries for restoration)
            const stockEntries = await StockEntry.findAll({
              where: {
                materialId: material.id
              },
              order: [["createdAt", "DESC"]], // LIFO for restoration - restore to most recent entries first
              transaction
            });
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
            } else {
              // Restore quantities to existing stock entries (LIFO - most recent first)
              let remainingToRestore = restorationQuantityInBaseUnits;
              for (const stockEntry of stockEntries) {
                if (remainingToRestore <= 0) break;
                const oldQuantity = stockEntry.purchasedIndividualQuantity || 0;
                const restorationAmount = remainingToRestore; // Restore full remaining amount to this entry
                const newQuantity = Math.round(oldQuantity + restorationAmount);
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
              }
            }
          }
        }
      }
      // Store sale data for audit before deletion
      const revertedSale = sale.toJSON();

      // Delete the sale record
      await sale.destroy({ transaction });
      await transaction.commit();

      // Log successful sale revert
      const userId = req.user?.id;
      if (userId) {
        await auditSalesOperation(userId, "REVERT", revertedSale, null, req);
      }

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
      // Store original sale data for audit
      const originalSale = sale.toJSON();

      // Mark sale as inactive (soft delete)
      await sale.update({ isActive: false }, { transaction });
      await transaction.commit();

      // Log successful soft delete
      const userId = req.user?.id;
      if (userId) {
        await auditSalesOperation(userId, "SOFT_DELETE", { ...originalSale, isActive: false }, originalSale, req);
      }

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
  },

  // Delete specific item from sale
  deleteSaleItem: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { saleId, itemId } = req.params;
      // Get the type from query parameters (using both 'type' and 'itemType' for backward compatibility)
      const itemType = req.query.type || req.query.itemType;

      console.log(`[deleteSaleItem] Starting deletion of item ${itemId} from sale ${saleId}, type: ${itemType}`);
      console.log(`[deleteSaleItem] Processing saleId: ${saleId}, itemId: ${itemId}, itemType: ${itemType}`);

      // Find the sale
      console.log(`[deleteSaleItem] Looking up sale ${saleId}`);
      const sale = await Sale.findByPk(saleId, { transaction });

      if (!sale) {
        console.error(`[deleteSaleItem] Sale ${saleId} not found`);
        await transaction.rollback();
        return res.status(404).json({ success: false, message: "Sale not found" });
      }

      console.log(`[deleteSaleItem] Found sale:`, {
        id: sale.id,
        totalAmount: sale.totalAmount,
        itemCount: sale.menuItems?.length || 0
      });

      // Check if the sale is already reverted or deleted
      if (sale.isReverted) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "Cannot modify a reverted sale" });
      }

      if (sale.isDeleted) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "Cannot modify a deleted sale" });
      }

      // Create a copy of the sale data for potential rollback
      const originalSale = { ...sale.get({ plain: true }) };
      const itemIdNum = parseInt(itemId, 10);
      console.log(`[deleteSaleItem] Original sale data:`, JSON.stringify(originalSale, null, 2));

      try {
        if (!itemType) {
          throw new Error('itemType parameter is required. Must be either "material" or "menu"');
        }

        if (itemType === "material") {
          console.log(`[deleteSaleItem] Filtering material item ${itemIdNum} from sale.items`);
          const updatedItems = (sale.items || []).filter(item => {
            console.log(`[deleteSaleItem] Checking item:`, { id: item.id, menuItemId: item.menuItemId });
            return item.id !== itemIdNum;
          });
          console.log(`[deleteSaleItem] Items after filter:`, updatedItems.length);
          sale.items = updatedItems;
        } else if (itemType === "menu") {
          console.log(`[deleteSaleItem] Filtering menu item ${itemIdNum} from sale.menuItems`);
          const updatedMenuItems = (sale.menuItems || []).filter(item => {
            console.log(`[deleteSaleItem] Checking menu item:`, { id: item.id, menuItemId: item.menuItemId });
            return item.menuItemId !== itemIdNum;
          });
          console.log(`[deleteSaleItem] Menu items after filter:`, updatedMenuItems.length);
          sale.menuItems = updatedMenuItems;
        } else {
          throw new Error('Invalid item type. Must be either "material" or "menu"');
        }

        // Recalculate the total
        const itemsTotal = (sale.items || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        const menuItemsTotal = (sale.menuItems || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        const newTotal = itemsTotal + menuItemsTotal;
        console.log(`[deleteSaleItem] Recalculating total - items: $${itemsTotal}, menuItems: $${menuItemsTotal}, newTotal: $${newTotal}`);
        sale.totalAmount = newTotal;

        // Save the updated sale with explicit field updates
        console.log(`[deleteSaleItem] Updating sale with new data:`, {
          menuItemsCount: sale.menuItems?.length || 0,
          itemsCount: sale.items?.length || 0,
          totalAmount: sale.totalAmount
        });

        const updateData = {
          menuItems: sale.menuItems,
          items: sale.items,
          totalAmount: sale.totalAmount,
          updatedAt: new Date()
        };

        console.log(`[deleteSaleItem] Update payload:`, JSON.stringify(updateData, null, 2));

        const result = await sale.update(updateData, {
          transaction,
          fields: ["menuItems", "items", "totalAmount", "updatedAt"]
        });

        console.log(`[deleteSaleItem] Update result:`, result ? "Success" : "Failed");

        // Get the updated sale data before committing
        console.log(`[deleteSaleItem] Fetching updated sale data before commit`);
        const updatedSale = await Sale.findByPk(saleId, { transaction });
        console.log(`[deleteSaleItem] Updated sale data before commit:`, {
          id: updatedSale?.id,
          totalAmount: updatedSale?.totalAmount,
          itemsCount: updatedSale?.items?.length || 0,
          menuItemsCount: updatedSale?.menuItems?.length || 0
        });

        // Check if sale is now empty
        const isSaleEmpty = (!updatedSale.items || updatedSale.items.length === 0) && (!updatedSale.menuItems || updatedSale.menuItems.length === 0);

        if (isSaleEmpty) {
          console.log(`[deleteSaleItem] Sale is now empty, deleting entire sale`);
          await sale.update({ isDeleted: true, deletedAt: new Date() }, { transaction });

          // Commit the transaction
          await transaction.commit();

          // Log the audit trail for sale deletion
          await auditSalesOperation(req.user.id, "delete_sale", {
            saleId: sale.id,
            reason: "Sale became empty after item removal",
            originalSale: originalSale,
            deletedAt: new Date()
          });

          return res.json({
            success: true,
            message: "Last item removed - sale has been deleted",
            saleDeleted: true,
            sale: null
          });
        }

        // If we get here, just commit the item removal
        await transaction.commit();
        console.log(`[deleteSaleItem] Transaction committed successfully`);

        // Log the audit trail for item removal
        console.log(`[deleteSaleItem] Logging audit trail`);
        const updatedSaleData = await Sale.findByPk(saleId);
        console.log(`[deleteSaleItem] Final sale data from DB:`, {
          id: updatedSaleData?.id,
          totalAmount: updatedSaleData?.totalAmount,
          itemsCount: updatedSaleData?.items?.length || 0,
          menuItemsCount: updatedSaleData?.menuItems?.length || 0
        });

        await auditSalesOperation(req.user.id, "delete_sale_item", {
          saleId: sale.id,
          itemId,
          itemType,
          originalSale,
          updatedSale: updatedSaleData ? updatedSaleData.get({ plain: true }) : sale.get({ plain: true })
        });

        res.json({
          success: true,
          message: "Item removed from sale successfully",
          sale: sale.get({ plain: true })
        });
      } catch (error) {
        // Rollback the transaction on error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
};

export default salesController;
