import sequelize from "../config/database.js";
import Assignment from "./Assignment.js";
import Department from "./Department.js";
import AuditLog from "./AuditLog.js";
import BackupSchedule from "./BackupSchedule.js";
import Category from "./Category.js";
import CategoryType from "./CategoryType.js";
import DayOperation from "./dayOperation.js";
import DayOperationReport from "./dayOperationsReports.js";
import Employee from "./Employee.js";
import EmployeeSettlement from "./EmployeeSettlement.js";
import EmployeeUsage from "./EmployeeUsage.js";
import Material from "./materials.js";
import { MenuItem, MenuItemIngredient, MenuItemSauce } from "./menuItems.js";
import Sauce from "./Sauce.js";
import SauceIngredient from "./SauceIngredient.js";
import Variants from "./Variants.js";
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
import SystemLogs from "./StockEntryLogSimple.js";
import Table from "./Table.js";
import User from "./User.js";
import Wasting from "./wastings.js";
import Supplier from "./Supplier.js";
import SupplierSettlement from "./SupplierSettlement.js";
import SupplierInvoice from "./SupplierInvoice.js";


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

// Material ↔ Category (through CategoryType)
Material.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Category.hasMany(Material, {
  foreignKey: "categoryId",
  as: "materials",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// MenuItem ↔ Category (through CategoryType)
MenuItem.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Category.hasMany(MenuItem, {
  foreignKey: "categoryId",
  as: "menuItems",
  onDelete: "SET NULL",
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

// Department ↔ Employee (One-to-Many)
Department.hasMany(Employee, {
  foreignKey: "departmentId",
  as: "employees",
  onDelete: "RESTRICT", // Prevent department deletion if employees are assigned
  onUpdate: "CASCADE"
});

Employee.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE"
});

// Department manager relationship (Self-referencing through Employee)
Department.belongsTo(Employee, {
  foreignKey: "managerId",
  as: "manager",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// Add the reverse relationship for manager
Employee.hasMany(Department, {
  foreignKey: "managerId",
  as: "managedDepartments",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// User ↔ Department relationships for createdBy/updatedBy
User.hasMany(Department, {
  foreignKey: "createdBy",
  as: "createdDepartments",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

Department.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

User.hasMany(Department, {
  foreignKey: "updatedBy",
  as: "updatedDepartments",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

Department.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updater",
  onDelete: "SET NULL",
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

// SystemLogs relationships
SystemLogs.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
User.hasMany(SystemLogs, {
  foreignKey: "userId",
  as: "systemLogs",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

SystemLogs.belongsTo(StockEntry, {
  foreignKey: "stockEntryId",
  as: "stockEntry",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
StockEntry.hasMany(SystemLogs, {
  foreignKey: "stockEntryId",
  as: "systemLogs",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

SystemLogs.belongsTo(Material, {
  foreignKey: "materialId",
  as: "material",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Material.hasMany(SystemLogs, {
  foreignKey: "materialId",
  as: "systemLogs",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// DayOperation ↔ DayOperationReport
DayOperation.hasMany(DayOperationReport, {
  foreignKey: "dayOperationId",
  as: "reports",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
DayOperationReport.belongsTo(DayOperation, {
  foreignKey: "dayOperationId",
  as: "dayOperation",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// MenuItem ↔ Variants
MenuItem.hasMany(Variants, {
  foreignKey: "menuItemId",
  as: "variants",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Variants.belongsTo(MenuItem, {
  foreignKey: "menuItemId",
  as: "menuItem",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// MenuItem ↔ Sauce (through MenuItemSauce)
MenuItem.belongsToMany(Sauce, {
  through: MenuItemSauce,
  foreignKey: "menuItemId",
  otherKey: "sauceId",
  as: "sauces",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

Sauce.belongsToMany(MenuItem, {
  through: MenuItemSauce,
  foreignKey: "sauceId",
  otherKey: "menuItemId",
  as: "menuItems",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// MenuItem ↔ MenuItemSauce
MenuItem.hasMany(MenuItemSauce, {
  foreignKey: "menuItemId",
  as: "menuItemSauces",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

MenuItemSauce.belongsTo(MenuItem, {
  foreignKey: "menuItemId",
  as: "menuItem",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Sauce ↔ MenuItemSauce
Sauce.hasMany(MenuItemSauce, {
  foreignKey: "sauceId",
  as: "menuItemSauces",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

MenuItemSauce.belongsTo(Sauce, {
  foreignKey: "sauceId",
  as: "sauce",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Sauce ↔ SauceIngredient
Sauce.hasMany(SauceIngredient, {
  foreignKey: "sauceId",
  as: "ingredients",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
SauceIngredient.belongsTo(Sauce, {
  foreignKey: "sauceId",
  as: "sauce",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Material ↔ SauceIngredient
Material.hasMany(SauceIngredient, {
  foreignKey: "materialId",
  as: "sauceIngredients",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
SauceIngredient.belongsTo(Material, {
  foreignKey: "materialId",
  as: "material",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Sauce ↔ Material (through SauceIngredient)
Sauce.belongsToMany(Material, {
  through: SauceIngredient,
  foreignKey: "sauceId",
  otherKey: "materialId",
  as: "materials",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Material.belongsToMany(Sauce, {
  through: SauceIngredient,
  foreignKey: "materialId",
  otherKey: "sauceId",
  as: "sauces",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// User ↔ Sauce (for createdBy and updatedBy)
User.hasMany(Sauce, {
  foreignKey: "createdBy",
  as: "createdSauces",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
User.hasMany(Sauce, {
  foreignKey: "updatedBy",
  as: "updatedSauces",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Sauce.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Sauce.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updater",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// Supplier ↔ SupplierSettlement
Supplier.hasMany(SupplierSettlement, {
  foreignKey: "supplierId",
  as: "settlements",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
SupplierSettlement.belongsTo(Supplier, {
  foreignKey: "supplierId",
  as: "supplier",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Supplier ↔ SupplierInvoice
Supplier.hasMany(SupplierInvoice, {
  foreignKey: "supplierId",
  as: "invoices",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
SupplierInvoice.belongsTo(Supplier, {
  foreignKey: "supplierId",
  as: "supplier",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

// Supplier ↔ StockEntry (for tracking which supplier provided materials)
StockEntry.belongsTo(Supplier, {
  foreignKey: "supplierId",
  as: "supplier",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
Supplier.hasMany(StockEntry, {
  foreignKey: "supplierId",
  as: "stockEntries",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

// User ↔ SupplierSettlement (who processed the payment)
User.hasMany(SupplierSettlement, {
  foreignKey: "settledBy",
  as: "processedSettlements",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});
SupplierSettlement.belongsTo(User, {
  foreignKey: "settledBy",
  as: "processedBy",
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
});

export { Assignment, AuditLog, BackupSchedule, Category, CategoryType, DayOperation, DayOperationReport, Department, Employee, EmployeeSettlement, EmployeeUsage, Material, MenuItem, MenuItemIngredient,MenuItemSauce, Order, OrderItem, Printer, PrinterChannel, PrintJob, Sale, SaleMenuItem, Sauce, SauceIngredient, ScheduleExecution, Section, sequelize, Session, StockEntry, SystemLogs, Table, User, Variants, Wasting, Supplier, SupplierSettlement, SupplierInvoice };
