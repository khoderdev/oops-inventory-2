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
  }
};
