import { Op } from "sequelize";
import { auditOrderOperation } from "../middleware/auditMiddleware.js";
import { Assignment, Material, MenuItem, MenuItemIngredient, Order, OrderItem, sequelize, StockEntry, Table, User, PrintJob, Printer, PrinterChannel } from "../models/index.js";
import salesController from "./salesController.js";
import { generateSequentialOrderNumber } from "../utils/orderNumberGenerator.js";

// Helper function to deduct ingredient stock when menu items are sold
const deductIngredientStock = async (menuItemId, orderQuantity, transaction) => {
  const deductionId = Math.random().toString(36).substr(2, 9);
  try {
    console.log(`🔍 [${deductionId}] Deducting stock for menu item ID: ${menuItemId}, quantity: ${orderQuantity}`);

    // Get menu item with its ingredients
    const menuItem = await MenuItem.findByPk(menuItemId, {
      include: [
        {
          model: MenuItemIngredient,
          as: "menuItemIngredients",
          include: [
            {
              model: Material,
              as: "material"
            }
          ]
        }
      ],
      transaction
    });

    if (!menuItem) {
      console.log(`❌ Menu item not found: ${menuItemId}`);
      return;
    }

    // Check if menu item has ingredients
    if (!menuItem.menuItemIngredients || menuItem.menuItemIngredients.length === 0) {
      console.log(`🍾 No ingredients found for menu item "${menuItem.name}" - treating as direct material consumption`);

      // For menu items without ingredients (like beverages), try to find a material with the same name
      const matchingMaterial = await Material.findOne({
        where: {
          name: { [Op.iLike]: `%${menuItem.name}%` }
        },
        transaction
      });

      if (matchingMaterial) {
        console.log(`🎯 Found matching material: ${matchingMaterial.name} (ID: ${matchingMaterial.id}) for menu item "${menuItem.name}"`);

        // Deduct stock directly from this material
        await deductStockFromMaterial(matchingMaterial.id, orderQuantity, menuItem.name, transaction);
      } else {
        console.log(`⚠️ No matching material found for menu item "${menuItem.name}" - skipping stock deduction`);
      }
      return;
    }

    console.log(`📋 [${deductionId}] Found ${menuItem.menuItemIngredients.length} ingredients for "${menuItem.name}"`);

    // Process each ingredient
    for (const ingredient of menuItem.menuItemIngredients) {
      const materialId = ingredient.materialId;
      const requiredQuantity = ingredient.quantity * orderQuantity;
      const unit = ingredient.unit;

      console.log(`🥄 [${deductionId}] Processing ingredient: ${ingredient.material?.name || "Unknown"} - Required: ${requiredQuantity} ${unit}`);
      console.log(`📊 [${deductionId}] Ingredient details: materialId=${materialId}, quantity=${ingredient.quantity}, unit=${ingredient.unit}, orderQuantity=${orderQuantity}`);
      console.log(`🔍 [${deductionId}] About to search for stock entries for material ID: ${materialId}`);

      // Find available stock entries for this material (FIFO - oldest first)
      const stockEntries = await StockEntry.findAll({
        where: {
          materialId: materialId,
          [Op.or]: [
            {
              purchasedIndividualQuantity: {
                [Op.gt]: 0 // Only positive individual quantities
              }
            },
            {
              purchasedIndividualQuantity: null,
              purchasedQuantity: {
                [Op.gt]: 0 // Only positive purchased quantities when individual is null
              }
            }
          ]
        },
        order: [["purchaseDate", "ASC"]], // FIFO ordering
        transaction
      });

      console.log(`📦 [${deductionId}] Stock query result: Found ${stockEntries.length} stock entries for material ID: ${materialId}`);
      
      if (stockEntries.length === 0) {
        console.log(`⚠️ [${deductionId}] No stock available for material ID: ${materialId} (${ingredient.material?.name})`);
        continue;
      }

      let remainingToDeduct = requiredQuantity;
      console.log(`📦 [${deductionId}] Processing ${stockEntries.length} stock entries for material ID: ${materialId}`);

      // Deduct from stock entries using FIFO
      for (const stockEntry of stockEntries) {
        if (remainingToDeduct <= 0) break;

        const availableQuantity = stockEntry.purchasedIndividualQuantity || stockEntry.purchasedQuantity || 0;
        const deductAmount = Math.min(remainingToDeduct, availableQuantity);

        console.log(`📊 Stock Entry Details: ID=${stockEntry.id}, purchasedQuantity=${stockEntry.purchasedQuantity}, purchasedUnit=${stockEntry.purchasedUnit}, purchasedIndividualQuantity=${stockEntry.purchasedIndividualQuantity}, purchasedIndividualUnit=${stockEntry.purchasedIndividualUnit}`);

        if (deductAmount <= 0) {
          console.log(`⚠️ No quantity to deduct from stock entry ID: ${stockEntry.id}`);
          continue;
        }

        console.log(`📉 [${deductionId}] Deducting ${deductAmount} ${unit} from stock entry ID: ${stockEntry.id} (Available: ${availableQuantity})`);

        // Update stock entry quantity
        const newQuantity = Math.max(0, availableQuantity - deductAmount); // Ensure non-negative

        if (stockEntry.purchasedIndividualQuantity !== null && stockEntry.purchasedIndividualQuantity !== undefined) {
          await stockEntry.update(
            {
              purchasedIndividualQuantity: newQuantity
            },
            { transaction }
          );
        } else {
          await stockEntry.update(
            {
              purchasedQuantity: newQuantity
            },
            { transaction }
          );
        }

        remainingToDeduct -= deductAmount;
        console.log(`✅ Updated stock entry ID: ${stockEntry.id} - New quantity: ${newQuantity}, Remaining to deduct: ${remainingToDeduct}`);
      }

      if (remainingToDeduct > 0) {
        console.log(`⚠️ Insufficient stock for ${ingredient.material?.name}. Short by: ${remainingToDeduct} ${unit}`);
        // Note: We continue processing rather than throwing an error to allow partial fulfillment
      } else {
        console.log(`✅ Successfully deducted all required stock for ${ingredient.material?.name}`);
      }
    }

    console.log(`🎉 Stock deduction completed for menu item: ${menuItem.name}`);
  } catch (error) {
    console.error(`❌ Error deducting ingredient stock for menu item ID ${menuItemId}:`, error);
    throw error;
  }
};

