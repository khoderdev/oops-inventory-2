// import sequelize from "../config/database.js";
// import Assignment from "./Assignment.js";
// import Material from "./materials.js";
// import { MenuItem, MenuItemIngredient } from "./menuItems.js";
// import Sale from "./sale.js";
// import SaleMenuItem from "./SaleMenuItem.js";
// import Section from "./sections.js";
// import StockEntry from "./StockEntry.js";

// // Material ↔ StockEntry
// Material.hasMany(StockEntry, {
//   foreignKey: "materialId",
//   as: "stockEntries",
//   onDelete: "CASCADE", // Delete stock entries if material is deleted
//   onUpdate: "CASCADE"
// });
// StockEntry.belongsTo(Material, {
//   foreignKey: "materialId",
//   as: "material", // Consistent lowercase alias
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });

// // Material ↔ Assignment
// Material.hasMany(Assignment, {
//   foreignKey: "materialId",
//   as: "assignments",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });
// Assignment.belongsTo(Material, {
//   foreignKey: "materialId",
//   as: "material", // Consistent lowercase alias
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });

// // Section ↔ Assignment
// Section.hasMany(Assignment, {
//   foreignKey: "sectionId",
//   as: "assignments",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });
// Assignment.belongsTo(Section, {
//   foreignKey: "sectionId",
//   as: "section", // Changed to lowercase for consistency
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });

// // StockEntry ↔ Assignment
// StockEntry.hasMany(Assignment, {
//   foreignKey: "stockEntryId",
//   as: "assignments",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });
// Assignment.belongsTo(StockEntry, {
//   foreignKey: "stockEntryId",
//   as: "stockEntry", // Changed to lowercase for consistency
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });

// // MenuItem ↔ Material (through MenuItemIngredient)
// MenuItem.belongsToMany(Material, {
//   through: MenuItemIngredient,
//   foreignKey: "menuItemId",
//   otherKey: "materialId",
//   as: "ingredients",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });
// Material.belongsToMany(MenuItem, {
//   through: MenuItemIngredient,
//   foreignKey: "materialId",
//   otherKey: "menuItemId",
//   as: "menuItems",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });

// // MenuItem ↔ MenuItemIngredient
// MenuItem.hasMany(MenuItemIngredient, {
//   foreignKey: "menuItemId",
//   as: "menuItemIngredients",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });
// MenuItemIngredient.belongsTo(MenuItem, {
//   foreignKey: "menuItemId",
//   as: "menuItem",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });

// // Material ↔ MenuItemIngredient
// Material.hasMany(MenuItemIngredient, {
//   foreignKey: "materialId",
//   as: "menuItemIngredients",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });
// MenuItemIngredient.belongsTo(Material, {
//   foreignKey: "materialId",
//   as: "material",
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE"
// });

// // Sale ↔ MenuItem (Added based on salesController)
// MenuItem.hasMany(Sale, {
//   foreignKey: "menuItemId",
//   as: "sales",
//   onDelete: "CASCADE", // Delete sales if menu item is deleted
//   onUpdate: "CASCADE"
// });

// Sale.belongsTo(MenuItem, {
//   foreignKey: "menuItemId",
//   as: "menuItem", // Matches salesController alias
//   onDelete: "RESTRICT", // Prevent deletion of menu item if sales exist (adjust based on requirements)
//   onUpdate: "CASCADE"
// });

// export { Assignment, Material, MenuItem, MenuItemIngredient, Sale, SaleMenuItem, Section, sequelize, StockEntry };

// ///////////////////////////////////////////////
// ///////////////////////////////////////////////
// ///////////////////////////////////////////////
// ///////////////////////////////////////////////
// ///////////////////////////////////////////////
import sequelize from "../config/database.js";
import Assignment from "./Assignment.js";
import Material from "./materials.js";
import { MenuItem, MenuItemIngredient } from "./menuItems.js";
import Sale from "./sale.js";
import SaleMenuItem from "./SaleMenuItem.js";
import Section from "./sections.js";
import StockEntry from "./StockEntry.js";

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
  as: "menuItems",
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
  as: "menuItems",
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
  onDelete: "RESTRICT",
  onUpdate: "CASCADE"
});
Section.hasMany(Sale, {
  foreignKey: "sectionId",
  as: "sales",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

export { Assignment, Material, MenuItem, MenuItemIngredient, Sale, SaleMenuItem, Section, sequelize, StockEntry };
