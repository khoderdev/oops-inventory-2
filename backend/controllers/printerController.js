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

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Printer name is required"
      });
    }

    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: "Printer channel is required"
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Printer type is required"
      });
    }

    if (!connectionType) {
      return res.status(400).json({
        success: false,
        message: "Connection type is required"
      });
    }

    // Validate channel exists
    const channel = await PrinterChannel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Selected printer channel does not exist"
      });
    }

    // Check if printer name already exists
    const existingPrinter = await Printer.findOne({ where: { name: name.trim() } });
    if (existingPrinter) {
      return res.status(409).json({
        success: false,
        message: `A printer with the name "${name.trim()}" already exists`
      });
    }

    // Validate network configuration for network printers
    if (connectionType === 'network') {
      if (!networkConfig || !networkConfig.ipAddress || networkConfig.ipAddress.trim() === '') {
        return res.status(400).json({
          success: false,
          message: "IP address is required for network printers"
        });
      }
      
      // Basic IP address validation
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(networkConfig.ipAddress.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid IP address"
        });
      }
    }

    // Validate OS configuration for USB printers
    if (connectionType === 'usb') {
      if (!osConfig || !osConfig.printerName || osConfig.printerName.trim() === '') {
        return res.status(400).json({
          success: false,
          message: "Printer name is required for USB printers"
        });
      }
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
    
    // Handle specific error types with more detailed messages
    let errorMessage = "Failed to create printer";
    let statusCode = 500;
    
    if (error.name === 'SequelizeValidationError') {
      errorMessage = error.errors.map(err => err.message).join(', ');
      statusCode = 400;
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = "A printer with this name already exists";
      statusCode = 409;
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      errorMessage = "Invalid printer channel selected";
      statusCode = 400;
    } else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = `Database error: ${error.message}`;
      statusCode = 500;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: {
        type: error.name,
        originalError: error.message
      }
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

// Print test page
export const printTestPage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const printer = await Printer.findByPk(id);
    if (!printer) {
      return res.status(404).json({
        success: false,
        message: "Printer not found"
      });
    }

    if (!printer.isActive) {
      return res.status(400).json({
        success: false,
        message: "Printer is not active"
      });
    }

    // Create test page content
    const testPageContent = generateTestPageContent(printer);

    // Get printer service instance
    const printerService = req.app.get("printerService");
    if (!printerService) {
      return res.status(500).json({
        success: false,
        message: "Printer service not available"
      });
    }

    // Prepare job data for printer service
    const jobData = {
      printerId: printer.id,
      jobType: "report",
      content: {
        template: null,
        data: {
          printerName: printer.name,
          printerType: printer.type,
          connectionType: printer.connectionType,
          location: printer.location || "Not specified",
          testTimestamp: new Date().toISOString()
        },
        rawContent: testPageContent,
        format: "text",
        encoding: "utf8"
      },
      priority: 1,
      metadata: {
        isTestPage: true,
        printerName: printer.name,
        testTimestamp: new Date().toISOString()
      },
      createdBy: userId
    };

    // Send print job to printer service
    try {
      const printJob = await printerService.addPrintJob(jobData);
      res.json({
        success: true,
        message: "Test page sent successfully",
        jobId: printJob.id
      });
    } catch (error) {
      res.json({
        success: false,
        message: "Failed to send test page",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Error printing test page:", error);
    res.status(500).json({
      success: false,
      message: "Failed to print test page",
      error: error.message
    });
  }
};

// Generate test page content
function generateTestPageContent(printer) {
  const timestamp = new Date().toLocaleString();
  
  // Base content for all printer types
  let content = `TEST PAGE\n` +
                `\n` +
                `Printer Information:\n` +
                `Name: ${printer.name}\n` +
                `Type: ${printer.type}\n` +
                `Connection: ${printer.connectionType}\n` +
                `Location: ${printer.location || 'Not specified'}\n` +
                `Status: ${printer.isActive ? 'Active' : 'Inactive'}\n` +
                `\n` +
                `Test Details:\n` +
                `Date/Time: ${timestamp}\n` +
                `\n` +
                `This is a test page to verify that the printer is working\n` +
                `correctly and can receive print jobs from the system.\n` +
                `\n` +
                `If you can read this message, the printer is functioning\n` +
                `properly and is ready to handle print jobs.\n` +
                `\n` +
                `Test completed successfully!\n` +
                `\n` +
                `--- END OF TEST PAGE ---\n`;
  
  // Add paper cutting commands for thermal/receipt printers
  if (printer.type === 'thermal' || printer.type === 'receipt') {
    // Add feed lines and cut command
    content += `\n\n\n`; // Extra line feeds before cutting
    content += String.fromCharCode(27, 105); // ESC i - Full cut command
    // Alternative: content += String.fromCharCode(27, 109); // ESC m - Partial cut
  }
  
  return content;
}

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