// Helper function to deduct stock directly from a material (for menu items without ingredients)
const deductStockFromMaterial = async (materialId, requiredQuantity, itemName, transaction) => {
  try {
    console.log(`🥤 Deducting ${requiredQuantity} units directly from material ID: ${materialId} for "${itemName}"`);

    // Find available stock entries for this material (FIFO - oldest first)
    const stockEntries = await StockEntry.findAll({
      where: {
        materialId: materialId,
        [Op.or]: [
          {
            purchasedIndividualQuantity: {
              [Op.gt]: 0 // Only positive individual quantities
            }
          },
          {
            purchasedIndividualQuantity: null,
            purchasedQuantity: {
              [Op.gt]: 0 // Only positive purchased quantities when individual is null
            }
          }
        ]
      },
      order: [["purchaseDate", "ASC"]], // FIFO ordering
      transaction
    });

    if (stockEntries.length === 0) {
      console.log(`⚠️ No stock available for material ID: ${materialId} (${itemName})`);
      return;
    }

    let remainingToDeduct = requiredQuantity;
    console.log(`📦 Found ${stockEntries.length} stock entries for material ID: ${materialId}`);

    // Deduct from stock entries using FIFO
    for (const stockEntry of stockEntries) {
      if (remainingToDeduct <= 0) break;

      const availableQuantity = stockEntry.purchasedIndividualQuantity || stockEntry.purchasedQuantity || 0;
      const deductAmount = Math.min(remainingToDeduct, availableQuantity);

      console.log(`📊 Stock Entry Details: ID=${stockEntry.id}, purchasedQuantity=${stockEntry.purchasedQuantity}, purchasedUnit=${stockEntry.purchasedUnit}, purchasedIndividualQuantity=${stockEntry.purchasedIndividualQuantity}, purchasedIndividualUnit=${stockEntry.purchasedIndividualUnit}`);

      if (deductAmount <= 0) {
        console.log(`⚠️ No quantity to deduct from stock entry ID: ${stockEntry.id}`);
        continue;
      }

      console.log(`📉 Deducting ${deductAmount} from stock entry ID: ${stockEntry.id} (Available: ${availableQuantity})`);

      // Update stock entry quantity
      const newQuantity = Math.max(0, availableQuantity - deductAmount); // Ensure non-negative

      if (stockEntry.purchasedIndividualQuantity !== null && stockEntry.purchasedIndividualQuantity !== undefined) {
        await stockEntry.update(
          {
            purchasedIndividualQuantity: newQuantity
          },
          { transaction }
        );
      } else {
        await stockEntry.update(
          {
            purchasedQuantity: newQuantity
          },
          { transaction }
        );
      }

      remainingToDeduct -= deductAmount;
      console.log(`✅ Updated stock entry ID: ${stockEntry.id} - New quantity: ${newQuantity}, Remaining to deduct: ${remainingToDeduct}`);
    }

    if (remainingToDeduct > 0) {
      console.log(`⚠️ Insufficient stock for ${itemName}. Short by: ${remainingToDeduct} units`);
      // Note: We continue processing rather than throwing an error to allow partial fulfillment
    } else {
      console.log(`✅ Successfully deducted all required stock for ${itemName}`);
    }
  } catch (error) {
    console.error(`❌ Error deducting stock for material ID ${materialId}:`, error);
    throw error;
  }
};

