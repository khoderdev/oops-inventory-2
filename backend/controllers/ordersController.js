import { Op } from "sequelize";
import { auditOrderOperation } from "../middleware/auditMiddleware.js";
import { Assignment, Material, MenuItem, Order, OrderItem, sequelize, Table, User, PrintJob, Printer, PrinterChannel } from "../models/index.js";
import salesController from "./salesController.js";

export const ordersController = {
  // Create a new order - SIMPLIFIED VERSION
  createOrder: async (req, res) => {
    console.log(" ORDER REQUEST RECEIVED");
    console.log(" Request body keys:", Object.keys(req.body));

    const transaction = await sequelize.transaction();

    try {
      const { orderNumber, orderType, tableId, customerName, customerPhone, customerAddress, notes, items = [], discountType, discountValue, discountAmount, discountReason } = req.body;
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
          discountType: discountType || null,
          discountValue: discountValue || null,
          discountAmount: discountAmount || 0,
          discountReason: discountReason || null,
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
        const tax = 0; // No tax for now - can be configured later
        const discountAmountValue = parseFloat(discountAmount) || 0;
        const total = Math.max(0, subtotal - discountAmountValue);

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
        discountType: order.discountType,
        discountValue: order.discountValue,
        discountAmount: order.discountAmount,
        discountReason: order.discountReason,
        notes: order.notes,
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
        // Get existing items before deletion to track what was removed
        const existingItems = await OrderItem.findAll({
          where: { orderId },
          include: [
            { model: Material, as: "material" },
            { model: MenuItem, as: "menuItem" },
            { model: Assignment, as: "assignment" }
          ],
          transaction
        });

        // Track removed items for void printing
        const removedItems = [];

        console.log(`🔍 Void detection - Existing items (${existingItems.length}):`, 
          existingItems.map(item => `${item.name} (type: ${item.type}, menuItemId: ${item.menuItemId}, materialId: ${item.materialId})`));
        console.log(`🔍 Void detection - New items (${items.length}):`, 
          items.map(item => `${item.name} (type: ${item.type}, menuItemId: ${item.menuItemId}, materialId: ${item.materialId})`));

        // Compare existing items with new items to find removed ones
        existingItems.forEach(existingItem => {
          const stillExists = items.some(newItem => {
            // For menu items: match by menuItemId (convert to string for comparison)
            if (existingItem.menuItemId && newItem.menuItemId) {
              const existingMenuItemId = String(existingItem.menuItemId);
              const newMenuItemId = String(newItem.menuItemId);
              console.log(`🔍 Comparing menu items: existing=${existingMenuItemId}, new=${newMenuItemId}, match=${existingMenuItemId === newMenuItemId}`);
              return existingMenuItemId === newMenuItemId;
            }
            
            // For material items: match by materialId (convert to string for comparison)
            if (existingItem.materialId && newItem.materialId) {
              const existingMaterialId = String(existingItem.materialId);
              const newMaterialId = String(newItem.materialId);
              console.log(`🔍 Comparing materials: existing=${existingMaterialId}, new=${newMaterialId}, match=${existingMaterialId === newMaterialId}`);
              return existingMaterialId === newMaterialId;
            }
            
            // Fallback: match by name (but only if both items are the same type)
            if (existingItem.type === newItem.type && existingItem.name === newItem.name) {
              console.log(`🔍 Comparing by name: existing=${existingItem.name}, new=${newItem.name}, match=true`);
              return true;
            }
            
            return false;
          });

          if (!stillExists) {
            console.log(`🗑️ Item removed for voiding: ${existingItem.name} (type: ${existingItem.type}, qty: ${existingItem.quantity})`);
            console.log(`🔍 Removed item details:`, {
              id: existingItem.id,
              name: existingItem.name,
              type: existingItem.type,
              menuItemId: existingItem.menuItemId,
              materialId: existingItem.materialId,
              assignmentId: existingItem.assignmentId,
              hasMenuItemData: !!existingItem.menuItem,
              hasMaterialData: !!existingItem.material,
              hasAssignmentData: !!existingItem.assignment,
              menuItemName: existingItem.menuItem?.name,
              materialName: existingItem.material?.name,
              assignmentName: existingItem.assignment?.name
            });
            
            // Store the item with its related data properly serialized
            const removedItem = {
              ...existingItem.toJSON(), // Convert Sequelize instance to plain object
              menuItem: existingItem.menuItem ? existingItem.menuItem.toJSON() : null,
              material: existingItem.material ? existingItem.material.toJSON() : null,
              assignment: existingItem.assignment ? existingItem.assignment.toJSON() : null
            };
            
            removedItems.push(removedItem);
          }
        });

        console.log(
          `🗑️ Found ${removedItems.length} removed items for void printing:`,
          removedItems.map(item => `${item.name} (qty: ${item.quantity})`)
        );

        // Remove existing items
        await OrderItem.destroy({ where: { orderId }, transaction });

        // Create new items
        if (items.length > 0) {
          const orderItems = await Promise.all(
            items.map(async item => {
              return await OrderItem.create(
                {
                  orderId: order.id,
                  materialId: item.materialId === "undefined" || item.materialId === undefined ? null : item.materialId,
                  menuItemId: item.menuItemId === "undefined" || item.menuItemId === undefined ? null : item.menuItemId,
                  assignmentId: item.assignmentId === "undefined" || item.assignmentId === undefined ? null : item.assignmentId,
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
          const tax = 0; // No tax for now - can be configured later
          const discountAmountValue = parseFloat(order.discountAmount) || 0;
          const total = Math.max(0, subtotal - discountAmountValue);

          await order.update({ subtotal, tax, total }, { transaction });
        } else {
          await order.update({ subtotal: 0, tax: 0, total: 0 }, { transaction });
        }

        // Generate void print jobs for removed items (after transaction commit)
        if (removedItems.length > 0) {
          // Store removed items for processing after transaction
          req.removedItems = removedItems;
          req.orderForVoidPrint = order;
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

      // Process void print jobs for removed items (after transaction commit)
      if (req.removedItems && req.removedItems.length > 0) {
        try {
          await processVoidPrintJobs(req.removedItems, updatedOrder, userId);
        } catch (voidPrintError) {
          console.error("❌ Failed to process void print jobs:", voidPrintError);
          // Don't fail the order update if void printing fails
        }
      }

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

      console.log(`🔄 Attempting to complete order ${orderId}`);
      console.log(`💰 Payment data:`, JSON.stringify(paymentData, null, 2));

      const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }],
        transaction
      });

      if (!order) {
        console.log(`❌ Order ${orderId} not found`);
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }

      console.log(`📋 Order ${orderId} current status: ${order.status}`);
      console.log(`📋 Order completion details:`, {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        completedAt: order.completedAt,
        saleId: order.saleId
      });

      // Check if order is already completed
      if (order.status === "paid") {
        console.log(`⚠️ Order ${orderId} is already completed (status: paid)`);
        await transaction.rollback();
        return res.status(400).json({
          message: "Order already completed",
          currentStatus: order.status,
          completedAt: order.completedAt,
          saleId: order.saleId
        });
      }

      // Check if order is in a completable state
      const completableStatuses = ["draft", "confirmed", "preparing", "ready", "served"];
      if (!completableStatuses.includes(order.status)) {
        console.log(`⚠️ Order ${orderId} cannot be completed from status: ${order.status}`);
        await transaction.rollback();
        return res.status(400).json({
          message: `Order cannot be completed from status: ${order.status}`,
          currentStatus: order.status,
          allowedStatuses: completableStatuses
        });
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
          .filter(item => item.type === "menu_item")
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

      // Update order with completion details - with race condition protection
      console.log(`🔄 Updating order ${orderId} to completed status`);
      console.log(`💰 Preserving discount data:`, {
        discountType: order.discountType,
        discountValue: order.discountValue,
        discountAmount: order.discountAmount,
        discountReason: order.discountReason
      });

      const updateResult = await Order.update(
        {
          status: "paid",
          paymentMethod: paymentData.paymentMethod,
          paymentAmount: paymentData.paymentAmount,
          change: paymentData.change,
          saleId: saleResult.sale?.id,
          completedAt: new Date(),
          updatedBy: userId,
          // Preserve existing discount data from the order
          discountType: order.discountType,
          discountValue: order.discountValue,
          discountAmount: order.discountAmount,
          discountReason: order.discountReason
        },
        {
          where: {
            id: orderId,
            status: { [Op.ne]: "paid" } // Only update if not already paid
          },
          transaction
        }
      );

      // Check if the update actually happened
      if (updateResult[0] === 0) {
        console.log(`⚠️ Order ${orderId} was already completed by another request`);
        await transaction.rollback();
        return res.status(400).json({
          message: "Order was already completed by another request",
          note: "This can happen if multiple completion requests are made simultaneously"
        });
      }

      console.log(`✅ Order ${orderId} successfully updated to paid status`);

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

      // Extract discount fields if present
      const { discountType, discountValue, discountAmount, discountReason, ...otherData } = updateData;

      const updateFields = {
        ...otherData,
        updatedBy: userId
      };

      // Add discount fields if they exist
      if (discountType !== undefined) updateFields.discountType = discountType;
      if (discountValue !== undefined) updateFields.discountValue = discountValue;
      if (discountAmount !== undefined) updateFields.discountAmount = discountAmount;
      if (discountReason !== undefined) updateFields.discountReason = discountReason;

      await order.update(updateFields);

      // Recalculate total if discount was updated
      if (discountAmount !== undefined) {
        const orderItems = await OrderItem.findAll({ where: { orderId } });
        const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        const tax = 0; // No tax for now
        const discountAmountValue = parseFloat(discountAmount) || 0;
        const total = Math.max(0, subtotal - discountAmountValue);

        await order.update({ subtotal, tax, total });
      }

      res.json({ message: "Order auto-saved successfully" });
    } catch (error) {
      console.error("Auto-save order error:", error);
      res.status(500).json({ message: "Failed to auto-save order", error: error.message });
    }
  }
};

/**
 * Process void print jobs for removed items during order updates
 */
async function processVoidPrintJobs(removedItems, order, userId) {
  console.log(`🖨️ Processing void print jobs for ${removedItems.length} removed items`);
  console.log(`🔍 Removed items details:`, removedItems.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    menuItemId: item.menuItemId,
    materialId: item.materialId,
    assignmentId: item.assignmentId,
    hasMenuItemData: !!item.menuItem,
    hasMaterialData: !!item.material,
    hasAssignmentData: !!item.assignment
  })));

  try {
    // Group removed items by their assigned printer
    const itemsByPrinter = new Map();

    for (const item of removedItems) {
      let printerId = null;

      // Determine printer assignment based on item type
      if (item.menuItemId && item.menuItem && item.menuItem.printerId) {
        // Menu item - use its specific printer assignment
        printerId = item.menuItem.printerId;
        console.log(`📋 Menu item ${item.name} assigned to printer: ${printerId}`);
      } else if (item.materialId && item.material && item.material.printerId) {
        // Material item - use its specific printer assignment
        printerId = item.material.printerId;
        console.log(`🥘 Material item ${item.name} assigned to printer: ${printerId}`);
      } else if (item.assignmentId && item.assignment && item.assignment.printerId) {
        // Assignment item - use printer from assignment
        printerId = item.assignment.printerId;
        console.log(`📝 Assignment item ${item.name} assigned to printer: ${printerId}`);
      }

      // If no specific printer assigned, use item type-based fallback
      if (!printerId) {
        // Fallback based on item type - this should be improved with proper categories in DB
        if (item.type === 'material') {
          // Materials are typically beverages/drinks - assign to Bar Station
          printerId = 3; // Bar Station
          console.log(`🥤 Material item ${item.name} assigned to Bar Station (printer 3) - fallback`);
        } else if (item.type === 'menu_item') {
          // Menu items are typically food - assign to Kitchen Station
          printerId = 2; // Kitchen Station
          console.log(`🍳 Menu item ${item.name} assigned to Kitchen Station (printer 2) - fallback`);
        } else {
          // Default fallback
          printerId = 2; // Kitchen Station (default)
          console.log(`📋 Item ${item.name} assigned to Kitchen Station (printer 2) - default fallback`);
        }
        
        console.log(`⚠️ No specific printer assignment found for ${item.name} (${item.type}), using fallback logic`);
      }

      // Group items by printer
      if (!itemsByPrinter.has(printerId)) {
        itemsByPrinter.set(printerId, []);
      }
      itemsByPrinter.get(printerId).push(item);
    }

    console.log(`📊 Grouped void items into ${itemsByPrinter.size} printer groups`);

    // Create void print jobs for each printer group
    const printJobs = [];
    
    for (const [printerId, printerItems] of itemsByPrinter) {
      try {
        // Get printer details
        const printer = await Printer.findByPk(printerId, {
          include: [{ model: PrinterChannel, as: "channel" }]
        });

        if (!printer || !printer.isActive) {
          console.log(`⚠️ Skipping void print for printer ${printerId} - not found or inactive`);
          continue;
        }

        // Debug printer information
        console.log(`🖨️ Printer details for ID ${printerId}:`, {
          id: printer.id,
          name: printer.name,
          type: printer.type,
          isActive: printer.isActive,
          channelId: printer.channelId,
          channel: printer.channel ? {
            id: printer.channel.id,
            name: printer.channel.name,
            type: printer.channel.type
          } : null
        });

        // Format void items for thermal printer
        const voidContent = formatVoidItemsForThermalPrinter(printerItems, order, printer);

        // Create print job
        const printJob = await PrintJob.create({
          printerId: printer.id,
          channelId: printer.channelId,
          jobType: "void",
          content: {
            format: "text",
            encoding: "utf8",
            rawContent: voidContent,
            data: {},
            template: null
          },
          settings: {
            copies: 1,
            priority: "high" // High priority for void items
          },
          maxAttempts: 3,
          attempts: 0,
          status: "pending",
          timestamps: {
            created: new Date(),
            queued: null,
            started: null,
            completed: null,
            failed: null,
            cancelled: null
          },
          metrics: {
            dataSize: voidContent.length,
            printTime: null,
            queueTime: null,
            totalTime: null
          },
          metadata: {
            source: "api",
            userId: userId,
            orderId: order.id,
            orderNumber: order.orderNumber,
            voidedItems: printerItems.map(item => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              type: item.type
            }))
          }
        });

        printJobs.push(printJob);
        console.log(`✅ Created void print job ${printJob.id} for printer ${printer.name} with ${printerItems.length} items`);

      } catch (printerError) {
        console.error(`❌ Failed to create void print job for printer ${printerId}:`, printerError);
      }
    }

    console.log(`🖨️ Successfully created ${printJobs.length} void print jobs`);
    return printJobs;

  } catch (error) {
    console.error("❌ Error processing void print jobs:", error);
    throw error;
  }
}

