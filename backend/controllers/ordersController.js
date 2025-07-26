import { Op } from "sequelize";
import { Assignment, Material, MenuItem, Order, OrderItem, sequelize, Table, User } from "../models/index.js";
import salesController from "./salesController.js";

export const ordersController = {
  // Create a new order
  createOrder: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { orderType, tableId, customerName, customerPhone, customerAddress, notes, items = [] } = req.body;
      const userId = req.user?.id;

      // Validate table if provided
      if (tableId) {
        const table = await Table.findByPk(tableId);
        if (!table) {
          await transaction.rollback();
          return res.status(404).json({ message: "Table not found" });
        }
      }

      // Create order
      const order = await Order.create(
        {
          orderType: orderType || "takeaway",
          tableId,
          customerName,
          customerPhone,
          customerAddress,
          notes,
          createdBy: userId,
          updatedBy: userId
        },
        { transaction }
      );

      // Create order items
      if (items.length > 0) {
        const orderItems = await Promise.all(
          items.map(async item => {
            const orderItem = await OrderItem.create(
              {
                orderId: order.id,
                materialId: item.materialId,
                menuItemId: item.menuItemId,
                assignmentId: item.assignmentId,
                name: item.name,
                type: item.type,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                notes: item.notes
              },
              { transaction }
            );

            return orderItem;
          })
        );

        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;

        await order.update({ subtotal, tax, total }, { transaction });
      }

      await transaction.commit();

      // Fetch complete order with items
      const completeOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" },
              { model: Assignment, as: "assignment" }
            ]
          },
          { model: Table, as: "table" },
          { model: User, as: "creator" }
        ]
      });

      res.status(201).json({ message: "Order created successfully", order: completeOrder });
    } catch (error) {
      await transaction.rollback();
      console.error("Create order error:", error);
      res.status(500).json({ message: "Failed to create order", error: error.message });
    }
  },

  // Get all orders with filters
  getOrders: async (req, res) => {
    try {
      const { status, orderType, tableId, startDate, endDate, limit = 50, offset = 0 } = req.query;

      const whereClause = {};

      if (status) whereClause.status = status;
      if (orderType) whereClause.orderType = orderType;
      if (tableId) whereClause.tableId = tableId;

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" }
            ]
          },
          { model: Table, as: "table" },
          { model: User, as: "creator" }
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Transform to summary format
      const orderSummaries = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        status: order.status,
        tableId: order.tableId,
        tableNumber: order.table?.number,
        customerName: order.customerName,
        itemCount: order.items?.length || 0,
        total: parseFloat(order.total),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));

      res.json({ data: orderSummaries });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
  },

  // Get specific order by ID
  getOrder: async (req, res) => {
    try {
      const { orderId } = req.params;

      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" },
              { model: Assignment, as: "assignment" }
            ]
          },
          { model: Table, as: "table" },
          { model: User, as: "creator" },
          { model: User, as: "updater" }
        ]
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ data: order });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to fetch order", error: error.message });
    }
  },

  // Update order
  updateOrder: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { orderId } = req.params;
      const { orderType, tableId, customerName, customerPhone, customerAddress, notes, items } = req.body;
      const userId = req.user?.id;

      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }

      // Update order details
      await order.update(
        {
          orderType: orderType || order.orderType,
          tableId: tableId !== undefined ? tableId : order.tableId,
          customerName: customerName !== undefined ? customerName : order.customerName,
          customerPhone: customerPhone !== undefined ? customerPhone : order.customerPhone,
          customerAddress: customerAddress !== undefined ? customerAddress : order.customerAddress,
          notes: notes !== undefined ? notes : order.notes,
          updatedBy: userId
        },
        { transaction }
      );

      // Update items if provided
      if (items) {
        // Remove existing items
        await OrderItem.destroy({ where: { orderId }, transaction });

        // Create new items
        if (items.length > 0) {
          const orderItems = await Promise.all(
            items.map(async item => {
              return await OrderItem.create(
                {
                  orderId: order.id,
                  materialId: item.materialId,
                  menuItemId: item.menuItemId,
                  assignmentId: item.assignmentId,
                  name: item.name,
                  type: item.type,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                  notes: item.notes
                },
                { transaction }
              );
            })
          );

          // Recalculate totals
          const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
          const tax = subtotal * 0.1;
          const total = subtotal + tax;

          await order.update({ subtotal, tax, total }, { transaction });
        } else {
          await order.update({ subtotal: 0, tax: 0, total: 0 }, { transaction });
        }
      }

      await transaction.commit();

      // Fetch updated order
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" },
              { model: Assignment, as: "assignment" }
            ]
          },
          { model: Table, as: "table" }
        ]
      });

      res.json({ message: "Order updated successfully", order: updatedOrder });
    } catch (error) {
      await transaction.rollback();
      console.error("Update order error:", error);
      res.status(500).json({ message: "Failed to update order", error: error.message });
    }
  },

  // Update order status
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updateData = { status, updatedBy: userId };

      if (status === "cancelled") {
        updateData.cancelledAt = new Date();
      }

      await order.update(updateData);

      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          { model: OrderItem, as: "items" },
          { model: Table, as: "table" }
        ]
      });

      res.json({ message: "Order status updated successfully", order: updatedOrder });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Failed to update order status", error: error.message });
    }
  },

  // Complete order (convert to sale)
  completeOrder: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { orderId } = req.params;
      const { paymentData } = req.body;
      const userId = req.user?.id;

      const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }],
        transaction
      });

      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status === "paid") {
        await transaction.rollback();
        return res.status(400).json({ message: "Order already completed" });
      }

      // Convert order to sale format
      const saleData = {
        sectionId: "default-section", // You may want to get this from table or user
        items: order.items
          .filter(item => item.type === "material")
          .map(item => ({
            materialId: item.materialId,
            assignmentId: item.assignmentId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice),
            materialName: item.name
          })),
        menuItems: order.items
          .filter(item => item.type === "menu")
          .map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice),
            menuItemName: item.name
          })),
        totalAmount: parseFloat(order.total),
        paymentAmount: paymentData.paymentAmount,
        paymentMethod: paymentData.paymentMethod || "cash"
      };

      // Create sale using existing sales controller
      const mockReq = { body: saleData, user: { id: userId } };
      const mockRes = {
        status: code => mockRes,
        json: data => data
      };

      const saleResult = await new Promise((resolve, reject) => {
        const originalJson = mockRes.json;
        mockRes.json = data => {
          if (data.error || data.message?.includes("failed")) {
            reject(new Error(data.message || "Sale creation failed"));
          } else {
            resolve(data);
          }
        };

        salesController.createSales(mockReq, mockRes).catch(reject);
      });

      // Update order with completion details
      await order.update(
        {
          status: "paid",
          paymentMethod: paymentData.paymentMethod,
          paymentAmount: paymentData.paymentAmount,
          change: paymentData.change,
          saleId: saleResult.sale?.id,
          completedAt: new Date(),
          updatedBy: userId
        },
        { transaction }
      );

      await transaction.commit();

      const completedOrder = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }]
      });

      res.json({
        message: "Order completed successfully",
        order: completedOrder,
        saleId: saleResult.sale?.id
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Complete order error:", error);
      res.status(500).json({ message: "Failed to complete order", error: error.message });
    }
  },

  // Cancel order
  cancelOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      await order.update({
        status: "cancelled",
        cancelReason: reason,
        cancelledAt: new Date(),
        updatedBy: userId
      });

      const cancelledOrder = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }]
      });

      res.json({ message: "Order cancelled successfully", order: cancelledOrder });
    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).json({ message: "Failed to cancel order", error: error.message });
    }
  },

  // Get table orders
  getTableOrders: async (req, res) => {
    try {
      const { tableId } = req.params;

      const orders = await Order.findAll({
        where: {
          tableId,
          status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
        },
        include: [
          { model: OrderItem, as: "items" },
          { model: Table, as: "table" }
        ],
        order: [["createdAt", "DESC"]]
      });

      res.json({ data: orders });
    } catch (error) {
      console.error("Get table orders error:", error);
      res.status(500).json({ message: "Failed to fetch table orders", error: error.message });
    }
  },

  // Get draft orders
  getDraftOrders: async (req, res) => {
    try {
      const orders = await Order.findAll({
        where: { status: "draft" },
        include: [
          { model: OrderItem, as: "items" },
          { model: Table, as: "table" }
        ],
        order: [["updatedAt", "DESC"]]
      });

      res.json({ data: orders });
    } catch (error) {
      console.error("Get draft orders error:", error);
      res.status(500).json({ message: "Failed to fetch draft orders", error: error.message });
    }
  },

  // Auto-save order
  autoSaveOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only auto-save draft orders
      if (order.status !== "draft") {
        return res.status(400).json({ message: "Can only auto-save draft orders" });
      }

      await order.update({
        ...updateData,
        updatedBy: userId
      });

      res.json({ message: "Order auto-saved successfully" });
    } catch (error) {
      console.error("Auto-save order error:", error);
      res.status(500).json({ message: "Failed to auto-save order", error: error.message });
    }
  }
};
