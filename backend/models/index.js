import sequelize from "../config/database.js";
import Assignment from "./Assignment.js";
import AuditLog from "./AuditLog.js";
import BackupSchedule from "./BackupSchedule.js";
import DayOperation from "./dayOperation.js";
import Employee from "./Employee.js";
import EmployeeSettlement from "./EmployeeSettlement.js";
import EmployeeUsage from "./EmployeeUsage.js";
import Material from "./materials.js";
import { MenuItem, MenuItemIngredient } from "./menuItems.js";
import Order from "./Order.js";
import OrderItem from "./OrderItem.js";
import Printer from "./Printer.js";
import PrinterChannel from "./PrinterChannel.js";
import PrintJob from "./PrintJob.js";
import Sale from "./sale.js";
import SaleMenuItem from "./SaleMenuItem.js";
import ScheduleExecution from "./ScheduleExecution.js";
import Section from "./sections.js";
import Session from "./Session.js";
import StockEntry from "./StockEntry.js";
import StockEntryLogSimple from "./StockEntryLogSimple.js";
import Table from "./Table.js";
import User from "./User.js";
import Wasting from "./wastings.js";

// Material ↔ StockEntry
Material.hasMany(StockEntry, {
  foreignKey: "materialId",
  as: "stockEntries",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
StockEntry.belongsTo(Material, {
  foreignKey: "materialId",
  as: "material",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Material ↔ Assignment
Material.hasMany(Assignment, {
  foreignKey: "materialId",
  as: "assignments",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Assignment.belongsTo(Material, {
  foreignKey: "materialId",
  as: "material",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Section ↔ Assignment
Section.hasMany(Assignment, {
  foreignKey: "sectionId",
  as: "assignments",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Assignment.belongsTo(Section, {
  foreignKey: "sectionId",
  as: "section",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// StockEntry ↔ Assignment
StockEntry.hasMany(Assignment, {
  foreignKey: "stockEntryId",
  as: "assignments",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Assignment.belongsTo(StockEntry, {
  foreignKey: "stockEntryId",
  as: "stockEntry",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// MenuItem ↔ Assignment
MenuItem.hasMany(Assignment, {
  foreignKey: "menuItemId",
  as: "assignments",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Assignment.belongsTo(MenuItem, {
  foreignKey: "menuItemId",
  as: "menuItem",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// MenuItem ↔ Material (through MenuItemIngredient)
MenuItem.belongsToMany(Material, {
  through: MenuItemIngredient,
  foreignKey: "menuItemId",
  otherKey: "materialId",
  as: "ingredients",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Material.belongsToMany(MenuItem, {
  through: MenuItemIngredient,
  foreignKey: "materialId",
  otherKey: "menuItemId",
  as: "menuItem",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// MenuItem ↔ MenuItemIngredient
MenuItem.hasMany(MenuItemIngredient, {
  foreignKey: "menuItemId",
  as: "menuItemIngredients",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
MenuItemIngredient.belongsTo(MenuItem, {
  foreignKey: "menuItemId",
  as: "menuItem",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Material ↔ MenuItemIngredient
Material.hasMany(MenuItemIngredient, {
  foreignKey: "materialId",
  as: "menuItemIngredients",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
MenuItemIngredient.belongsTo(Material, {
  foreignKey: "materialId",
  as: "material",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Sale ↔ SaleMenuItem
Sale.hasMany(SaleMenuItem, {
  foreignKey: "saleId",
  as: "menuItem",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
SaleMenuItem.belongsTo(Sale, {
  foreignKey: "saleId",
  as: "sale",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// MenuItem ↔ SaleMenuItem
MenuItem.hasMany(SaleMenuItem, {
  foreignKey: "menuItemId",
  as: "saleMenuItems",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
SaleMenuItem.belongsTo(MenuItem, {
  foreignKey: "menuItemId",
  as: "menuItem",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Sale ↔ Section
Sale.belongsTo(Section, {
  foreignKey: "sectionId",
  as: "section",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

Sale.belongsTo(User, {
  foreignKey: "userId",
  as: "creator",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

Section.hasMany(Sale, {
  foreignKey: "sectionId",
  as: "sales",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// StockEntry ↔ Wasting
StockEntry.hasMany(Wasting, {
  foreignKey: "stockEntryId",
  as: "wastings",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Wasting.belongsTo(StockEntry, {
  foreignKey: "stockEntryId",
  as: "stockEntry",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// User ↔ Session
User.hasMany(Session, {
  foreignKey: "userId",
  as: "sessions",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Session.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// User ↔ AuditLog
User.hasMany(AuditLog, {
  foreignKey: "userId",
  as: "auditLogs",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
AuditLog.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// User self-referencing relationships for createdBy/updatedBy
User.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
User.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updater",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// Order ↔ OrderItem
Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  as: "items",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
OrderItem.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Table ↔ Order
Table.hasMany(Order, {
  foreignKey: "tableId",
  as: "orders",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Order.belongsTo(Table, {
  foreignKey: "tableId",
  as: "table",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// Order ↔ Sale
Order.belongsTo(Sale, {
  foreignKey: "saleId",
  as: "sale",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Sale.hasOne(Order, {
  foreignKey: "saleId",
  as: "order",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// OrderItem ↔ Material
OrderItem.belongsTo(Material, {
  foreignKey: "materialId",
  as: "material",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Material.hasMany(OrderItem, {
  foreignKey: "materialId",
  as: "orderItems",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// OrderItem ↔ MenuItem
OrderItem.belongsTo(MenuItem, {
  foreignKey: "menuItemId",
  as: "menuItem",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
MenuItem.hasMany(OrderItem, {
  foreignKey: "menuItemId",
  as: "orderItems",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// OrderItem ↔ Assignment
OrderItem.belongsTo(Assignment, {
  foreignKey: "assignmentId",
  as: "assignment",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Assignment.hasMany(OrderItem, {
  foreignKey: "assignmentId",
  as: "orderItems",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// User ↔ Order (createdBy/updatedBy)
Order.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Order.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updater",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
User.hasMany(Order, {
  foreignKey: "createdBy",
  as: "createdOrders",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
User.hasMany(Order, {
  foreignKey: "updatedBy",
  as: "updatedOrders",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// User ↔ Employee (One-to-One)
User.hasOne(Employee, {
  foreignKey: "userId",
  as: "employee",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Employee.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Employee ↔ EmployeeUsage (One-to-Many)
Employee.hasMany(EmployeeUsage, {
  foreignKey: "employeeId",
  as: "usages",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
EmployeeUsage.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Employee ↔ EmployeeSettlement (One-to-Many)
Employee.hasMany(EmployeeSettlement, {
  foreignKey: "employeeId",
  as: "settlements",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
EmployeeSettlement.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// EmployeeUsage ↔ Material
EmployeeUsage.belongsTo(Material, {
  foreignKey: "materialId",
  as: "material",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Material.hasMany(EmployeeUsage, {
  foreignKey: "materialId",
  as: "employeeUsages",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// EmployeeUsage ↔ MenuItem
EmployeeUsage.belongsTo(MenuItem, {
  foreignKey: "menuItemId",
  as: "menuItem",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
MenuItem.hasMany(EmployeeUsage, {
  foreignKey: "menuItemId",
  as: "employeeUsages",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// EmployeeUsage ↔ StockEntry
EmployeeUsage.belongsTo(StockEntry, {
  foreignKey: "stockEntryId",
  as: "stockEntry",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
StockEntry.hasMany(EmployeeUsage, {
  foreignKey: "stockEntryId",
  as: "employeeUsages",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// EmployeeUsage ↔ EmployeeSettlement
EmployeeUsage.belongsTo(EmployeeSettlement, {
  foreignKey: "settlementId",
  as: "settlement",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
EmployeeSettlement.hasMany(EmployeeUsage, {
  foreignKey: "settlementId",
  as: "usageItems",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// User relationships for Employee management (createdBy/updatedBy)
Employee.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Employee.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updater",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

EmployeeUsage.belongsTo(User, {
  foreignKey: "recordedBy",
  as: "recorder",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE"
});

EmployeeSettlement.belongsTo(User, {
  foreignKey: "processedBy",
  as: "processor",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE"
});
EmployeeSettlement.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approver",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// Printer System Relationships

// User ↔ PrinterChannel (createdBy)
User.hasMany(PrinterChannel, {
  foreignKey: "createdBy",
  as: "printerChannels",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE"
});
PrinterChannel.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE"
});

// PrinterChannel ↔ Printer
PrinterChannel.hasMany(Printer, {
  foreignKey: "channelId",
  as: "printers",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Printer.belongsTo(PrinterChannel, {
  foreignKey: "channelId",
  as: "channel",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// User ↔ Printer (createdBy)
User.hasMany(Printer, {
  foreignKey: "createdBy",
  as: "printers",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE"
});
Printer.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE"
});

// PrinterChannel ↔ PrintJob
PrinterChannel.hasMany(PrintJob, {
  foreignKey: "channelId",
  as: "printJobs",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
PrintJob.belongsTo(PrinterChannel, {
  foreignKey: "channelId",
  as: "channel",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Printer ↔ PrintJob
Printer.hasMany(PrintJob, {
  foreignKey: "printerId",
  as: "printJobs",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
PrintJob.belongsTo(Printer, {
  foreignKey: "printerId",
  as: "printer",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// User ↔ PrintJob (proper foreign key)
User.hasMany(PrintJob, {
  foreignKey: "userId",
  as: "printJobs",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
PrintJob.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// Printer relationships
// StockEntry ↔ Printer (for individual item printer assignment)
StockEntry.belongsTo(Printer, {
  foreignKey: "printerId",
  as: "assignedPrinter",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Printer.hasMany(StockEntry, {
  foreignKey: "printerId",
  as: "assignedStockEntries",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// MenuItem ↔ Printer (for individual menu item printer assignment)
MenuItem.belongsTo(Printer, {
  foreignKey: "printerId",
  as: "assignedPrinter",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Printer.hasMany(MenuItem, {
  foreignKey: "printerId",
  as: "assignedMenuItems",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

export { Assignment, AuditLog, BackupSchedule, DayOperation, Employee, EmployeeSettlement, EmployeeUsage, Material, MenuItem, MenuItemIngredient, Order, OrderItem, Printer, PrinterChannel, PrintJob, Sale, SaleMenuItem, ScheduleExecution, Section, sequelize, Session, StockEntry, StockEntryLogSimple, Table, User, Wasting };
