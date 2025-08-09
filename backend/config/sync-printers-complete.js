import sequelize from "./database.js";
// Import all models to ensure they are registered
import "../models/index.js";

async function syncPrintersComplete() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Get the models
    const PrinterChannel = sequelize.models.PrinterChannel;
    const Printer = sequelize.models.Printer;
    const User = sequelize.models.User;

    console.log("📋 Available models:", Object.keys(sequelize.models));

    // Ensure User table exists first (required for foreign keys)
    if (User) {
      await User.sync({ alter: true });
      console.log("✅ User table synced");
    }

    // Sync PrinterChannel first (no dependencies)
    if (PrinterChannel) {
      await PrinterChannel.sync({ force: true });
      console.log("✅ PrinterChannel table created");
    } else {
      console.error("❌ PrinterChannel model not found");
    }

    // Sync Printer table (depends on PrinterChannel and User)
    if (Printer) {
      await Printer.sync({ force: true });
      console.log("✅ Printer table created");
    } else {
      console.error("❌ Printer model not found");
    }

    // Verify tables were created
    const [channelResult] = await sequelize.query("SELECT COUNT(*) FROM printer_channels");
    const [printerResult] = await sequelize.query("SELECT COUNT(*) FROM printers");
    
    console.log(`✅ printer_channels table has ${channelResult[0].count} rows`);
    console.log(`✅ printers table has ${printerResult[0].count} rows`);

    console.log("✅ All printer tables synchronized successfully.");
    
  } catch (error) {
    console.error("❌ Printer sync failed:", error);
    console.error("Error details:", error.message);
  } finally {
    await sequelize.close();
  }
}

syncPrintersComplete();
