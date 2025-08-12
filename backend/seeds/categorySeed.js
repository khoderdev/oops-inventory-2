import Category from "../models/Category.js";

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
  { name: "Cold Beverages", value: "cold", type: "menu_items", sortOrder: 10 },
  { name: "Hot Beverages", value: "hot", type: "menu_items", sortOrder: 11 },
  { name: "Alcohol", value: "alcohol", type: "menu_items", sortOrder: 12 },
  { name: "Breakfast", value: "breakfast", type: "menu_items", sortOrder: 13 },
  { name: "Shisha", value: "shisha", type: "menu_items", sortOrder: 14 }
];

export const seedCategories = async () => {
  try {
    console.log("🌱 Starting category seeding...");

    // Combine all default categories
    const allCategories = [...DEFAULT_MATERIAL_CATEGORIES, ...DEFAULT_MENU_CATEGORIES];

    // Use upsert to avoid duplicates
    const createdCategories = [];
    
    for (const categoryData of allCategories) {
      const [category, created] = await Category.findOrCreate({
        where: { value: categoryData.value },
        defaults: {
          ...categoryData,
          isActive: true
        }
      });
      
      if (created) {
        createdCategories.push(category);
        console.log(`✅ Created category: ${category.name} (${category.type})`);
      } else {
        console.log(`⏭️  Category already exists: ${category.name} (${category.type})`);
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
    if (type) {
      whereClause.type = type;
    }

    const categories = await Category.findAll({
      where: whereClause,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      attributes: ['value', 'name', 'type']
    });

    return categories.map(cat => ({
      value: cat.value,
      label: cat.name,
      type: cat.type
    }));
  } catch (error) {
    console.error("❌ Error fetching categories for dropdown:", error);
    throw error;
  }
};

export default { seedCategories, getCategoriesForDropdown };
