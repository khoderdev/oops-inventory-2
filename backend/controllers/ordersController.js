import { Op } from "sequelize";
import { auditOrderOperation } from "../middleware/auditMiddleware.js";
import { Assignment, Material, MenuItem, Order, OrderItem, sequelize, Table, User } from "../models/index.js";
import salesController from "./salesController.js";

export const ordersController = {
  // Create a new order - SIMPLIFIED VERSION
  createOrder: async (req, res) => {
    console.log(" ORDER REQUEST RECEIVED");
    console.log(" Request body keys:", Object.keys(req.body));

    const transaction = await sequelize.transaction();

    try {
      const { orderNumber, orderType, tableId, customerName, customerPhone, customerAddress, notes, items = [] } = req.body;
      const userId = req.user?.id;

      console.log(" Creating order:", { orderNumber, orderType, tableId, itemsCount: items.length });

      // Generate sequential order number if not provided
      let finalOrderNumber = orderNumber;
      if (!finalOrderNumber) {
        try {
          // Find the last order number
          const lastOrder = await Order.findOne({
            order: [["orderNumber", "DESC"]],
            attributes: ["orderNumber"]
          });

          let nextSequence = 1;
          if (lastOrder && lastOrder.orderNumber) {
            const match = lastOrder.orderNumber.match(/ORD-(\d+)/);
            if (match) {
              nextSequence = parseInt(match[1], 10) + 1;
            }
          }

          finalOrderNumber = `ORD-${nextSequence.toString().padStart(4, "0")}`;
          console.log("🔢 Generated sequential order number:", finalOrderNumber);
        } catch (error) {
          console.error("Error generating order number:", error);
          finalOrderNumber = `ORD-0001`; // Fallback
        }
      }

      // Create order with your exact data
      const order = await Order.create(
        {
          orderNumber: finalOrderNumber,
          orderType: orderType || "takeaway",
          tableId: tableId || null,
          customerName,
          customerPhone,
          customerAddress,
          notes,
          createdBy: userId,
          updatedBy: userId
        },
        { transaction }
      );

      console.log("✅ Order created:", order.id, order.orderNumber);

      // Update table status if this is a table order
      if (tableId) {
        const table = await Table.findByPk(tableId, { transaction });
        if (table && table.status === "available") {
          await table.update({ status: "opened" }, { transaction });
          console.log("📋 Table status updated to opened:", table.number);
        }
      }

      // Create order items - SIMPLIFIED
      if (items.length > 0) {
        const orderItems = await Promise.all(
          items.map(async item => {
            console.log("📎 Creating item:", item.name, "x", item.quantity);
            console.log("🔍 Full item data:", JSON.stringify(item, null, 2));

            const orderItemData = {
              orderId: order.id,
              materialId: item.materialId || null,
              menuItemId: item.menuItemId || null,
              assignmentId: item.assignmentId || null,
              name: item.name,
              type: item.type,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              notes: item.notes
            };

            console.log("🔍 OrderItem create data:", JSON.stringify(orderItemData, null, 2));

            const orderItem = await OrderItem.create(orderItemData, { transaction });

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

      // Log successful order creation
      if (userId) {
        await auditOrderOperation(userId, "CREATE", completeOrder.toJSON(), null, req);
      }

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
      const { status, orderType, tableId, startDate, endDate, limit = 50, offset = 0, orderBy = "createdAt", order = "DESC" } = req.query;

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
          { model: User, as: "creator", attributes: ["id", "username"] }
          // { model: User, as: "updater", attributes: ["id", "name"] }
        ],
        order: [[orderBy, order.toUpperCase()]],
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
          { model: User, as: "creator", attributes: ["id", "username"] },
          { model: User, as: "updater", attributes: ["id", "username"] }
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

      // Store original order data for audit
      const originalOrder = order.toJSON();

      // Handle table status changes
      const oldTableId = order.tableId;
      const newTableId = tableId !== undefined ? tableId : order.tableId;

      // Update order details
      await order.update(
        {
          orderType: orderType || order.orderType,
          tableId: newTableId,
          customerName: customerName !== undefined ? customerName : order.customerName,
          customerPhone: customerPhone !== undefined ? customerPhone : order.customerPhone,
          customerAddress: customerAddress !== undefined ? customerAddress : order.customerAddress,
          notes: notes !== undefined ? notes : order.notes,
          updatedBy: userId
        },
        { transaction }
      );

      // Update table statuses if table assignment changed
      if (oldTableId !== newTableId) {
        // Free up old table
        if (oldTableId) {
          const oldTable = await Table.findByPk(oldTableId, { transaction });
          if (oldTable) {
            // Check if there are other active orders for this table
            const otherActiveOrders = await Order.count({
              where: {
                tableId: oldTableId,
                id: { [Op.ne]: order.id },
                status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
              },
              transaction
            });

            if (otherActiveOrders === 0) {
              await oldTable.update({ status: "available" }, { transaction });
              console.log("📋 Old table freed:", oldTable.number);
            }
          }
        }

        // Occupy new table
        if (newTableId) {
          const newTable = await Table.findByPk(newTableId, { transaction });
          if (newTable && newTable.status === "available") {
            await newTable.update({ status: "opened" }, { transaction });
            console.log("📋 New table opened:", newTable.number);
          }
        }
      }

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

      // Log successful order update
      if (userId) {
        await auditOrderOperation(userId, "UPDATE", updatedOrder.toJSON(), originalOrder, req);
      }

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

      // Log order data for debugging
      console.log("Order data:", JSON.stringify(order, null, 2));
      console.log("Order items:", JSON.stringify(order.items, null, 2));

      // Convert order to sale format
      const saleData = {
        saleDate: new Date().toISOString(),
        // sectionId will be handled automatically by the sales controller
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

      // Log the sale data for debugging
      console.log("Sale data being sent:", JSON.stringify(saleData, null, 2));

      const saleResult = await new Promise((resolve, reject) => {
        mockRes.json = data => {
          console.log("Sales controller response:", JSON.stringify(data, null, 2));
          if (data.error || data.message?.includes("failed")) {
            reject(new Error(`Sale creation failed: ${data.error || data.message}`));
          } else {
            resolve(data);
          }
        };

        salesController.createSales(mockReq, mockRes).catch(error => {
          console.log("Sales controller threw error:", error);
          reject(error);
        });
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

      // Free up table when order is completed
      if (order.tableId) {
        const table = await Table.findByPk(order.tableId, { transaction });
        if (table) {
          // Check if there are other active orders for this table
          const otherActiveOrders = await Order.count({
            where: {
              tableId: order.tableId,
              id: { [Op.ne]: order.id },
              status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
            },
            transaction
          });

          if (otherActiveOrders === 0) {
            await table.update({ status: "available" }, { transaction });
            console.log("📋 Table freed after order completion:", table.number);
          }
        }
      }

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

      // Free up table when order is cancelled
      if (order.tableId) {
        const table = await Table.findByPk(order.tableId);
        if (table) {
          // Check if there are other active orders for this table
          const otherActiveOrders = await Order.count({
            where: {
              tableId: order.tableId,
              id: { [Op.ne]: order.id },
              status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
            }
          });

          if (otherActiveOrders === 0) {
            await table.update({ status: "available" });
            console.log("📋 Table freed after order cancellation:", table.number);
          }
        }
      }

      const cancelledOrder = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }]
      });

      res.json({ message: "Order cancelled successfully", order: cancelledOrder });
    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).json({ message: "Failed to cancel order", error: error.message });
    }
  },

  // Void order - Enhanced cancellation with stock restoration
  voidOrder: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { orderId } = req.params;
      const { reason, restoreStock = true } = req.body;
      const userId = req.user?.id;

      console.log("🚫 Voiding order:", orderId, "with reason:", reason);

      // Find the order with all its items
      const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }],
        transaction
      });

      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if order can be voided
      if (order.status === "cancelled") {
        await transaction.rollback();
        return res.status(400).json({ message: "Order is already cancelled/voided" });
      }

      if (order.status === "paid") {
        await transaction.rollback();
        return res.status(400).json({ message: "Cannot void a paid order. Use refund instead." });
      }

      // Restore stock if requested and order had consumed stock
      const stockRestorations = [];
      if (restoreStock && order.items && order.items.length > 0) {
        console.log("📦 Restoring stock for voided order items...");

        for (const item of order.items) {
          if (item.materialId && item.type === "material") {
            try {
              // Find the material's stock entries to restore stock
              const { StockEntry } = await import("../models/index.js");

              // Find the most recent stock entry for this material
              const stockEntry = await StockEntry.findOne({
                where: { materialId: item.materialId },
                order: [["createdAt", "DESC"]],
                transaction
              });

              if (stockEntry) {
                // Restore the quantity that was consumed
                const restoredQuantity = stockEntry.purchasedIndividualQuantity + item.quantity;
                await stockEntry.update(
                  {
                    purchasedIndividualQuantity: restoredQuantity
                  },
                  { transaction }
                );

                stockRestorations.push({
                  materialId: item.materialId,
                  itemName: item.name,
                  quantityRestored: item.quantity,
                  newStockLevel: restoredQuantity
                });

                console.log(`📈 Restored ${item.quantity} units of ${item.name} to stock`);
              }
            } catch (stockError) {
              console.warn(`⚠️ Could not restore stock for item ${item.name}:`, stockError.message);
            }
          }
        }
      }

      // Update order status to cancelled (voided)
      await order.update(
        {
          status: "cancelled",
          cancelReason: reason || "Order voided",
          cancelledAt: new Date(),
          updatedBy: userId
        },
        { transaction }
      );

      // Free up table when order is voided
      if (order.tableId) {
        const table = await Table.findByPk(order.tableId, { transaction });
        if (table) {
          // Check if there are other active orders for this table
          const otherActiveOrders = await Order.count({
            where: {
              tableId: order.tableId,
              id: { [Op.ne]: order.id },
              status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
            },
            transaction
          });

          if (otherActiveOrders === 0) {
            await table.update({ status: "available" }, { transaction });
            console.log("📋 Table freed after order void:", table.number);
          }
        }
      }

      // Commit the transaction
      await transaction.commit();

      // Get the updated order with items
      const voidedOrder = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }]
      });

      console.log("✅ Order voided successfully:", orderId);

      res.json({
        message: "Order voided successfully",
        order: voidedOrder,
        stockRestorations: stockRestorations.length > 0 ? stockRestorations : null
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Void order error:", error);
      res.status(500).json({ message: "Failed to void order", error: error.message });
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
