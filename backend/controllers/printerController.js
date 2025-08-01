import { Op } from "sequelize";
import { Printer, PrinterChannel, PrintJob, User } from "../models/index.js";

export const getPrinterChannels = async (req, res) => {
  try {
    const channels = await PrinterChannel.findAll({
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"]
        },
        {
          model: Printer,
          as: "printers",
          attributes: ["id", "name", "type", "status", "isActive"]
        }
      ],
      order: [
        ["priority", "ASC"],
        ["name", "ASC"]
      ]
    });

    res.json({
      success: true,
      channels
    });
  } catch (error) {
    console.error("Error fetching printer channels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch printer channels",
      error: error.message
    });
  }
};

// Create printer channel
export const createPrinterChannel = async (req, res) => {
  try {
    const { name, description, priority, settings } = req.body;
    const userId = req.user.id;

    const channel = await PrinterChannel.create({
      name,
      description,
      priority: priority || 1,
      settings: settings || {},
      createdBy: userId
    });

    const channelWithCreator = await PrinterChannel.findByPk(channel.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Printer channel created successfully",
      channel: channelWithCreator
    });
  } catch (error) {
    console.error("Error creating printer channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create printer channel",
      error: error.message
    });
  }
};

// Update printer channel
export const updatePrinterChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, priority, settings, isActive } = req.body;

    const channel = await PrinterChannel.findByPk(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Printer channel not found"
      });
    }

    await channel.update({
      name: name || channel.name,
      description: description !== undefined ? description : channel.description,
      priority: priority || channel.priority,
      settings: settings || channel.settings,
      isActive: isActive !== undefined ? isActive : channel.isActive
    });

    const updatedChannel = await PrinterChannel.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"]
        },
        {
          model: Printer,
          as: "printers",
          attributes: ["id", "name", "type", "status", "isActive"]
        }
      ]
    });

    res.json({
      success: true,
      message: "Printer channel updated successfully",
      channel: updatedChannel
    });
  } catch (error) {
    console.error("Error updating printer channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update printer channel",
      error: error.message
    });
  }
};

// Delete printer channel
export const deletePrinterChannel = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await PrinterChannel.findByPk(id, {
      include: [{ model: Printer, as: "printers" }]
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Printer channel not found"
      });
    }

    if (channel.printers && channel.printers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete channel with active printers. Remove printers first."
      });
    }

    await channel.destroy();

    res.json({
      success: true,
      message: "Printer channel deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting printer channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete printer channel",
      error: error.message
    });
  }
};

export const getPrinters = async (req, res) => {
  try {
    const { channelId, status, type } = req.query;
    const where = {};

    if (channelId) where.channelId = channelId;
    if (status) where.status = status;
    if (type) where.type = type;

    const printers = await Printer.findAll({
      where,
      include: [
        {
          model: PrinterChannel,
          as: "channel",
          attributes: ["id", "name", "priority"]
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"] // Changed from fullName
        }
      ],
      order: [
        ["channel", "priority", "ASC"],
        ["name", "ASC"]
      ]
    });

    res.json({
      success: true,
      printers
    });
  } catch (error) {
    console.error("Error fetching printers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch printers",
      error: error.message
    });
  }
};

// Create printer
export const createPrinter = async (req, res) => {
  try {
    const { name, channelId, type, connectionType, networkConfig, osConfig, settings, capabilities, location, description } = req.body;
    const userId = req.user.id;

    // Validate channel exists
    const channel = await PrinterChannel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Printer channel not found"
      });
    }

    const printer = await Printer.create({
      name,
      channelId,
      type,
      connectionType,
      networkConfig: networkConfig || {},
      osConfig: osConfig || {},
      settings: settings || {},
      capabilities: capabilities || {},
      location,
      description,
      createdBy: userId
    });

    const printerWithRelations = await Printer.findByPk(printer.id, {
      include: [
        {
          model: PrinterChannel,
          as: "channel",
          attributes: ["id", "name", "priority"]
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Printer created successfully",
      printer: printerWithRelations
    });
  } catch (error) {
    console.error("Error creating printer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create printer",
      error: error.message
    });
  }
};

