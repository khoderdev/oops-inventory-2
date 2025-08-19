import sequelize from "../config/database.js";
import Material from "../models/materials.js";
import StockEntry from "../models/StockEntry.js";
import { MenuItem, MenuItemIngredient } from "../models/menuItems.js";
import AuditLog from "../models/AuditLog.js";
import Employee from "../models/Employee.js";
import Order from "../models/Order.js";
import Printer from "../models/Printer.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Table from "../models/Table.js";
import DayOperation from "../models/DayOperation.js";
import DayOperationReport from "../models/dayOperationsReports.js";

async function safeTruncate(tableName) {
  try {
    await sequelize.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
    console.log(`   ✅ ${tableName} truncated`);
  } catch (error) {
    if (error.original && error.original.code === '42P01') {
      console.log(`   ⚠️  ${tableName} does not exist - skipping`);
    } else {
      console.log(`   ❌ Error truncating ${tableName}:`, error.message);
      throw error;
    }
  }
}

// Helper function to reset sequences
async function resetSequences() {
  try {
    console.log("🔄 Resetting PostgreSQL sequences...");
    
    // Get all sequences and reset them
    const sequences = [
      'users_id_seq',
      'employees_id_seq', 
      'materials_id_seq',
      'stock_entries_id_seq',
      'menu_items_id_seq',
      'menu_item_ingredients_id_seq',
      'printers_id_seq',
      'printer_channels_id_seq'
    ];
    
    for (const sequence of sequences) {
      try {
        await sequelize.query(`ALTER SEQUENCE "${sequence}" RESTART WITH 1`);
        console.log(`   ✅ ${sequence} reset to 1`);
      } catch (error) {
        if (error.original && error.original.code === '42P01') {
          console.log(`   ⚠️  ${sequence} does not exist - skipping`);
        } else {
          console.log(`   ❌ Error resetting ${sequence}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error resetting sequences:", error);
  }
}

async function truncateTables() {
  try {
    console.log("🗑️ Truncating database tables...");
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    
    console.log("🔄 Truncating dependent tables...");
    await safeTruncate("auditLogs");
    await safeTruncate("sessions");
    await safeTruncate("assignments");
    await safeTruncate("scheduleExecutions");
    await safeTruncate("backupSchedules");
    
    console.log("🔄 Truncating order-related tables...");
    await safeTruncate("orderItems");
    await safeTruncate("orders");
    await safeTruncate("saleMenuItems");
    await safeTruncate("sales");
    await safeTruncate("categories");
    await safeTruncate("tables");
    
    console.log("🔄 Truncating employee-related tables...");
    await safeTruncate("employeeUsages");
    await safeTruncate("employeeSettlements");
    
    console.log("🔄 Truncating inventory-related tables...");
    await safeTruncate("wastings");
    await safeTruncate("stockEntryLogSimples");
    await safeTruncate("stockEntries");
    await safeTruncate("menuItemIngredients");
    await safeTruncate("menuItems");
    await safeTruncate("materials");
    
    console.log("🔄 Truncating printer-related tables...");
    await safeTruncate("printJobs");
    await safeTruncate("printers");
    await safeTruncate("printerChannels");
    
    console.log("🔄 Truncating operational tables...");
    await safeTruncate("DayOperations");
    await safeTruncate("DayOperationReports");
    
    console.log("🔄 Truncating user-related tables...");
    await safeTruncate("employees");
    await safeTruncate("users");

    const materialCount = await Material.count();
    const stockCount = await StockEntry.count();
    const menuCount = await MenuItem.count();
    const ingredientCount = await MenuItemIngredient.count();
    const userCount = await User.count();
    const employeeCount = await Employee.count();
    const orderCount = await Order.count();
    const printerCount = await Printer.count();
    const auditLogCount = await AuditLog.count();
    const categoryCount = await Category.count();
    const tableCount = await Table.count();
    const dayOperationCount = await DayOperation.count();
    const dayOperationReportCount = await DayOperationReport.count();

    console.log("\n📊 TRUNCATION RESULTS:");
    console.log("======================");
    console.log(`Users: ${userCount} remaining`);
    console.log(`Employees: ${employeeCount} remaining`);
    console.log(`Materials: ${materialCount} remaining`);
    console.log(`Stock Entries: ${stockCount} remaining`);
    console.log(`Menu Items: ${menuCount} remaining`);
    console.log(`Menu Item Ingredients: ${ingredientCount} remaining`);
    console.log(`Orders: ${orderCount} remaining`);
    console.log(`Printers: ${printerCount} remaining`);
    console.log(`Audit Logs: ${auditLogCount} remaining`);
    console.log(`Categories: ${categoryCount} remaining`);
    console.log(`Tables: ${tableCount} remaining`);
    console.log(`Day Operations: ${dayOperationCount} remaining`);
    console.log(`Day Operation Reports: ${dayOperationReportCount} remaining`);

    const totalRemaining = materialCount + stockCount + menuCount + ingredientCount + userCount + employeeCount + orderCount + printerCount + auditLogCount + categoryCount + tableCount + dayOperationCount + dayOperationReportCount;

    if (totalRemaining === 0) {
      console.log("\n✅ All tables successfully truncated!");
      // Reset sequences after successful truncation
      await resetSequences();
    } else {
      console.log(`\n⚠️ ${totalRemaining} records may still exist across all tables`);
    }

    await sequelize.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error truncating tables:", error);
    process.exit(1);
  }
}

truncateTables();
