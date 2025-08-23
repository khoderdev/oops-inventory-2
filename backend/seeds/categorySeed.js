import Category from "../models/Category.js";
import CategoryType from "../models/CategoryType.js";
import { Op } from "sequelize";

const DEFAULT_CATEGORY_TYPES = [
  { type: 'materials' },
  { type: 'menu_items' },
  { type: 'beverages' }
];

// Default material categories from your existing MATERIAL_CATEGORIES
const DEFAULT_MATERIAL_CATEGORIES = [
  { name: "Meat & Poultry", value: "meat", type: "materials", sortOrder: 1 },
  { name: "Seafood & Fish", value: "seafood", type: "materials", sortOrder: 2 },
  { name: "Dairy Products", value: "dairy", type: "materials", sortOrder: 3 },
  { name: "Vegetables", value: "vegetables", type: "materials", sortOrder: 4 },
  { name: "Fruits", value: "fruits", type: "materials", sortOrder: 5 },
  { name: "Sweets", value: "sweets", type: "materials", sortOrder: 6 },
  { name: "Grains & Cereals", value: "grains", type: "materials", sortOrder: 7 },
  { name: "Spices & Seasonings", value: "spices", type: "materials", sortOrder: 8 },
  { name: "Beverages", value: "beverages", type: "materials", sortOrder: 9 },
  { name: "Alcohol", value: "alcohol", type: "materials", sortOrder: 10 },
  { name: "Hot", value: "hot", type: "materials", sortOrder: 11 },
  { name: "Cold", value: "cold", type: "materials", sortOrder: 12 },
  { name: "Tobacco", value: "tobacco", type: "materials", sortOrder: 13 },
  { name: "Packaging", value: "packaging", type: "materials", sortOrder: 14 },
  { name: "Other", value: "other", type: "materials", sortOrder: 15 }
];

// Default menu item categories from your existing MenuItem model
const DEFAULT_MENU_CATEGORIES = [
  { name: "Appetizers", value: "appetizers", type: "menu_items", sortOrder: 1 },
  { name: "Burgers", value: "burgers", type: "menu_items", sortOrder: 2 },
  { name: "Sandwiches", value: "sandwiches", type: "menu_items", sortOrder: 3 },
  { name: "Plates", value: "plates", type: "menu_items", sortOrder: 4 },
  { name: "Pasta", value: "pasta", type: "menu_items", sortOrder: 5 },
  { name: "Sushi", value: "sushi", type: "menu_items", sortOrder: 6 },
  { name: "Pizza", value: "pizza", type: "menu_items", sortOrder: 7 },
  { name: "Salads", value: "salads", type: "menu_items", sortOrder: 8 },
  { name: "Desserts", value: "desserts", type: "menu_items", sortOrder: 9 },
  { name: "Breakfast", value: "breakfast", type: "menu_items", sortOrder: 13 },
  { name: "Shisha", value: "shisha", type: "menu_items", sortOrder: 14 }
];

const DEFAULT_BEVERAGES_CATEGORIES = [
  { name: "Cold Drinks", value: "cold", type: "beverages", sortOrder: 1 },
  { name: "Hot Drinks", value: "hot", type: "beverages", sortOrder: 2 },
  { name: "Alcohol", value: "alcohol", type: "beverages", sortOrder: 3 },
  { name: "Juices", value: "juices", type: "beverages", sortOrder: 4 },
];

export const seedCategories = async () => {
  try {
    console.log("🌱 Starting category seeding...");

    // First, seed the category types
    console.log("🔄 Seeding category types...");
    const categoryTypeMap = {};
    
    // Create category types first
    for (const typeData of ["materials", "menu_items", "beverages"]) {
      const [categoryType, created] = await CategoryType.findOrCreate({
        where: { type: typeData },
        defaults: { type: typeData }
      });
      
      categoryTypeMap[typeData] = categoryType.id;
      
      if (created) {
        console.log(`✅ Created category type: ${categoryType.type} (ID: ${categoryType.id})`);
      } else {
        console.log(`⏭️  Category type already exists: ${categoryType.type} (ID: ${categoryType.id})`);
      }
    }
    
    // Now seed the categories with proper categoryTypeIds
    console.log("🔄 Seeding categories...");
    
    // Combine material, menu and beverage categories (not the types)
    const allCategories = [...DEFAULT_MATERIAL_CATEGORIES, ...DEFAULT_MENU_CATEGORIES, ...DEFAULT_BEVERAGES_CATEGORIES];
    const createdCategories = [];
    
    for (const categoryData of allCategories) {
      // Extract type and convert to categoryTypeId
      const { type, ...categoryDataWithoutType } = categoryData;
      const categoryTypeId = categoryTypeMap[type];
      
      if (!categoryTypeId) {
        console.warn(`⚠️ Category type '${type}' not found for category '${categoryData.name}'. Skipping.`);
        continue;
      }
      
      // Find or create the category with proper categoryTypeIds
      const [category, created] = await Category.findOrCreate({
        where: { value: categoryData.value },
        defaults: {
          ...categoryDataWithoutType,
          categoryTypeIds: [categoryTypeId],
          isActive: true
        }
      });
      
      // If category exists but doesn't have this categoryTypeId, update it
      if (!created && category.categoryTypeIds && !category.categoryTypeIds.includes(categoryTypeId)) {
        await category.update({
          categoryTypeIds: [...category.categoryTypeIds, categoryTypeId]
        });
        console.log(`🔄 Updated category: ${category.name} with categoryTypeId: ${categoryTypeId}`);
      }
      
      if (created) {
        createdCategories.push(category);
        console.log(`✅ Created category: ${category.name} (type: ${type}, categoryTypeId: ${categoryTypeId})`);
      } else {
        console.log(`⏭️  Category already exists: ${category.name} (type: ${type}, categoryTypeId: ${categoryTypeId})`);
      }
    }

    console.log(`🎉 Category seeding completed! Created ${createdCategories.length} new categories.`);
    return createdCategories;
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  }
};

// Function to get categories formatted for frontend dropdowns
export const getCategoriesForDropdown = async (type = null) => {
  try {
    const whereClause = { isActive: true };
    let categoryTypeId = null;
    
    // If type is specified, find the corresponding categoryTypeId
    if (type) {
      const categoryType = await CategoryType.findOne({
        where: { type },
        attributes: ['id']
      });
      
      if (categoryType) {
        categoryTypeId = categoryType.id;
      } else {
        console.warn(`⚠️ Category type '${type}' not found`);
        return [];
      }
    }
    
    // Build the query based on categoryTypeId
    if (categoryTypeId) {
      whereClause.categoryTypeIds = {
        [Op.contains]: [categoryTypeId]
      };
    }

    const categories = await Category.findAll({
      where: whereClause,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'value', 'name', 'categoryTypeIds']
    });
    
    // Get all category types for mapping
    const categoryTypes = await CategoryType.findAll();
    const typeMap = {};
    categoryTypes.forEach(ct => {
      typeMap[ct.id] = ct.type;
    });

    return categories.map(cat => ({
      id: cat.id,
      value: cat.value,
      label: cat.name,
      // Map the first categoryTypeId to a type string for backwards compatibility
      type: cat.categoryTypeIds && cat.categoryTypeIds.length > 0 ? 
            typeMap[cat.categoryTypeIds[0]] || null : null
    }));
  } catch (error) {
    console.error("❌ Error fetching categories for dropdown:", error);
    throw error;
  }
};

export default { seedCategories, getCategoriesForDropdown };
