import { Op } from "sequelize";
import { FloorArea, FloorPlan, FurnitureItem, Order, OrderItem, User } from "../models/index.js";

export const floorPlanController = {
  // Get all floor plans
  getFloorPlans: async (req, res) => {
    try {
      const { includeAreas, includeInactive } = req.query;

      const whereClause = {};
      if (includeInactive !== "true") {
        whereClause.isActive = true;
      }

      const includeOptions = [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"]
        }
      ];

      if (includeAreas === "true") {
        includeOptions.push({
          model: FloorArea,
          as: "areas",
          include: [
            {
              model: FurnitureItem,
              as: "furniture",
              where: { isActive: true },
              required: false
            }
          ]
        });
      }

      const floorPlans = await FloorPlan.findAll({
        where: whereClause,
        include: includeOptions,
        order: [
          ["isDefault", "DESC"],
          ["name", "ASC"]
        ]
      });

      res.json({ data: floorPlans });
    } catch (error) {
      console.error("Get floor plans error:", error);
      res.status(500).json({ message: "Failed to fetch floor plans", error: error.message });
    }
  },

  // Get specific floor plan
  getFloorPlan: async (req, res) => {
    try {
      const { floorPlanId } = req.params;

      const floorPlan = await FloorPlan.findByPk(floorPlanId, {
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "username"]
          },
          {
            model: FloorArea,
            as: "areas",
            include: [
              {
                model: FurnitureItem,
                as: "furniture",
                where: { isActive: true },
                required: false,
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
              }
            ]
          }
        ]
      });

      if (!floorPlan) {
        return res.status(404).json({ message: "Floor plan not found" });
      }

      // Transform furniture items to include current order info
      const transformedFloorPlan = floorPlan.toJSON();
      if (transformedFloorPlan.areas) {
        transformedFloorPlan.areas.forEach(area => {
          if (area.furniture) {
            area.furniture.forEach(furnitureItem => {
              if (furnitureItem.isTable && furnitureItem.orders && furnitureItem.orders.length > 0) {
                const currentOrder = furnitureItem.orders[0];
                furnitureItem.currentOrder = {
                  orderId: currentOrder.id.toString(),
                  orderNumber: currentOrder.orderNumber,
                  customerName: currentOrder.customerName,
                  startTime: currentOrder.createdAt,
                  totalAmount: parseFloat(currentOrder.total),
                  itemCount: currentOrder.items?.length || 0
                };
                furnitureItem.status = "occupied";
              }
              // Remove the full orders array to keep response clean
              delete furnitureItem.orders;
            });
          }
        });
      }

      res.json({ data: transformedFloorPlan });
    } catch (error) {
      console.error("Get floor plan error:", error);
      res.status(500).json({ message: "Failed to fetch floor plan", error: error.message });
    }
  },

  // Create new floor plan
  createFloorPlan: async (req, res) => {
    try {
      const { name, description, areas, isDefault } = req.body;
      const userId = req.user?.id;

      const floorPlan = await FloorPlan.create({
        name,
        description,
        isDefault: isDefault || false,
        createdBy: userId,
        updatedBy: userId
      });

      // Create areas if provided
      if (areas && areas.length > 0) {
        for (const areaData of areas) {
          const area = await FloorArea.create({
            floorPlanId: floorPlan.id,
            name: areaData.name,
            bounds: areaData.bounds,
            color: areaData.color || "#f8fafc",
            section: areaData.section || "main"
          });

          // Create furniture items if provided
          if (areaData.furniture && areaData.furniture.length > 0) {
            for (const furnitureData of areaData.furniture) {
              // Auto-generate unique table number for tables
              let tableNumber = null;
              const tableTypes = ["round-table", "square-table", "rectangular-table"];
              if (tableTypes.includes(furnitureData.type) && furnitureData.seatingCapacity > 0) {
                // Find the highest existing table number and increment
                const maxTableNumber = await FurnitureItem.max('tableNumber') || 0;
                tableNumber = maxTableNumber + 1;
              }
              
              await FurnitureItem.create({
                floorAreaId: area.id,
                designerItemId: furnitureData.id,
                type: furnitureData.type,
                name: furnitureData.name,
                position: furnitureData.position,
                dimensions: furnitureData.dimensions,
                rotation: furnitureData.rotation || 0,
                color: furnitureData.color || "#8B4513",
                seatingCapacity: furnitureData.seatingCapacity,
                zIndex: furnitureData.zIndex || 1,
                parentId: furnitureData.parentId,
                tableNumber: tableNumber
              });
            }
          }
        }
      }

      // Fetch the complete floor plan with areas and furniture
      const completeFloorPlan = await FloorPlan.findByPk(floorPlan.id, {
        include: [
          {
            model: FloorArea,
            as: "areas",
            include: [
              {
                model: FurnitureItem,
                as: "furniture"
              }
            ]
          }
        ]
      });

      res.status(201).json({
        message: "Floor plan created successfully",
        data: completeFloorPlan
      });
    } catch (error) {
      console.error("Create floor plan error:", error);
      res.status(500).json({ message: "Failed to create floor plan", error: error.message });
    }
  },

  // Update floor plan
  updateFloorPlan: async (req, res) => {
    try {
      const { floorPlanId } = req.params;
      const { name, description, areas, isDefault } = req.body;
      const userId = req.user?.id;

      const floorPlan = await FloorPlan.findByPk(floorPlanId);
      if (!floorPlan) {
        return res.status(404).json({ message: "Floor plan not found" });
      }

      // Update floor plan
      await floorPlan.update({
        name: name !== undefined ? name : floorPlan.name,
        description: description !== undefined ? description : floorPlan.description,
        isDefault: isDefault !== undefined ? isDefault : floorPlan.isDefault,
        updatedBy: userId
      });

      // Update areas if provided
      if (areas) {
        // Remove existing areas and furniture
        await FloorArea.destroy({
          where: { floorPlanId: floorPlan.id }
        });

        // Create new areas
        for (const areaData of areas) {
          const area = await FloorArea.create({
            floorPlanId: floorPlan.id,
            name: areaData.name,
            bounds: areaData.bounds,
            color: areaData.color || "#f8fafc",
            section: areaData.section || "main"
          });

          // Create furniture items
          if (areaData.furniture && areaData.furniture.length > 0) {
            for (const furnitureData of areaData.furniture) {
              await FurnitureItem.create({
                floorAreaId: area.id,
                designerItemId: furnitureData.id,
                type: furnitureData.type,
                name: furnitureData.name,
                position: furnitureData.position,
                dimensions: furnitureData.dimensions,
                rotation: furnitureData.rotation || 0,
                color: furnitureData.color || "#8B4513",
                seatingCapacity: furnitureData.seatingCapacity,
                zIndex: furnitureData.zIndex || 1,
                parentId: furnitureData.parentId,
                tableNumber: furnitureData.tableNumber
              });
            }
          }
        }
      }

      // Fetch the updated floor plan
      const updatedFloorPlan = await FloorPlan.findByPk(floorPlan.id, {
        include: [
          {
            model: FloorArea,
            as: "areas",
            include: [
              {
                model: FurnitureItem,
                as: "furniture"
              }
            ]
          }
        ]
      });

      res.json({
        message: "Floor plan updated successfully",
        data: updatedFloorPlan
      });
    } catch (error) {
      console.error("Update floor plan error:", error);
      res.status(500).json({ message: "Failed to update floor plan", error: error.message });
    }
  },

  // Delete floor plan
  deleteFloorPlan: async (req, res) => {
    try {
      const { floorPlanId } = req.params;

      const floorPlan = await FloorPlan.findByPk(floorPlanId);
      if (!floorPlan) {
        return res.status(404).json({ message: "Floor plan not found" });
      }

      if (floorPlan.isDefault) {
        return res.status(400).json({
          message: "Cannot delete the default floor plan"
        });
      }

      // Check if any furniture items have active orders (optional check)
      try {
        const activeOrders = await Order.count({
          include: [
            {
              model: FurnitureItem,
              as: "furnitureItem",
              include: [
                {
                  model: FloorArea,
                  as: "floorArea",
                  where: { floorPlanId }
                }
              ]
            }
          ],
          where: {
            status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
          }
        });

        if (activeOrders > 0) {
          return res.status(400).json({
            message: "Cannot delete floor plan with active orders. Please complete or cancel all orders first."
          });
        }
      } catch (orderCheckError) {
        // If order check fails (e.g., furnitureItemId column doesn't exist), 
        // log the error but continue with deletion
        console.warn("Could not check for active orders, proceeding with deletion:", orderCheckError.message);
      }

      // Hard delete - actually remove from database
      await floorPlan.destroy();

      res.json({ message: "Floor plan deleted successfully" });
    } catch (error) {
      console.error("Delete floor plan error:", error);
      res.status(500).json({ message: "Failed to delete floor plan", error: error.message });
    }
  },

  // Set default floor plan
  setDefaultFloorPlan: async (req, res) => {
    try {
      const { floorPlanId } = req.params;

      const floorPlan = await FloorPlan.findByPk(floorPlanId);
      if (!floorPlan) {
        return res.status(404).json({ message: "Floor plan not found" });
      }

      await floorPlan.update({ isDefault: true });

      res.json({
        message: "Default floor plan updated successfully",
        data: floorPlan
      });
    } catch (error) {
      console.error("Set default floor plan error:", error);
      res.status(500).json({ message: "Failed to set default floor plan", error: error.message });
    }
  },

  // Get tables from floor plan (for POS integration)
  getFloorPlanTables: async (req, res) => {
    try {
      const { floorPlanId } = req.params;
      const { section, status, includeOrders } = req.query;

      const whereClause = { isActive: true };
      if (section) whereClause.section = section;

      // Get default floor plan if none specified
      let targetFloorPlanId = floorPlanId;
      if (!targetFloorPlanId || targetFloorPlanId === "default") {
        const defaultPlan = await FloorPlan.findOne({ where: { isDefault: true } });
        if (!defaultPlan) {
          return res.status(404).json({ message: "No default floor plan found" });
        }
        targetFloorPlanId = defaultPlan.id;
      }

      const includeOptions = [
        {
          model: FloorArea,
          as: "floorArea",
          where: { floorPlanId: targetFloorPlanId },
          attributes: ["name", "section"]
        }
      ];

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

      const furnitureItems = await FurnitureItem.findAll({
        where: {
          ...whereClause,
          isTable: true
        },
        include: includeOptions,
        order: [["tableNumber", "ASC"]]
      });

      // Transform furniture items to table format for POS compatibility
      const tables = furnitureItems.map(item => {
        const tableData = {
          id: item.id,
          number: item.tableNumber || item.id,
          name: item.name,
          seats: item.seatingCapacity || 4,
          status: item.status,
          shape: item.type.replace("-table", ""),
          position: item.position,
          section: item.floorArea?.section || "main",
          isActive: item.isActive,
          furnitureItemId: item.id,
          designerItemId: item.designerItemId
        };

        if (item.orders && item.orders.length > 0) {
          const currentOrder = item.orders[0];
          tableData.currentOrder = {
            orderId: currentOrder.id.toString(),
            orderNumber: currentOrder.orderNumber,
            customerName: currentOrder.customerName,
            startTime: currentOrder.createdAt,
            totalAmount: parseFloat(currentOrder.total),
            itemCount: currentOrder.items?.length || 0
          };
          tableData.status = "occupied";
        }

        return tableData;
      });

      res.json({ data: tables });
    } catch (error) {
      console.error("Get floor plan tables error:", error);
      res.status(500).json({ message: "Failed to fetch floor plan tables", error: error.message });
    }
  },

  // Update furniture item status (for table status updates)
  updateFurnitureStatus: async (req, res) => {
    try {
      const { furnitureItemId } = req.params;
      const { status } = req.body;

      const furnitureItem = await FurnitureItem.findByPk(furnitureItemId);
      if (!furnitureItem) {
        return res.status(404).json({ message: "Furniture item not found" });
      }

      await furnitureItem.update({ status });

      res.json({
        message: "Furniture item status updated successfully",
        data: furnitureItem
      });
    } catch (error) {
      console.error("Update furniture status error:", error);
      res.status(500).json({ message: "Failed to update furniture status", error: error.message });
    }
  }
};