export const ordersController = {
  createOrder: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { orderNumber, orderType, tableId, customerName, customerPhone, customerAddress, notes, items = [], discountType, discountValue, discountAmount, discountReason } = req.body;
      const userId = req.user?.id;
      let finalOrderNumber = orderNumber;
      if (!finalOrderNumber) {
        try {
          finalOrderNumber = await generateSequentialOrderNumber();
        } catch (error) {
          console.error("Error generating order number:", error);
          // Better fallback - use timestamp to avoid duplicates
          const timestamp = Date.now().toString().slice(-4);
          finalOrderNumber = `ORD-${timestamp}`;
        }
      }

      // Check for duplicate orders within the last 10 seconds to prevent multiple API calls
      const tenSecondsAgo = new Date(Date.now() - 10000);
      
      // Create a more comprehensive duplicate check
      const duplicateCheckWhere = {
        createdBy: userId,
        orderType: orderType || "takeaway",
        createdAt: {
          [Op.gte]: tenSecondsAgo
        }
      };
      
      // Only add tableId to where clause if it's not null
      if (tableId !== null && tableId !== undefined) {
        duplicateCheckWhere.tableId = tableId;
      } else {
        duplicateCheckWhere.tableId = null;
      }

      const recentOrder = await Order.findOne({
        where: duplicateCheckWhere,
        include: [{
          model: OrderItem,
          as: 'items'
        }],
        order: [['createdAt', 'DESC']],
        transaction
      });

      // If we found a recent order with the same items, return it instead of creating duplicate
      if (recentOrder && items.length > 0 && recentOrder.items.length === items.length) {
        const itemsMatch = items.every(item => 
          recentOrder.items.some(orderItem => 
            orderItem.menuItemId === item.menuItemId &&
            orderItem.materialId === item.materialId &&
            orderItem.name === item.name &&
            orderItem.quantity === item.quantity &&
            Math.abs(parseFloat(orderItem.unitPrice) - parseFloat(item.unitPrice)) < 0.01
          )
        );

        if (itemsMatch) {
          console.log(`🔄 Duplicate order detected - returning existing order ${recentOrder.orderNumber} (ID: ${recentOrder.id}) instead of creating new one`);
          console.log(`🔄 Duplicate check details: userId=${userId}, orderType=${orderType}, tableId=${tableId}, itemsCount=${items.length}`);
          await transaction.commit();
          return res.status(200).json({
            success: true,
            data: recentOrder,
            message: "Order already exists"
          });
        }
      }

      // Add a small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
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
      if (tableId) {
        const table = await Table.findByPk(tableId, { transaction });
        if (table && table.status === "available") {
          await table.update({ status: "opened" }, { transaction });
        }
      }
      if (items.length > 0) {
        const orderItems = await Promise.all(
          items.map(async item => {
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
            const orderItem = await OrderItem.create(orderItemData, { transaction });

            // Deduct ingredient stock for menu items
            if (item.type === "menu_item" && item.menuItemId) {
              console.log(`🍽️ Processing menu item for stock deduction: ${item.name} (ID: ${item.menuItemId}), Quantity: ${item.quantity}`);
              try {
                await deductIngredientStock(item.menuItemId, item.quantity, transaction);
                console.log(`✅ Stock deduction completed for menu item: ${item.name}`);
              } catch (stockError) {
                console.error(`❌ Stock deduction failed for menu item ${item.name}:`, stockError);
                // Don't throw error to prevent order creation failure
              }
            }

            return orderItem;
          })
        );
        const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        const tax = 0; // No tax for now - can be configured later
        const discountAmountValue = parseFloat(discountAmount) || 0;
        const total = Math.max(0, subtotal - discountAmountValue);
        await order.update({ subtotal, tax, total }, { transaction });
      }
      await transaction.commit();
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

  getOrders: async (req, res) => {
    try {
      const { status, orderType, tableId, startDate, endDate, limit = 50, offset = 0, orderBy = "createdAt", order = "DESC" } = req.query;
      const whereClause = {};
      if (status) whereClause.status = status;
      // Always exclude staff/employee order types from general listing
      const excludedTypes = ["employees", "staff"];
      if (orderType) {
        // If client explicitly asks for excluded types, return empty list
        if (excludedTypes.includes(String(orderType).toLowerCase())) {
          return res.json({ data: [] });
        }
        whereClause.orderType = orderType;
      } else {
        // Postgres enum-safe filter: cast enum to text then NOT IN
        whereClause[Op.and] = [...(whereClause[Op.and] || []), sequelize.where(sequelize.cast(sequelize.col("orderType"), "text"), { [Op.notIn]: excludedTypes })];
      }
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
        ],
        order: [[orderBy, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
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
      // Exclude staff/employee orders from this endpoint
      if (["employees", "staff"].includes(String(order.orderType).toLowerCase())) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ data: order });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to fetch order", error: error.message });
    }
  },

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
      const originalOrder = order.toJSON();
      const oldTableId = order.tableId;
      const newTableId = tableId !== undefined ? tableId : order.tableId;
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
      if (oldTableId !== newTableId) {
        if (oldTableId) {
          const oldTable = await Table.findByPk(oldTableId, { transaction });
          if (oldTable) {
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
            }
          }
        }
        if (newTableId) {
          const newTable = await Table.findByPk(newTableId, { transaction });
          if (newTable && newTable.status === "available") {
            await newTable.update({ status: "opened" }, { transaction });
          }
        }
      }
      if (items) {
        const existingItems = await OrderItem.findAll({
          where: { orderId },
          include: [
            { model: Material, as: "material" },
            { model: MenuItem, as: "menuItem" },
            { model: Assignment, as: "assignment" }
          ],
          transaction
        });
        const removedItems = [];
        existingItems.forEach(existingItem => {
          const stillExists = items.some(newItem => {
            if (existingItem.menuItemId && newItem.menuItemId) {
              const existingMenuItemId = String(existingItem.menuItemId);
              const newMenuItemId = String(newItem.menuItemId);
              return existingMenuItemId === newMenuItemId;
            }
            if (existingItem.materialId && newItem.materialId) {
              const existingMaterialId = String(existingItem.materialId);
              const newMaterialId = String(newItem.materialId);
              return existingMaterialId === newMaterialId;
            }
            if (existingItem.type === newItem.type && existingItem.name === newItem.name) {
              return true;
            }
            return false;
          });

          if (!stillExists) {
            const removedItem = {
              ...existingItem.toJSON(),
              menuItem: existingItem.menuItem ? existingItem.menuItem.toJSON() : null,
              material: existingItem.material ? existingItem.material.toJSON() : null,
              assignment: existingItem.assignment ? existingItem.assignment.toJSON() : null
            };
            removedItems.push(removedItem);
          }
        });
        await OrderItem.destroy({ where: { orderId }, transaction });
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
          const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
          const tax = 0;
          const discountAmountValue = parseFloat(order.discountAmount) || 0;
          const total = Math.max(0, subtotal - discountAmountValue);
          await order.update({ subtotal, tax, total }, { transaction });
        } else {
          await order.update({ subtotal: 0, tax: 0, total: 0 }, { transaction });
        }
        if (removedItems.length > 0) {
          req.removedItems = removedItems;
          req.orderForVoidPrint = order;
        }
      }
      await transaction.commit();
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
      if (req.removedItems && req.removedItems.length > 0) {
        try {
          await processVoidPrintJobs(req.removedItems, updatedOrder, userId);
        } catch (voidPrintError) {
          console.error("❌ Failed to process void print jobs:", voidPrintError);
        }
      }
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

  // Add items to existing order
  addOrderItems: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { orderId } = req.params;
      const { items } = req.body;
      const userId = req.user?.id;

      // Find the existing order
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }

      // Validate that items array is provided and not empty
      if (!items || !Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "Items array is required and cannot be empty" });
      }

      console.log(`📋 Adding ${items.length} items to order ${orderId}`);

      // Create new order items
      const newOrderItems = await Promise.all(
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

      // Recalculate order totals
      const allOrderItems = await OrderItem.findAll({
        where: { orderId: order.id },
        transaction
      });

      const subtotal = allOrderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
      const tax = 0; // No tax for now - can be configured later
      const discountAmountValue = parseFloat(order.discountAmount) || 0;
      const total = Math.max(0, subtotal - discountAmountValue);

      await order.update(
        {
          subtotal,
          tax,
          total,
          updatedBy: userId
        },
        { transaction }
      );

      await transaction.commit();

      // Fetch updated order with all items
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

      console.log(`✅ Successfully added ${newOrderItems.length} items to order ${orderId}`);

      // Log successful operation
      if (userId) {
        await auditOrderOperation(userId, "ADD_ITEMS", updatedOrder.toJSON(), null, req);
      }

      res.json({
        message: `Successfully added ${newOrderItems.length} items to order`,
        order: updatedOrder
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Add order items error:", error);
      res.status(500).json({ message: "Failed to add items to order", error: error.message });
    }
  },

  // Remove/void specific items from an existing order
  removeOrderItems: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { orderId } = req.params;
      const { itemIds } = req.body || {};
      const userId = req.user?.id;

      // Validate
      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "itemIds array is required and cannot be empty" });
      }

      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }

      // Delete requested items limited to this orderId
      const deletedCount = await OrderItem.destroy({
        where: { orderId, id: itemIds },
        transaction
      });

      // Recalculate totals from remaining items
      const remainingItems = await OrderItem.findAll({ where: { orderId }, transaction });
      const subtotal = remainingItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
      const tax = 0; // configurable later
      const discountAmountValue = parseFloat(order.discountAmount) || 0;
      const total = Math.max(0, subtotal - discountAmountValue);

      await order.update({ subtotal, tax, total, updatedBy: userId }, { transaction });

      await transaction.commit();

      // Return updated order with relations
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

      if (userId) {
        await auditOrderOperation(userId, "REMOVE_ITEMS", updatedOrder.toJSON(), null, req);
      }

      return res.json({
        message: `Successfully removed ${deletedCount} item(s) from order`,
        order: updatedOrder
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Remove order items error:", error);
      return res.status(500).json({ message: "Failed to remove items from order", error: error.message });
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

      // Check if order is already completed
      if (order.status === "paid") {
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
        await transaction.rollback();
        return res.status(400).json({
          message: `Order cannot be completed from status: ${order.status}`,
          currentStatus: order.status,
          allowedStatuses: completableStatuses
        });
      }
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
      // Add flag to indicate this sale comes from an existing order (stock already deducted)
      saleData.fromExistingOrder = true;
      const mockReq = { body: saleData, user: { id: userId } };
      const mockRes = {
        status: code => mockRes,
        json: data => data
      };

      const saleResult = await new Promise((resolve, reject) => {
        mockRes.json = data => {
          if (data.error || data.message?.includes("failed")) {
            reject(new Error(`Sale creation failed: ${data.error || data.message}`));
          } else {
            resolve(data);
          }
        };

        salesController.createSales(mockReq, mockRes).catch(error => {
          reject(error);
        });
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
        await transaction.rollback();
        return res.status(400).json({
          message: "Order was already completed by another request",
          note: "This can happen if multiple completion requests are made simultaneously"
        });
      }

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
        const { MenuItem, MenuItemIngredient, StockEntry, Material } = await import("../models/index.js");

        for (const item of order.items) {
          // Handle direct material items
          if (item.materialId && item.type === "material") {
            try {
              const material = await Material.findByPk(item.materialId, { transaction });
              if (!material) {
                console.warn(`Material ${item.materialId} not found during void`);
                continue;
              }

              // Calculate restoration quantities
              let restorationQuantity = item.quantity;
              if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
                if (item.unit !== material.baseUnit) {
                  restorationQuantity = item.quantity * material.packageQuantity;
                }
              }

              // Find stock entries for this material (LIFO - most recent first)
              const stockEntries = await StockEntry.findAll({
                where: { materialId: item.materialId },
                order: [["createdAt", "DESC"]],
                transaction
              });

              if (stockEntries.length === 0) {
                // Create new stock entry if none exist
                const newStockEntry = await StockEntry.create({
                  materialId: material.id,
                  supplier: "RESTORED - From Order Void",
                  purchasedQuantity: 0,
                  purchasedUnit: material.baseUnit,
                  purchasedIndividualQuantity: restorationQuantity,
                  purchasedIndividualUnit: material.baseUnit,
                  costPerPurchasedUnit: 0,
                  totalCost: 0,
                  purchaseDate: new Date(),
                  expiryDate: null
                }, { transaction });

                stockRestorations.push({
                  type: "material_item",
                  materialId: material.id,
                  materialName: material.name,
                  stockEntryId: newStockEntry.id,
                  quantityRestored: restorationQuantity,
                  unit: material.baseUnit,
                  action: "Created new stock entry",
                  oldStockQuantity: 0,
                  newStockQuantity: restorationQuantity
                });
              } else {
                // Restore to most recent stock entry
                const stockEntry = stockEntries[0];
                const oldQuantity = stockEntry.purchasedIndividualQuantity || 0;
                const newQuantity = Math.round(oldQuantity + restorationQuantity);

                await stockEntry.update({
                  purchasedIndividualQuantity: newQuantity
                }, { transaction });

                stockRestorations.push({
                  type: "material_item",
                  materialId: material.id,
                  materialName: material.name,
                  stockEntryId: stockEntry.id,
                  quantityRestored: restorationQuantity,
                  unit: material.baseUnit,
                  oldStockQuantity: oldQuantity,
                  newStockQuantity: newQuantity
                });
              }
            } catch (stockError) {
              console.warn(`⚠️ Could not restore stock for material item ${item.name}:`, stockError.message);
            }
          }
          // Handle menu items with ingredients
          else if (item.menuItemId && item.type === "menu_item") {
            try {
              // Find the menu item with its ingredients
              const menuItem = await MenuItem.findByPk(item.menuItemId, {
                include: [{
                  model: MenuItemIngredient,
                  as: "menuItemIngredients",
                  include: [{ model: Material, as: "material" }]
                }],
                transaction
              });

              if (!menuItem) {
                console.warn(`Menu item ${item.menuItemId} not found during void`);
                continue;
              }

              console.log(`🔄 Restoring stock for menu item "${item.name}" with ${menuItem.menuItemIngredients?.length || 0} ingredients`);

              // Restore each ingredient
              if (menuItem.menuItemIngredients && menuItem.menuItemIngredients.length > 0) {
                for (const ingredient of menuItem.menuItemIngredients) {
                  const material = ingredient.material;
                  const totalIngredientQuantity = ingredient.quantity * item.quantity;

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

                  // Find stock entries for this material (LIFO - most recent first)
                  const stockEntries = await StockEntry.findAll({
                    where: { materialId: material.id },
                    order: [["createdAt", "DESC"]],
                    transaction
                  });

                  if (stockEntries.length === 0) {
                    // Create new stock entry if none exist
                    const newStockEntry = await StockEntry.create({
                      materialId: material.id,
                      supplier: "RESTORED - From Order Void",
                      purchasedQuantity: 0,
                      purchasedUnit: material.baseUnit,
                      purchasedIndividualQuantity: restorationQuantityInBaseUnits,
                      purchasedIndividualUnit: material.baseUnit,
                      costPerPurchasedUnit: 0,
                      totalCost: 0,
                      purchaseDate: new Date(),
                      expiryDate: null
                    }, { transaction });

                    stockRestorations.push({
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
                    // Restore to most recent stock entry
                    const stockEntry = stockEntries[0];
                    const oldQuantity = stockEntry.purchasedIndividualQuantity || 0;
                    const newQuantity = Math.round(oldQuantity + restorationQuantityInBaseUnits);

                    await stockEntry.update({
                      purchasedIndividualQuantity: newQuantity
                    }, { transaction });

                    stockRestorations.push({
                      type: "menu_item_ingredient",
                      materialId: material.id,
                      materialName: material.name,
                      menuItemId: menuItem.id,
                      menuItemName: menuItem.name,
                      stockEntryId: stockEntry.id,
                      quantityRestored: restorationQuantityInBaseUnits,
                      unit: material.baseUnit,
                      oldStockQuantity: oldQuantity,
                      newStockQuantity: newQuantity
                    });
                  }

                  console.log(`✅ Restored ${restorationQuantityInBaseUnits} units of ${material.name} for ${menuItem.name}`);
                }
              }
            } catch (menuItemError) {
              console.warn(`⚠️ Could not restore stock for menu item ${item.name}:`, menuItemError.message);
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
          }
        }
      }
      // Commit the transaction
      await transaction.commit();
      // Get the updated order with items
      const voidedOrder = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }]
      });

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
          status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] },
          [Op.and]: [sequelize.where(sequelize.cast(sequelize.col("orderType"), "text"), { [Op.notIn]: ["employees", "staff"] })]
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
        where: {
          status: "draft",
          [Op.and]: [sequelize.where(sequelize.cast(sequelize.col("orderType"), "text"), { [Op.notIn]: ["employees", "staff"] })]
        },
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

  // Get staff/employee orders only
  getStaffOrders: async (req, res) => {
    try {
      const { status, tableId, startDate, endDate, limit = 50, offset = 0, orderBy = "createdAt", order = "DESC" } = req.query;
      const whereClause = {};
      if (status) whereClause.status = status;
      if (tableId) whereClause.tableId = tableId;
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }
      // Postgres enum-safe filter: cast enum to text then IN
      whereClause[Op.and] = [...(whereClause[Op.and] || []), sequelize.where(sequelize.cast(sequelize.col("orderType"), "text"), { [Op.in]: ["employees", "staff"] })];

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
        ],
        order: [[orderBy, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({ data: orders });
    } catch (error) {
      console.error("Get staff orders error:", error);
      res.status(500).json({ message: "Failed to fetch staff orders", error: error.message });
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
 * Fully dynamic printer assignment based on database configuration
 */
async function processVoidPrintJobs(removedItems, order, userId) {
  try {
    console.log(`🔄 Processing void print jobs for ${removedItems.length} removed items`);

    // Group removed items by their assigned printer
    const itemsByPrinter = new Map();
    const printerAssignmentCache = new Map();

    for (const item of removedItems) {
      let printerId = null;

      // Determine printer assignment based on item type with comprehensive fallback
      printerId = await determinePrinterAssignment(item, printerAssignmentCache);

      if (printerId) {
        // Group items by printer
        if (!itemsByPrinter.has(printerId)) {
          itemsByPrinter.set(printerId, []);
        }
        itemsByPrinter.get(printerId).push(item);
        console.log(`📍 Item "${getItemDisplayName(item)}" assigned to printer ID: ${printerId}`);
      } else {
        console.warn(`⚠️ No printer assignment found for item: ${getItemDisplayName(item)}`);
      }
    }

    // Create void print jobs for each printer group
    const printJobs = [];
    console.log(`📄 Creating void print jobs for ${itemsByPrinter.size} printer(s)`);

    for (const [printerId, printerItems] of itemsByPrinter) {
      try {
        // Get printer details with enhanced error handling
        const printer = await Printer.findByPk(printerId, {
          include: [{ model: PrinterChannel, as: "channel" }]
        });

        if (!printer) {
          console.error(`❌ Printer not found: ID ${printerId}`);
          continue;
        }

        if (!printer.isActive) {
          console.warn(`⚠️ Printer inactive: ${printer.name} (ID: ${printerId})`);
          continue;
        }

        console.log(`🖨️ Processing void print job for printer: ${printer.name} (${printerItems.length} items)`);

        // Format void items for thermal printer with enhanced formatting
        const voidContent = await formatVoidItemsForThermalPrinter(printerItems, order, printer);

        // Create print job with enhanced metadata
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
            printerName: printer.name,
            printerLocation: printer.location,
            stationName: extractStationName(printer),
            voidedItems: printerItems.map(item => ({
              id: item.id,
              name: getItemDisplayName(item),
              quantity: item.quantity,
              type: item.type,
              category: getItemCategory(item)
            }))
          }
        });

        printJobs.push(printJob);
        console.log(`✅ Void print job created for printer: ${printer.name}`);
      } catch (printerError) {
        console.error(`❌ Failed to create void print job for printer ${printerId}:`, printerError);
      }
    }

    console.log(`📋 Total void print jobs created: ${printJobs.length}`);
    return printJobs;
  } catch (error) {
    console.error("❌ Error processing void print jobs:", error);
    throw error;
  }
}

