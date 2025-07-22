import { InnerSection, Material, MenuItem, MenuItemIngredient, Sale, SaleMenuItem, Section, Table } from "../models/index.js";

// Table Management Controller
const tablesController = {
  // Create a new section
  createSection: async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Section name is required and cannot be empty" });
      }
      const section = await Section.create({ name });
      res.status(201).json(section);
    } catch (error) {
      console.error("Error creating section:", error);
      next(error);
    }
  },

  // Create a new inner section
  createInnerSection: async (req, res, next) => {
    try {
      const { sectionId, name, type } = req.body;
      if (!sectionId || !name || !type) {
        return res.status(400).json({ error: "Section ID, name, and type are required" });
      }
      if (name.trim() === "") {
        return res.status(400).json({ error: "Inner section name cannot be empty" });
      }
      if (!["indoor", "outdoor"].includes(type)) {
        return res.status(400).json({ error: "Type must be 'indoor' or 'outdoor'" });
      }
      const section = await Section.findByPk(sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      const innerSection = await InnerSection.create({ sectionId, name, type });
      res.status(201).json(innerSection);
    } catch (error) {
      console.error("Error creating inner section:", error);
      next(error);
    }
  },

  updateInnerSection: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { sectionId, name, type } = req.body;

      const innerSection = await InnerSection.findByPk(id);
      if (!innerSection) {
        return res.status(404).json({ error: "Inner section not found" });
      }

      // Validate input
      if (name && name.trim() === "") {
        return res.status(400).json({ error: "Name cannot be empty" });
      }

      await innerSection.update({
        sectionId: sectionId || innerSection.sectionId,
        name: name || innerSection.name,
        type: type || innerSection.type
      });

      res.status(200).json(innerSection);
    } catch (err) {
      next(err);
    }
  },

  // Create a new table
  createTable: async (req, res, next) => {
    try {
      const { innerSectionId, tableNumber, capacity } = req.body;
      if (!innerSectionId || !tableNumber || !capacity) {
        return res.status(400).json({ error: "Inner section ID, table number, and capacity are required" });
      }
      if (tableNumber.trim() === "") {
        return res.status(400).json({ error: "Table number cannot be empty" });
      }
      if (isNaN(capacity) || capacity < 1) {
        return res.status(400).json({ error: "Capacity must be a positive number" });
      }
      const innerSection = await InnerSection.findByPk(innerSectionId);
      if (!innerSection) {
        return res.status(404).json({ error: "Inner section not found" });
      }
      const existingTable = await Table.findOne({
        where: { innerSectionId, tableNumber }
      });
      if (existingTable) {
        return res.status(400).json({ error: "Table number already exists in this inner section" });
      }
      const table = await Table.create({ innerSectionId, tableNumber, capacity });
      res.status(201).json(table);
    } catch (error) {
      console.error("Error creating table:", error);
      next(error);
    }
  },

  // Get all sections with inner sections and tables
  getAllSectionsWithDetails: async (req, res, next) => {
    try {
      const sections = await Section.findAll({
        include: [
          {
            model: InnerSection,
            as: "innerSections",
            include: [
              {
                model: Table,
                as: "tables",
                include: [
                  {
                    model: Sale,
                    as: "sales",
                    where: { isActive: true },
                    required: false,
                    include: [
                      {
                        model: Section,
                        as: "section",
                        attributes: ["id", "name"]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });
      res.status(200).json(sections);
    } catch (error) {
      console.error("Error fetching sections with details:", error);
      next(error);
    }
  },

  // Get a specific table with its orders
  getTableById: async (req, res, next) => {
    try {
      const { id } = req.params;
      // Validate id
      if (!id || id === "undefined" || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "Valid table ID is required" });
      }
      const table = await Table.findByPk(id, {
        include: [
          {
            model: InnerSection,
            as: "innerSection",
            include: [{ model: Section, as: "section" }]
          },
          {
            model: Sale,
            as: "sales",
            where: { isActive: true },
            required: false,
            include: [
              {
                model: Section,
                as: "section",
                attributes: ["id", "name"]
              },
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
            ]
          }
        ]
      });
      if (!table) {
        return res.status(404).json({ error: "Table not found" });
      }
      res.status(200).json(table);
    } catch (error) {
      console.error("Error fetching table:", error);
      next(error);
    }
  },
  // getTableById: async (req, res, next) => {
  //   try {
  //     const { id } = req.params;
  //     const table = await Table.findByPk(id, {
  //       include: [
  //         {
  //           model: InnerSection,
  //           as: "innerSection",
  //           include: [{ model: Section, as: "section" }]
  //         },
  //         {
  //           model: Sale,
  //           as: "sales",
  //           where: { isActive: true },
  //           required: false,
  //           include: [
  //             {
  //               model: Section,
  //               as: "section",
  //               attributes: ["id", "name"]
  //             },
  //             {
  //               model: SaleMenuItem,
  //               as: "menuItem",
  //               include: [
  //                 {
  //                   model: MenuItem,
  //                   as: "menuItem",
  //                   include: [
  //                     {
  //                       model: MenuItemIngredient,
  //                       as: "menuItemIngredients",
  //                       include: [{ model: Material, as: "material" }]
  //                     }
  //                   ]
  //                 }
  //               ]
  //             }
  //           ]
  //         }
  //       ]
  //     });
  //     if (!table) {
  //       return res.status(404).json({ error: "Table not found" });
  //     }
  //     res.status(200).json(table);
  //   } catch (error) {
  //     console.error("Error fetching table:", error);
  //     next(error);
  //   }
  // },

  // Update table (e.g., occupancy, capacity, table number)
  updateTable: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { tableNumber, capacity, isReserved } = req.body;
      const table = await Table.findByPk(id);
      if (!table) {
        return res.status(404).json({ error: "Table not found" });
      }
      if (tableNumber !== undefined && tableNumber.trim() === "") {
        return res.status(400).json({ error: "Table number cannot be empty" });
      }
      if (capacity !== undefined && (isNaN(capacity) || capacity < 1)) {
        return res.status(400).json({ error: "Capacity must be a positive number" });
      }
      if (tableNumber !== undefined) {
        const existingTable = await Table.findOne({
          where: { innerSectionId: table.innerSectionId, tableNumber },
          where: { id: { [sequelize.Op.ne]: id } }
        });
        if (existingTable) {
          return res.status(400).json({ error: "Table number already exists in this inner section" });
        }
      }
      await table.update({
        tableNumber: tableNumber !== undefined ? tableNumber : table.tableNumber,
        capacity: capacity !== undefined ? capacity : table.capacity,
        isReserved: isReserved !== undefined ? isReserved : table.isReserved
      });
      res.status(200).json(table);
    } catch (error) {
      console.error("Error updating table:", error);
      next(error);
    }
  },

  // Delete table
  deleteTable: async (req, res, next) => {
    try {
      const { id } = req.params;
      const table = await Table.findByPk(id);
      if (!table) {
        return res.status(404).json({ error: "Table not found" });
      }
      const activeSales = await Sale.count({
        where: { tableId: id, isActive: true }
      });
      if (activeSales > 0) {
        return res.status(400).json({ error: "Cannot delete table with active orders" });
      }
      await table.destroy();
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting table:", error);
      next(error);
    }
  },

  // Place an order for a specific table
  placeOrderForTable: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    let negativeStockWarnings = [];
    try {
      const { tableId, saleDate, totalAmount, items, menuItems } = req.body;

      if (!tableId || !saleDate || totalAmount === undefined) {
        await transaction.rollback();
        return res.status(400).json({ error: "Table ID, sale date, and total amount are required" });
      }

      if (totalAmount < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Total amount cannot be negative" });
      }

      if (isNaN(Date.parse(saleDate))) {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid sale date" });
      }

      const table = await Table.findByPk(tableId, {
        include: [{ model: InnerSection, as: "innerSection", include: [{ model: Section, as: "section" }] }],
        transaction
      });
      if (!table) {
        await transaction.rollback();
        return res.status(404).json({ error: "Table not found" });
      }

      const sectionId = table.innerSection.sectionId;

      // Process individual items
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

          let assignmentDeductionQuantity, stockEntryDeductionQuantity;

          if (material && material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
            if (item.unit === material.baseUnit) {
              assignmentDeductionQuantity = item.quantity;
              stockEntryDeductionQuantity = item.quantity;
            } else {
              assignmentDeductionQuantity = item.quantity * material.packageQuantity;
              stockEntryDeductionQuantity = item.quantity * material.packageQuantity;
            }
          } else {
            if (material.unitType === "mass" && item.unit !== material.baseUnit) {
              if (item.unit === "kg" && material.baseUnit === "g") {
                assignmentDeductionQuantity = item.quantity * 1000;
                stockEntryDeductionQuantity = item.quantity * 1000;
              } else if (item.unit === "g" && material.baseUnit === "kg") {
                assignmentDeductionQuantity = item.quantity / 1000;
                stockEntryDeductionQuantity = item.quantity / 1000;
              } else {
                assignmentDeductionQuantity = item.quantity;
                stockEntryDeductionQuantity = item.quantity;
              }
            } else {
              assignmentDeductionQuantity = item.quantity;
              stockEntryDeductionQuantity = item.quantity;
            }
          }

          const assignmentIndividualQuantity = assignment.assignedIndividualQuantity || assignment.assignedQuantity * (material.packageQuantity || 1);
          if (assignmentIndividualQuantity < assignmentDeductionQuantity) {
            const shortage = assignmentDeductionQuantity - assignmentIndividualQuantity;
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

          const newAssignedIndividualQuantity = assignmentIndividualQuantity - assignmentDeductionQuantity;
          assignment.assignedIndividualQuantity = Math.round(newAssignedIndividualQuantity);
          await assignment.save({ transaction });

          const newIndividualQuantity = stockEntry.purchasedIndividualQuantity - stockEntryDeductionQuantity;
          stockEntry.purchasedIndividualQuantity = Math.round(newIndividualQuantity);
          await stockEntry.save({ transaction });

          if (Math.round(newIndividualQuantity) < 0) {
            console.warn(`NEGATIVE STOCK: Stock entry ${stockEntry.id} for ${material.name} now has negative individual quantity: ${Math.round(newIndividualQuantity)}`);
          }
        }
      }

      // Process menu items
      if (menuItems && menuItems.length > 0) {
        for (const menuItemSale of menuItems) {
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

          for (const ingredient of menuItem.menuItemIngredients) {
            const material = ingredient.material;
            const totalIngredientQuantity = ingredient.quantity * menuItemSale.quantity;
            let requiredQuantityInBaseUnits = totalIngredientQuantity;

            if (ingredient.unit !== material.baseUnit) {
              if (material.unitType === "mass") {
                if (ingredient.unit === "kg" && material.baseUnit === "g") {
                  requiredQuantityInBaseUnits = totalIngredientQuantity * 1000;
                } else if (ingredient.unit === "g" && material.baseUnit === "kg") {
                  requiredQuantityInBaseUnits = totalIngredientQuantity / 1000;
                }
              }
            }

            const stockEntries = await StockEntry.findAll({
              where: { materialId: material.id },
              order: [["createdAt", "ASC"]],
              transaction
            });

            const totalAvailableQuantity = stockEntries.reduce((sum, entry) => sum + (entry.purchasedIndividualQuantity || 0), 0);

            if (totalAvailableQuantity < requiredQuantityInBaseUnits) {
              const shortage = requiredQuantityInBaseUnits - totalAvailableQuantity;
              negativeStockWarnings.push({
                materialId: material.id,
                materialName: material.name,
                availableQuantity: totalAvailableQuantity,
                requiredQuantity: requiredQuantityInBaseUnits,
                shortageQuantity: shortage,
                unit: material.baseUnit
              });
            }

            if (stockEntries.length === 0) {
              const virtualStockEntry = await StockEntry.create(
                {
                  materialId: material.id,
                  supplier: "VIRTUAL - Negative Stock",
                  purchasedQuantity: 0,
                  purchasedUnit: material.baseUnit,
                  purchasedIndividualQuantity: -requiredQuantityInBaseUnits,
                  purchasedIndividualUnit: mass.baseUnit,
                  costPerPurchasedUnit: 0,
                  totalCost: 0,
                  purchaseDate: new Date(),
                  expiryDate: null
                },
                { transaction }
              );
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
              let remainingToDeduct = requiredQuantityInBaseUnits;
              for (const stockEntry of stockEntries) {
                if (remainingToDeduct <= 0) break;
                const availableInThisEntry = stockEntry.purchasedIndividualQuantity;
                const deductFromThisEntry = Math.min(availableInThisEntry, remainingToDeduct);
                const newQuantity = Math.round(availableInThisEntry - deductFromThisEntry);
                stockEntry.purchasedIndividualQuantity = newQuantity;
                await stockEntry.save({ transaction });
                remainingToDeduct = Math.max(0, remainingToDeduct - deductFromThisEntry);
                if (newQuantity < 0) {
                  console.warn(`NEGATIVE STOCK: Stock entry ${stockEntry.id} for ${material.name} now has negative quantity: ${newQuantity}`);
                }
              }
            }
          }

          // Create SaleMenuItem record
          const sale = await Sale.create(
            {
              tableId,
              sectionId,
              saleDate: new Date(saleDate),
              totalAmount,
              items: items || [],
              menuItems: menuItems || [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            { transaction }
          );

          await SaleMenuItem.create(
            {
              saleId: sale.id,
              menuItemId: menuItemSale.menuItemId,
              quantity: menuItemSale.quantity,
              unitPrice: menuItemSale.unitPrice,
              totalPrice: menuItemSale.quantity * menuItemSale.unitPrice,
              ingredients: menuItem.menuItemIngredients.map(ingredient => ({
                materialId: ingredient.materialId,
                quantity: ingredient.quantity,
                unit: ingredient.unit
              }))
            },
            { transaction }
          );
        }
      } else {
        // Create the sale record if no menu items
        const sale = await Sale.create(
          {
            tableId,
            sectionId,
            saleDate: new Date(saleDate),
            totalAmount,
            items: items || [],
            menuItems: menuItems || [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { transaction }
        );
      }

      // Update table occupancy
      await table.update({ isReserved: true }, { transaction });

      // Fetch updated stock entries
      const updatedStockEntries = await StockEntry.findAll({
        include: [{ model: Material, as: "material" }],
        order: [["id", "ASC"]],
        transaction
      });

      await transaction.commit();

      let responseMessage = "Order placed successfully for table";
      const hasNegativeStock = negativeStockWarnings.length > 0;
      if (hasNegativeStock) {
        responseMessage += ` (WARNING: ${negativeStockWarnings.length} ingredients resulted in negative stock)`;
      }

      res.status(201).json({
        sale,
        updatedStockEntries,
        message: responseMessage,
        negativeStockWarnings,
        hasNegativeStock
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error placing order for table:", error);
      next(error);
    }
  }
};

export { InnerSection, Table, tablesController };