// Update printer
export const updatePrinter = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const printer = await Printer.findByPk(id);
    if (!printer) {
      return res.status(404).json({
        success: false,
        message: "Printer not found"
      });
    }

    // If channelId is being updated, validate it exists
    if (updateData.channelId) {
      const channel = await PrinterChannel.findByPk(updateData.channelId);
      if (!channel) {
        return res.status(404).json({
          success: false,
          message: "Printer channel not found"
        });
      }
    }

    await printer.update(updateData);

    const updatedPrinter = await Printer.findByPk(id, {
      include: [
        {
          model: PrinterChannel,
          as: "channel",
          attributes: ["id", "name", "priority"]
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"]
        }
      ]
    });

    res.json({
      success: true,
      message: "Printer updated successfully",
      printer: updatedPrinter
    });
  } catch (error) {
    console.error("Error updating printer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update printer",
      error: error.message
    });
  }
};

// Delete printer
export const deletePrinter = async (req, res) => {
  try {
    const { id } = req.params;

    const printer = await Printer.findByPk(id);
    if (!printer) {
      return res.status(404).json({
        success: false,
        message: "Printer not found"
      });
    }

    // Check for pending print jobs
    const pendingJobs = await PrintJob.count({
      where: {
        printerId: id,
        status: {
          [Op.in]: ["pending", "queued", "printing"]
        }
      }
    });

    if (pendingJobs > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete printer with ${pendingJobs} pending print jobs`
      });
    }

    await printer.destroy();

    res.json({
      success: true,
      message: "Printer deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting printer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete printer",
      error: error.message
    });
  }
};

// Test printer connection
export const testPrinter = async (req, res) => {
  try {
    const { id } = req.params;

    const printer = await Printer.findByPk(id);
    if (!printer) {
      return res.status(404).json({
        success: false,
        message: "Printer not found"
      });
    }

    // Get printer service instance
    const printerService = req.app.get("printerService");
    if (!printerService) {
      return res.status(500).json({
        success: false,
        message: "Printer service not available"
      });
    }

    // Test the printer connection
    try {
      await printerService.setupPrinter(printer);

      res.json({
        success: true,
        message: "Printer connection test successful",
        status: "online"
      });
    } catch (error) {
      res.json({
        success: false,
        message: "Printer connection test failed",
        status: "error",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Error testing printer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test printer",
      error: error.message
    });
  }
};

// Get printer statistics
export const getPrinterStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;

    const printer = await Printer.findByPk(id);
    if (!printer) {
      return res.status(404).json({
        success: false,
        message: "Printer not found"
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await PrintJob.findAll({
      where: {
        printerId: id,
        createdAt: {
          [Op.gte]: startDate
        }
      },
      attributes: ["status", [PrintJob.sequelize.fn("COUNT", "*"), "count"], [PrintJob.sequelize.fn("DATE", PrintJob.sequelize.col("createdAt")), "date"]],
      group: ["status", PrintJob.sequelize.fn("DATE", PrintJob.sequelize.col("createdAt"))],
      order: [[PrintJob.sequelize.fn("DATE", PrintJob.sequelize.col("createdAt")), "ASC"]]
    });

    const totalJobs = await PrintJob.count({
      where: {
        printerId: id,
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });

    const successfulJobs = await PrintJob.count({
      where: {
        printerId: id,
        status: "completed",
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });

    const failedJobs = await PrintJob.count({
      where: {
        printerId: id,
        status: "failed",
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });

    res.json({
      success: true,
      stats: {
        totalJobs,
        successfulJobs,
        failedJobs,
        successRate: totalJobs > 0 ? ((successfulJobs / totalJobs) * 100).toFixed(2) : 0,
        dailyStats: stats,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error("Error fetching printer stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch printer statistics",
      error: error.message
    });
  }
};