/**
 * Dynamically determine printer assignment for an item
 * Uses database-driven logic with intelligent fallbacks
 */
async function determinePrinterAssignment(item, cache = new Map()) {
  try {
    let printerId = null;

    // 1. Check direct printer assignment on item
    if (item.menuItemId && item.menuItem && item.menuItem.printerId) {
      printerId = item.menuItem.printerId;
      console.log(`🎯 Direct assignment - Menu item "${item.menuItem.name}" → Printer ID: ${printerId}`);
      return printerId;
    }

    if (item.materialId && item.material && item.material.printerId) {
      printerId = item.material.printerId;
      console.log(`🎯 Direct assignment - Material "${item.material.name}" → Printer ID: ${printerId}`);
      return printerId;
    }

    if (item.assignmentId && item.assignment && item.assignment.printerId) {
      printerId = item.assignment.printerId;
      console.log(`🎯 Direct assignment - Assignment "${item.assignment.name}" → Printer ID: ${printerId}`);
      return printerId;
    }

    // 2. Category-based assignment with database lookup
    const category = getItemCategory(item);
    const cacheKey = `category_${category}`;

    if (cache.has(cacheKey)) {
      printerId = cache.get(cacheKey);
      console.log(`📦 Cached category assignment - "${category}" → Printer ID: ${printerId}`);
      return printerId;
    }

    // 3. Query database for category-based printer assignments
    printerId = await getCategoryPrinterAssignment(category, item.type);

    if (printerId) {
      cache.set(cacheKey, printerId);
      console.log(`🏷️ Category assignment - "${category}" → Printer ID: ${printerId}`);
      return printerId;
    }

    // 4. Fallback to default printer by type
    printerId = await getDefaultPrinterByType(item.type);

    if (printerId) {
      console.log(`🔄 Fallback assignment - Type "${item.type}" → Printer ID: ${printerId}`);
      return printerId;
    }

    // 5. Ultimate fallback - get any active printer
    printerId = await getAnyActivePrinter();

    if (printerId) {
      console.log(`⚡ Ultimate fallback - Any active printer → Printer ID: ${printerId}`);
      return printerId;
    }

    console.warn(`⚠️ No printer assignment possible for item: ${getItemDisplayName(item)}`);
    return null;
  } catch (error) {
    console.error(`❌ Error determining printer assignment for item:`, error);
    return null;
  }
}