/**
 * Format void items for thermal printer output
 */
function formatVoidItemsForThermalPrinter(items, order, printer) {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  // Get printer name from the printer parameter and map to proper station names
  let stationName = "KITCHEN";
  
  if (printer) {
    // Map printer IDs to proper station names
    const stationMap = {
      2: "KITCHEN",
      3: "BAR", 
      4: "ARGUILE"
    };
    
    // Use mapped station name if available, otherwise try to extract from printer name
    if (stationMap[printer.id]) {
      stationName = stationMap[printer.id];
    } else if (printer.name) {
      // Try to extract meaningful name from printer name
      const name = printer.name.toUpperCase();
      if (name.includes('BAR')) {
        stationName = "BAR";
      } else if (name.includes('ARGUILE') || name.includes('SHISHA')) {
        stationName = "ARGUILE";
      } else if (name.includes('KITCHEN') || name.includes('FOOD')) {
        stationName = "KITCHEN";
      } else {
        // Fallback: use printer name but clean it up
        stationName = name.replace(/PRINTER\s*\d+/i, '').trim() || "KITCHEN";
      }
    }
  }
  
  console.log(`🖨️ Formatting void items for printer ID ${printer?.id} (${printer?.name}) -> ${stationName} STATION`);

  // 80mm thermal receipt formatting (48 characters wide)
  let content = "";

  // Center text helper function
  const centerText = (text, width = 48) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  };

  try {
    // Header with station name
    content += centerText(`${stationName} STATION`) + "\n";
    
    // **VOID** indicator - make it prominent
    content += centerText("*** VOID ITEMS ***") + "\n";
    content += centerText("================") + "\n";

    // Order details
    content += `Order #: ${order.orderNumber}\n`;
    content += `Date: ${date}\n`;
    content += `Time: ${time}\n`;
    content += `Type: ${order.orderType.toUpperCase()}\n`;

    if (order.table) {
      content += `Table: ${order.table.number}\n`;
    }

    content += centerText("VOIDED ITEMS") + "\n";

    // Group items by name and sum quantities
    const groupedItems = items.reduce((acc, item) => {
      const key = item.name;
      if (acc[key]) {
        acc[key].quantity += item.quantity;
      } else {
        acc[key] = { ...item };
      }
      return acc;
    }, {});

    // List voided items with emphasis
    Object.values(groupedItems).forEach(item => {
      let itemName = item.name;
      
      // Debug logging for item name resolution
      console.log(`🔍 Formatting void item:`, {
        itemName: item.name,
        type: item.type,
        menuItemId: item.menuItemId,
        materialId: item.materialId,
        hasMenuItemData: !!item.menuItem,
        hasMaterialData: !!item.material
      });
      
      // If no name, try to get it from related data
      if (!itemName || itemName === "Unknown Item") {
        if (item.menuItem && item.menuItem.name) {
          itemName = item.menuItem.name;
          console.log(`📋 Using menu item name: ${itemName}`);
        } else if (item.material && item.material.name) {
          itemName = item.material.name;
          console.log(`🥘 Using material name: ${itemName}`);
        } else if (item.assignment && item.assignment.name) {
          itemName = item.assignment.name;
          console.log(`📝 Using assignment name: ${itemName}`);
        } else {
          itemName = "Unknown Item";
          console.log(`❌ Could not resolve item name, using fallback`);
        }
      }
      
      const quantity = item.quantity || 1;
      
      // Bold text for emphasis (ESC/POS command)
      content += "\x1B\x45"; // ESC E - Bold on
      content += `            ${quantity}x ${itemName}\n`;
      content += "\x1B\x46"; // ESC F - Bold off
    });

    // Only show item count - no monetary totals for void items
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    content += "\n";
    content += centerText("================") + "\n";
    content += centerText(`Total Voided: ${itemCount}`) + "\n";
    content += centerText("*** DO NOT PREPARE ***") + "\n";
    content += "\n";
    content += "\n";
    content += "\n";
    content += "\n";
    content += "\n";

    // Add thermal printer paper cut command (ESC/POS)
    content += "\x1B\x69"; // ESC i - Full cut command

    return content;
  } catch (error) {
    console.error('Error formatting void items for printer:', error);
    
    // Fallback to simple text format
    let fallbackContent = "";
    fallbackContent += centerText(`${stationName} STATION`) + "\n";
    fallbackContent += centerText("*** VOID ITEMS ***") + "\n";
    fallbackContent += `Order #: ${order.orderNumber}\n`;
    fallbackContent += `Date: ${date}\n`;
    fallbackContent += `Time: ${time}\n`;
    fallbackContent += `Type: ${order.orderType.toUpperCase()}\n`;
    fallbackContent += centerText("VOIDED ITEMS") + "\n";
    
    items.forEach(item => {
      let itemName = item.name;
      
      // If no name, try to get it from related data
      if (!itemName || itemName === "Unknown Item") {
        if (item.menuItem && item.menuItem.name) {
          itemName = item.menuItem.name;
        } else if (item.material && item.material.name) {
          itemName = item.material.name;
        } else if (item.assignment && item.assignment.name) {
          itemName = item.assignment.name;
        } else {
          itemName = "Unknown Item";
        }
      }
      
      fallbackContent += centerText(`${item.quantity}x ${itemName}`) + "\n";
    });
    
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    fallbackContent += centerText(`Total Voided: ${itemCount}`) + "\n";
    fallbackContent += centerText("*** DO NOT PREPARE ***") + "\n";
    fallbackContent += "\n\n\n\n\n";
    
    return fallbackContent;
  }
}
