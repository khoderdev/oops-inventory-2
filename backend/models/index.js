import sequelize from "../config/database.js";
import Assignment from "./Assignment.js";
import Material from "./materials.js";
import { MenuItem, MenuItemIngredient } from "./menuItems.js";
import Section from "./sections.js";
import StockEntry from "./StockEntry.js";

// Material ↔ StockEntry
Material.hasMany(StockEntry, { foreignKey: "materialId", as: "stockEntries" });
StockEntry.belongsTo(Material, { foreignKey: "materialId", as: "material" }); // lowercase 'material'

// Material ↔ Assignment
Material.hasMany(Assignment, { foreignKey: "materialId", as: "assignments" });
Assignment.belongsTo(Material, { foreignKey: "materialId", as: "material" }); // lowercase 'material'

// Section ↔ Assignment
Section.hasMany(Assignment, { foreignKey: "sectionId", as: "assignments" });
Assignment.belongsTo(Section, { foreignKey: "sectionId", as: "Section" }); // Section alias stays capitalized

// StockEntry ↔ Assignment
StockEntry.hasMany(Assignment, { foreignKey: "stockEntryId", as: "assignments" });
Assignment.belongsTo(StockEntry, { foreignKey: "stockEntryId", as: "StockEntry" }); // StockEntry alias capitalized

// MenuItem ↔ Material (through MenuItemIngredient)
MenuItem.belongsToMany(Material, {
  through: MenuItemIngredient,
  foreignKey: "menuItemId",
  otherKey: "materialId",
  as: "ingredients"
});
Material.belongsToMany(MenuItem, {
  through: MenuItemIngredient,
  foreignKey: "materialId",
  otherKey: "menuItemId",
  as: "menuItems"
});

// MenuItem ↔ MenuItemIngredient
MenuItem.hasMany(MenuItemIngredient, {
  foreignKey: "menuItemId",
  as: "menuItemIngredients"
});
MenuItemIngredient.belongsTo(MenuItem, {
  foreignKey: "menuItemId",
  as: "menuItem"
});

// Material ↔ MenuItemIngredient
Material.hasMany(MenuItemIngredient, {
  foreignKey: "materialId",
  as: "menuItemIngredients"
});
MenuItemIngredient.belongsTo(Material, {
  foreignKey: "materialId",
  as: "material"
});

export { Assignment, Material, MenuItem, MenuItemIngredient, Section, sequelize, StockEntry };