/**
 * Get category-based printer assignment from database
 */
async function getCategoryPrinterAssignment(category, itemType) {
  try {
    // Define category to printer type mapping
    const categoryPrinterMap = {
      // Food categories → Kitchen printers
      appetizers: "kitchen",
      main_course: "kitchen",
      burgers: "kitchen",
      sandwiches: "kitchen",
      pasta: "kitchen",
      pizza: "kitchen",
      breakfast: "kitchen",
      salads: "kitchen",
      sushi: "kitchen",

      // Beverage categories → Bar printers
      beverages: "bar",
      drinks: "bar",
      cocktails: "bar",
      smoothies: "bar",
      coffee: "bar",

      // Hookah/Shisha → Arguile printers
      hookah: "arguile",
      shisha: "arguile",
      arguile: "arguile"
    };

    const printerType = categoryPrinterMap[category?.toLowerCase()];
    if (printerType) {
      const printer = await Printer.findOne({
        where: {
          isActive: true,
          [Op.or]: [{ location: { [Op.iLike]: `%${printerType}%` } }, { name: { [Op.iLike]: `%${printerType}%` } }, { description: { [Op.iLike]: `%${printerType}%` } }]
        },
        order: [["lastPing", "DESC"]]
      });
      return printer?.id || null;
    }
    return null;
  } catch (error) {
    console.error(`❌ Error getting category printer assignment:`, error);
    return null;
  }
}

