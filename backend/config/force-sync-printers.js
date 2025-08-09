import sequelize from "./database.js";
// Import printer models specifically
import Printer from "../models/Printer.js";
import PrinterChannel from "../models/PrinterChannel.js";

async function forceSyncPrinters() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Force sync printer tables only
    console.log("🔄 Force syncing Printer tables...");
    
    // Drop and recreate printer tables
    await Printer.drop({ cascade: true });
    await PrinterChannel.drop({ cascade: true });
    
    await PrinterChannel.sync({ force: true });
    await Printer.sync({ force: true });
    
    console.log("✅ Printer tables recreated successfully.");
    
  } catch (error) {
    console.error("❌ Printer sync failed:", error);
  } finally {
    await sequelize.close();
  }
}

forceSyncPrinters();
