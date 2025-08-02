const { Printer } = require("../models");

const printersController = {
  // Get all printers
  async getAllPrinters(req, res, next) {
    try {
      const printers = await Printer.findAll({
        order: [["name", "ASC"]]
      });
      
      res.status(200).json(printers);
    } catch (error) {
      console.error("Error fetching printers:", error);
      next(error);
    }
  },

  // Get printer by ID
  async getPrinterById(req, res, next) {
    try {
      const { id } = req.params;
      const printer = await Printer.findByPk(id);
      
      if (!printer) {
        return res.status(404).json({ error: "Printer not found" });
      }
      
      res.status(200).json(printer);
    } catch (error) {
      console.error("Error fetching printer:", error);
      next(error);
    }
  },

  // Create new printer
  async createPrinter(req, res, next) {
    try {
      const { name, type, ipAddress, port, location, isDefault } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
      }
      
      // If this is set as default, remove default from other printers
      if (isDefault) {
        await Printer.update({ isDefault: false }, { where: { isDefault: true } });
      }
      
      const printer = await Printer.create({
        name,
        type,
        ipAddress,
        port,
        location,
        status: "offline", // Default status
        isDefault: isDefault || false
      });
      
      res.status(201).json(printer);
    } catch (error) {
      console.error("Error creating printer:", error);
      next(error);
    }
  },

  // Update printer
  async updatePrinter(req, res, next) {
    try {
      const { id } = req.params;
      const { name, type, ipAddress, port, location, status, isDefault } = req.body;
      
      const printer = await Printer.findByPk(id);
      if (!printer) {
        return res.status(404).json({ error: "Printer not found" });
      }
      
      // If this is set as default, remove default from other printers
      if (isDefault && !printer.isDefault) {
        await Printer.update({ isDefault: false }, { where: { isDefault: true } });
      }
      
      await printer.update({
        name: name || printer.name,
        type: type || printer.type,
        ipAddress,
        port,
        location,
        status: status || printer.status,
        isDefault: isDefault !== undefined ? isDefault : printer.isDefault
      });
      
      res.status(200).json(printer);
    } catch (error) {
      console.error("Error updating printer:", error);
      next(error);
    }
  },

  // Delete printer
  async deletePrinter(req, res, next) {
    try {
      const { id } = req.params;
      
      const printer = await Printer.findByPk(id);
      if (!printer) {
        return res.status(404).json({ error: "Printer not found" });
      }
      
      await printer.destroy();
      res.status(200).json({ message: "Printer deleted successfully" });
    } catch (error) {
      console.error("Error deleting printer:", error);
      next(error);
    }
  },

  // Test printer connection
  async testPrinter(req, res, next) {
    try {
      const { id } = req.params;
      
      const printer = await Printer.findByPk(id);
      if (!printer) {
        return res.status(404).json({ error: "Printer not found" });
      }
      
      // TODO: Implement actual printer test logic
      // For now, just return a mock response
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        await printer.update({ status: "online" });
        res.status(200).json({ 
          success: true, 
          message: `Printer ${printer.name} is responding` 
        });
      } else {
        await printer.update({ status: "error" });
        res.status(200).json({ 
          success: false, 
          message: `Failed to connect to printer ${printer.name}` 
        });
      }
    } catch (error) {
      console.error("Error testing printer:", error);
      next(error);
    }
  }
};

module.exports = printersController;