// Get default printer by item type
async function getDefaultPrinterByType(itemType) {
  try {
    let searchTerms = [];
    if (itemType === "menu_item") {
      searchTerms = ["kitchen", "food", "main"];
    } else if (itemType === "material") {
      searchTerms = ["bar", "beverage", "drink"];
    } else {
      searchTerms = ["kitchen", "main"];
    }
    for (const term of searchTerms) {
      const printer = await Printer.findOne({
        where: {
          isActive: true,
          [Op.or]: [{ location: { [Op.iLike]: `%${term}%` } }, { name: { [Op.iLike]: `%${term}%` } }, { description: { [Op.iLike]: `%${term}%` } }]
        },
        order: [["lastPing", "DESC"]]
      });
      if (printer) {
        return printer.id;
      }
    }
    return null;
  } catch (error) {
    console.error(`❌ Error getting default printer by type:`, error);
    return null;
  }
}

// Get any active printer as ultimate fallback
async function getAnyActivePrinter() {
  try {
    const printer = await Printer.findOne({
      where: { isActive: true },
      order: [
        ["lastPing", "DESC"],
        ["totalJobs", "ASC"]
      ]
    });
    return printer?.id || null;
  } catch (error) {
    console.error(`❌ Error getting any active printer:`, error);
    return null;
  }
}

