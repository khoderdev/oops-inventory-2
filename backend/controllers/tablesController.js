import { Op } from "sequelize";
import { Order, OrderItem, Table } from "../models/index.js";

export const tablesController = {
  // Get all tables
  getTables: async (req, res) => {
    try {
      const { section, status, includeOrders } = req.query;

      const whereClause = { isActive: true };

      if (section) whereClause.section = section;
      if (status) whereClause.status = status;

      const includeOptions = [];

      if (includeOrders === "true") {
        includeOptions.push({
          model: Order,
          as: "orders",
          where: {
            status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
          },
          required: false,
          include: [
            {
              model: OrderItem,
              as: "items"
            }
          ]
        });
      }

      const tables = await Table.findAll({
        where: whereClause,
        include: includeOptions,
        order: [["number", "ASC"]]
      });

      // Transform tables to include current order info
      const tablesWithOrderInfo = tables.map(table => {
        const tableData = table.toJSON();

        if (table.orders && table.orders.length > 0) {
          const currentOrder = table.orders[0];
          tableData.currentOrder = {
            orderId: currentOrder.id.toString(),
            orderNumber: currentOrder.orderNumber,
            customerName: currentOrder.customerName,
            startTime: currentOrder.createdAt,
            totalAmount: parseFloat(currentOrder.total),
            itemCount: currentOrder.items?.length || 0
          };
          tableData.status = "opened";
        }

        // Remove the full orders array to keep response clean
        delete tableData.orders;

        return tableData;
      });

      res.json({ data: tablesWithOrderInfo });
    } catch (error) {
      console.error("Get tables error:", error);
      res.status(500).json({ message: "Failed to fetch tables", error: error.message });
    }
  },

  // Get specific table
  getTable: async (req, res) => {
    try {
      const { tableId } = req.params;

      const table = await Table.findByPk(tableId, {
        include: [
          {
            model: Order,
            as: "orders",
            where: {
              status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
            },
            required: false,
            include: [
              {
                model: OrderItem,
                as: "items"
              }
            ]
          }
        ]
      });

      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      res.json({ data: table });
    } catch (error) {
      console.error("Get table error:", error);
      res.status(500).json({ message: "Failed to fetch table", error: error.message });
    }
  },

  // Create new table
  createTable: async (req, res) => {
    try {
      let { number, name, seats, shape, position, section, notes } = req.body;

      // If no number provided or number already exists, auto-assign next available number
      if (!number || await Table.findOne({ where: { number } })) {
        // Find the highest existing table number and add 1
        const maxNumberResult = await Table.findOne({
          attributes: [[Table.sequelize.fn('MAX', Table.sequelize.col('number')), 'maxNumber']],
          raw: true
        });
        const maxNumber = maxNumberResult?.maxNumber || 0;
        number = maxNumber + 1;
      }

      const table = await Table.create({
        number,
        name,
        seats: seats || 2,
        shape: shape || "square",
        position: position || { x: 0, y: 0 },
        section: section || "main",
        notes
      });

      res.status(201).json({ message: "Table created successfully", table });
    } catch (error) {
      console.error("Create table error:", error);
      res.status(500).json({ message: "Failed to create table", error: error.message });
    }
  },

  // Update table
  updateTable: async (req, res) => {
    try {
      const { tableId } = req.params;
      const { number, name, seats, shape, position, section, notes, status } = req.body;

      const table = await Table.findByPk(tableId);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      // Check if new table number conflicts with existing tables
      if (number && number !== table.number) {
        const existingTable = await Table.findOne({
          where: {
            number,
            id: { [Op.ne]: tableId }
          }
        });
        if (existingTable) {
          return res.status(400).json({ message: "Table number already exists" });
        }
      }

      await table.update({
        number: number !== undefined ? number : table.number,
        name: name !== undefined ? name : table.name,
        seats: seats !== undefined ? seats : table.seats,
        shape: shape !== undefined ? shape : table.shape,
        position: position !== undefined ? position : table.position,
        section: section !== undefined ? section : table.section,
        notes: notes !== undefined ? notes : table.notes,
        status: status !== undefined ? status : table.status
      });

      res.json({ message: "Table updated successfully", table });
    } catch (error) {
      console.error("Update table error:", error);
      res.status(500).json({ message: "Failed to update table", error: error.message });
    }
  },

  // Delete table
  deleteTable: async (req, res) => {
    try {
      const { tableId } = req.params;

      const table = await Table.findByPk(tableId);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      // Check if table has active orders
      const activeOrders = await Order.count({
        where: {
          tableId,
          status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
        }
      });

      if (activeOrders > 0) {
        return res.status(400).json({
          message: "Cannot delete table with active orders. Please complete or cancel all orders first."
        });
      }

      // Soft delete by setting isActive to false
      await table.update({ isActive: false });

      res.json({ message: "Table deleted successfully" });
    } catch (error) {
      console.error("Delete table error:", error);
      res.status(500).json({ message: "Failed to delete table", error: error.message });
    }
  },

  // Reserve table
  reserveTable: async (req, res) => {
    try {
      const { tableId } = req.params;
      const { reservedBy, reservedUntil, notes } = req.body;

      const table = await Table.findByPk(tableId);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      if (table.status !== "available") {
        return res.status(400).json({ message: "Table is not available for reservation" });
      }

      await table.update({
        status: "reserved",
        reservedBy,
        reservedAt: new Date(),
        reservedUntil: new Date(reservedUntil),
        notes: notes || table.notes
      });

      res.json({ message: "Table reserved successfully", table });
    } catch (error) {
      console.error("Reserve table error:", error);
      res.status(500).json({ message: "Failed to reserve table", error: error.message });
    }
  },

  // Clear table reservation
  clearReservation: async (req, res) => {
    try {
      const { tableId } = req.params;

      const table = await Table.findByPk(tableId);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      await table.update({
        status: "available",
        reservedBy: null,
        reservedAt: null,
        reservedUntil: null
      });

      res.json({ message: "Table reservation cleared successfully", table });
    } catch (error) {
      console.error("Clear reservation error:", error);
      res.status(500).json({ message: "Failed to clear table reservation", error: error.message });
    }
  },

  // Mark table for cleaning
  markForCleaning: async (req, res) => {
    try {
      const { tableId } = req.params;

      const table = await Table.findByPk(tableId);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      await table.update({
        status: "cleaning",
        lastCleaned: new Date()
      });

      res.json({ message: "Table marked for cleaning", table });
    } catch (error) {
      console.error("Mark for cleaning error:", error);
      res.status(500).json({ message: "Failed to mark table for cleaning", error: error.message });
    }
  },

  // Mark table as clean
  markAsClean: async (req, res) => {
    try {
      const { tableId } = req.params;

      const table = await Table.findByPk(tableId);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      await table.update({
        status: "available",
        lastCleaned: new Date()
      });

      res.json({ message: "Table marked as clean", table });
    } catch (error) {
      console.error("Mark as clean error:", error);
      res.status(500).json({ message: "Failed to mark table as clean", error: error.message });
    }
  },

  // Get table sections
  getTableSections: async (req, res) => {
    try {
      const sections = await Table.findAll({
        attributes: ["section"],
        where: { isActive: true },
        group: ["section"],
        raw: true
      });

      const sectionNames = sections.map(s => s.section).filter(Boolean);

      res.json({ data: sectionNames });
    } catch (error) {
      console.error("Get table sections error:", error);
      res.status(500).json({ message: "Failed to fetch table sections", error: error.message });
    }
  },

  // Transfer entire order from one table to another
  transferOrder: async (req, res) => {
    try {
      const { fromTableId, toTableId, orderId } = req.body;

      // Validate input
      if (!fromTableId || !toTableId || !orderId) {
        return res.status(400).json({ 
          message: "Missing required fields: fromTableId, toTableId, and orderId are required" 
        });
      }

      if (fromTableId === toTableId) {
        return res.status(400).json({ 
          message: "Cannot transfer order to the same table" 
        });
      }

      // Find both tables
      const [fromTable, toTable] = await Promise.all([
        Table.findByPk(fromTableId),
        Table.findByPk(toTableId)
      ]);

      if (!fromTable) {
        return res.status(404).json({ message: "Source table not found" });
      }

      if (!toTable) {
        return res.status(404).json({ message: "Destination table not found" });
      }

      if (!fromTable.isActive || !toTable.isActive) {
        return res.status(400).json({ message: "Both tables must be active" });
      }

      // Find the order to transfer
      const order = await Order.findOne({
        where: {
          id: orderId,
          tableId: fromTableId,
          status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
        },
        include: [
          {
            model: OrderItem,
            as: "items"
          }
        ]
      });

      if (!order) {
        return res.status(404).json({ 
          message: "Order not found on source table or order is not transferable" 
        });
      }

      // Check if destination table has an active order
      const existingOrder = await Order.findOne({
        where: {
          tableId: toTableId,
          status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
        }
      });

      if (existingOrder) {
        return res.status(400).json({ 
          message: "Destination table already has an active order. Use transferItems to merge orders." 
        });
      }

      // Transfer the order
      await order.update({ tableId: toTableId });

      // Update table statuses
      await Promise.all([
        fromTable.update({ status: "available" }),
        toTable.update({ status: "opened" })
      ]);

      console.log(`✅ Order ${orderId} transferred from Table ${fromTable.number} to Table ${toTable.number}`);

      res.json({ 
        message: `Order successfully transferred from Table ${fromTable.number} to Table ${toTable.number}`,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          fromTable: fromTable.number,
          toTable: toTable.number,
          itemCount: order.items?.length || 0
        }
      });

    } catch (error) {
      console.error("Transfer order error:", error);
      res.status(500).json({ message: "Failed to transfer order", error: error.message });
    }
  },

  // Transfer specific items from one table to another
  transferItems: async (req, res) => {
    try {
      const { fromTableId, toTableId, itemIds, createNewOrder } = req.body;

      // Validate input
      if (!fromTableId || !toTableId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ 
          message: "Missing required fields: fromTableId, toTableId, and itemIds array are required" 
        });
      }

      if (fromTableId === toTableId) {
        return res.status(400).json({ 
          message: "Cannot transfer items to the same table" 
        });
      }

      // Find both tables
      const [fromTable, toTable] = await Promise.all([
        Table.findByPk(fromTableId),
        Table.findByPk(toTableId)
      ]);

      if (!fromTable || !toTable) {
        return res.status(404).json({ message: "One or both tables not found" });
      }

      if (!fromTable.isActive || !toTable.isActive) {
        return res.status(400).json({ message: "Both tables must be active" });
      }

      // Find the source order and items to transfer
      const sourceOrder = await Order.findOne({
        where: {
          tableId: fromTableId,
          status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
        },
        include: [
          {
            model: OrderItem,
            as: "items",
            where: { id: { [Op.in]: itemIds } }
          }
        ]
      });

      if (!sourceOrder || !sourceOrder.items || sourceOrder.items.length === 0) {
        return res.status(404).json({ 
          message: "No transferable items found on source table" 
        });
      }

      const itemsToTransfer = sourceOrder.items;

      // Check if we're transferring all items from the source order
      const totalItemsInSourceOrder = await OrderItem.count({
        where: { orderId: sourceOrder.id }
      });

      const isTransferringAllItems = itemsToTransfer.length === totalItemsInSourceOrder;

      // Find or create destination order
      let destinationOrder = await Order.findOne({
        where: {
          tableId: toTableId,
          status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
        }
      });

      if (!destinationOrder && (createNewOrder || isTransferringAllItems)) {
        // Create new order on destination table
        destinationOrder = await Order.create({
          tableId: toTableId,
          orderNumber: `T${toTable.number}-${Date.now()}`,
          customerName: sourceOrder.customerName || `Table ${toTable.number}`,
          orderType: sourceOrder.orderType || "dine_in",
          status: "draft",
          subtotal: 0,
          tax: 0,
          total: 0
        });
      } else if (!destinationOrder) {
        return res.status(400).json({ 
          message: "Destination table has no active order. Set createNewOrder=true to create a new order." 
        });
      }

      // Transfer the items
      const transferredItems = [];
      let transferredTotal = 0;

      for (const item of itemsToTransfer) {
        await item.update({ orderId: destinationOrder.id });
        transferredItems.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.totalPrice
        });
        transferredTotal += parseFloat(item.totalPrice || 0);
      }

      // Update order totals
      await Promise.all([
        tablesController.recalculateOrderTotal(sourceOrder.id),
        tablesController.recalculateOrderTotal(destinationOrder.id)
      ]);

      // Update table statuses
      if (isTransferringAllItems) {
        // If all items transferred, mark source table as available and cancel the order
        await Promise.all([
          sourceOrder.update({ status: "cancelled" }),
          fromTable.update({ status: "available" })
        ]);
      }

      await toTable.update({ status: "opened" });

      console.log(`✅ ${itemsToTransfer.length} items transferred from Table ${fromTable.number} to Table ${toTable.number}`);

      res.json({ 
        message: `${itemsToTransfer.length} items successfully transferred from Table ${fromTable.number} to Table ${toTable.number}`,
        transfer: {
          fromTable: fromTable.number,
          toTable: toTable.number,
          itemsTransferred: transferredItems.length,
          transferredTotal: transferredTotal.toFixed(2),
          allItemsTransferred: isTransferringAllItems,
          items: transferredItems
        }
      });

    } catch (error) {
      console.error("Transfer items error:", error);
      res.status(500).json({ message: "Failed to transfer items", error: error.message });
    }
  },

  // Helper method to recalculate order totals
  recalculateOrderTotal: async (orderId) => {
    try {
      const orderItems = await OrderItem.findAll({
        where: { orderId }
      });

      const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
      const tax = subtotal * 0.1; // Assuming 10% tax rate
      const total = subtotal + tax;

      await Order.update(
        {
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2)
        },
        { where: { id: orderId } }
      );

      return { subtotal, tax, total };
    } catch (error) {
      console.error("Error recalculating order total:", error);
      throw error;
    }
  },

  // Quick create table with smart defaults
  quickCreateTable: async (req, res) => {
    try {
      const { section, seats, shape, customName } = req.body;

      // Find next available table number
      const maxNumberResult = await Table.findOne({
        attributes: [[Table.sequelize.fn('MAX', Table.sequelize.col('number')), 'maxNumber']],
        raw: true
      });
      const nextNumber = (maxNumberResult?.maxNumber || 0) + 1;

      // Generate smart table name
      let tableName = customName;
      if (!tableName) {
        const sectionPrefix = section ? section.charAt(0).toUpperCase() + section.slice(1) : 'Table';
        tableName = `${sectionPrefix} ${nextNumber}`;
      }

      const table = await Table.create({
        number: nextNumber,
        name: tableName,
        seats: seats || 4,
        shape: shape || "square",
        position: { x: 0, y: 0 }, // Default position - can be updated via drag & drop
        section: section || "main",
        status: "available",
        isActive: true
      });

      console.log(`✅ Quick created Table ${nextNumber}: ${tableName}`);

      res.status(201).json({ 
        message: `Table ${nextNumber} created successfully`,
        table 
      });

    } catch (error) {
      console.error("Quick create table error:", error);
      res.status(500).json({ message: "Failed to create table", error: error.message });
    }
  },

  // Rename table with validation
  renameTable: async (req, res) => {
    try {
      const { tableId } = req.params;
      const { name, number } = req.body;

      if (!name && !number) {
        return res.status(400).json({ message: "Either name or number must be provided" });
      }

      const table = await Table.findByPk(tableId);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      // Check if table has active orders (prevent renaming during service)
      const activeOrders = await Order.count({
        where: {
          tableId,
          status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
        }
      });

      if (activeOrders > 0) {
        return res.status(400).json({
          message: "Cannot rename table with active orders. Please complete orders first."
        });
      }

      // Validate new number if provided
      if (number && number !== table.number) {
        const existingTable = await Table.findOne({
          where: {
            number,
            id: { [Op.ne]: tableId }
          }
        });
        if (existingTable) {
          return res.status(400).json({ message: `Table number ${number} already exists` });
        }
      }

      const oldName = table.name;
      const oldNumber = table.number;

      await table.update({
        name: name || table.name,
        number: number || table.number
      });

      console.log(`✅ Renamed Table ${oldNumber} (${oldName}) → ${table.number} (${table.name})`);

      res.json({ 
        message: `Table renamed from "${oldName}" to "${table.name}"`,
        table,
        changes: {
          oldName,
          newName: table.name,
          oldNumber,
          newNumber: table.number
        }
      });

    } catch (error) {
      console.error("Rename table error:", error);
      res.status(500).json({ message: "Failed to rename table", error: error.message });
    }
  },

  // Bulk create tables for quick setup
  bulkCreateTables: async (req, res) => {
    try {
      const { tables, section } = req.body;

      if (!tables || !Array.isArray(tables) || tables.length === 0) {
        return res.status(400).json({ message: "Tables array is required" });
      }

      // Find next available starting number
      const maxNumberResult = await Table.findOne({
        attributes: [[Table.sequelize.fn('MAX', Table.sequelize.col('number')), 'maxNumber']],
        raw: true
      });
      let nextNumber = (maxNumberResult?.maxNumber || 0) + 1;

      const createdTables = [];
      const errors = [];

      for (const tableData of tables) {
        try {
          // Use provided number or auto-assign
          const tableNumber = tableData.number || nextNumber++;
          
          // Check if number already exists
          const existingTable = await Table.findOne({ where: { number: tableNumber } });
          if (existingTable) {
            errors.push(`Table ${tableNumber} already exists`);
            continue;
          }

          const table = await Table.create({
            number: tableNumber,
            name: tableData.name || `Table ${tableNumber}`,
            seats: tableData.seats || 4,
            shape: tableData.shape || "square",
            position: tableData.position || { x: 0, y: 0 },
            section: tableData.section || section || "main",
            notes: tableData.notes,
            status: "available",
            isActive: true
          });

          createdTables.push(table);
          console.log(`✅ Bulk created Table ${tableNumber}: ${table.name}`);

        } catch (error) {
          errors.push(`Failed to create table: ${error.message}`);
        }
      }

      res.status(201).json({
        message: `Successfully created ${createdTables.length} tables`,
        created: createdTables.length,
        errors: errors.length,
        tables: createdTables,
        errorDetails: errors
      });

    } catch (error) {
      console.error("Bulk create tables error:", error);
      res.status(500).json({ message: "Failed to bulk create tables", error: error.message });
    }
  },

  // Get next available table number
  getNextTableNumber: async (req, res) => {
    try {
      const maxNumberResult = await Table.findOne({
        attributes: [[Table.sequelize.fn('MAX', Table.sequelize.col('number')), 'maxNumber']],
        raw: true
      });
      
      const nextNumber = (maxNumberResult?.maxNumber || 0) + 1;
      
      res.json({ 
        nextNumber,
        suggestedName: `Table ${nextNumber}`
      });

    } catch (error) {
      console.error("Get next table number error:", error);
      res.status(500).json({ message: "Failed to get next table number", error: error.message });
    }
  },

  // Duplicate table (copy settings to new table)
  duplicateTable: async (req, res) => {
    try {
      const { tableId } = req.params;
      const { customName, customNumber } = req.body;

      const sourceTable = await Table.findByPk(tableId);
      if (!sourceTable) {
        return res.status(404).json({ message: "Source table not found" });
      }

      // Get next available number if not provided
      let newNumber = customNumber;
      if (!newNumber) {
        const maxNumberResult = await Table.findOne({
          attributes: [[Table.sequelize.fn('MAX', Table.sequelize.col('number')), 'maxNumber']],
          raw: true
        });
        newNumber = (maxNumberResult?.maxNumber || 0) + 1;
      }

      // Check if number already exists
      const existingTable = await Table.findOne({ where: { number: newNumber } });
      if (existingTable) {
        return res.status(400).json({ message: `Table number ${newNumber} already exists` });
      }

      // Create duplicate with same settings
      const duplicateTable = await Table.create({
        number: newNumber,
        name: customName || `${sourceTable.name} Copy`,
        seats: sourceTable.seats,
        shape: sourceTable.shape,
        position: { x: sourceTable.position.x + 50, y: sourceTable.position.y + 50 }, // Offset position
        section: sourceTable.section,
        notes: sourceTable.notes,
        status: "available",
        isActive: true
      });

      console.log(`✅ Duplicated Table ${sourceTable.number} → Table ${newNumber}`);

      res.status(201).json({
        message: `Table duplicated successfully`,
        originalTable: {
          id: sourceTable.id,
          number: sourceTable.number,
          name: sourceTable.name
        },
        duplicateTable
      });

    } catch (error) {
      console.error("Duplicate table error:", error);
      res.status(500).json({ message: "Failed to duplicate table", error: error.message });
    }
  }
};