// Get display name for an item
function getItemDisplayName(item) {
  if (item.name && item.name !== "Unknown Item") {
    return item.name;
  }
  if (item.menuItem && item.menuItem.name) {
    return item.menuItem.name;
  }
  if (item.material && item.material.name) {
    return item.material.name;
  }
  if (item.assignment && item.assignment.name) {
    return item.assignment.name;
  }
  return `Unknown Item (ID: ${item.id || "N/A"})`;
}

/**
 * Get category for an item
 */
function getItemCategory(item) {
  if (item.menuItem && item.menuItem.category) {
    return item.menuItem.category;
  }
  if (item.material && item.material.category) {
    return item.material.category;
  }
  if (item.assignment && item.assignment.category) {
    return item.assignment.category;
  }
  if (item.type === "material") {
    return "beverages";
  }
  return "main_course";
}

/**
 * Extract station name from printer configuration
 */
function extractStationName(printer) {
  if (!printer) return "UNKNOWN";

  // Try to extract from location first
  if (printer.location) {
    const location = printer.location.toUpperCase();
    if (location.includes("KITCHEN")) return "KITCHEN";
    if (location.includes("BAR")) return "BAR";
    if (location.includes("ARGUILE") || location.includes("SHISHA")) return "ARGUILE";
  }

  // Try to extract from name
  if (printer.name) {
    const name = printer.name.toUpperCase();
    if (name.includes("KITCHEN")) return "KITCHEN";
    if (name.includes("BAR")) return "BAR";
    if (name.includes("ARGUILE") || name.includes("SHISHA")) return "ARGUILE";

    // Clean up printer name for display
    const cleanName = name
      .replace(/PRINTER\s*\d*/i, "")
      .replace(/THERMAL/i, "")
      .replace(/RECEIPT/i, "")
      .trim();

    if (cleanName) return cleanName;
  }

  // Try to extract from description
  if (printer.description) {
    const desc = printer.description.toUpperCase();
    if (desc.includes("KITCHEN")) return "KITCHEN";
    if (desc.includes("BAR")) return "BAR";
    if (desc.includes("ARGUILE") || desc.includes("SHISHA")) return "ARGUILE";
  }

  return "STATION";
}

/**
 * Format void items for thermal printer output
 * Enhanced with dynamic station detection and better formatting
 */
async function formatVoidItemsForThermalPrinter(items, order, printer) {
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

  // Get station name using dynamic extraction (no hardcoded IDs)
  const stationName = extractStationName(printer);

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

    // List voided items with emphasis and better formatting
    Object.values(groupedItems).forEach(item => {
      const itemName = getItemDisplayName(item);
      const quantity = item.quantity || 1;
      const category = getItemCategory(item);

      // Bold text for emphasis (ESC/POS command)
      content += "\x1B\x45"; // ESC E - Bold on
      content += `            ${quantity}x ${itemName}\n`;

      // Add category info if available and different from default
      if (category && category !== "main_course") {
        content += `                [${category.toUpperCase()}]\n`;
      }

      content += "\x1B\x46"; // ESC F - Bold off
    });
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
    content += "\x1B\x69";
    return content;
  } catch (error) {
    console.error("Error formatting void items for printer:", error);
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
      const itemName = getItemDisplayName(item);
      const category = getItemCategory(item);

      fallbackContent += centerText(`${item.quantity}x ${itemName}`) + "\n";

      // Add category info in fallback format too
      if (category && category !== "main_course") {
        fallbackContent += centerText(`[${category.toUpperCase()}]`) + "\n";
      }
    });

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    fallbackContent += centerText(`Total Voided: ${itemCount}`) + "\n";
    fallbackContent += centerText("*** DO NOT PREPARE ***") + "\n";
    fallbackContent += "\n\n\n\n\n";

    return fallbackContent;
  }
}
