-- VERIFICATION SCRIPT: Check current database state

-- Check categories
SELECT 'CATEGORIES' as table_name, COUNT(*) as count FROM categories;
SELECT id, name, value FROM categories ORDER BY id;

-- Check materials count
SELECT 'MATERIALS' as table_name, COUNT(*) as count FROM materials;

-- Check menu items
SELECT 'MENU_ITEMS' as table_name, COUNT(*) as count FROM "menuItems";
SELECT id, name, "categoryId" FROM "menuItems" ORDER BY id;

-- Check menu item ingredients
SELECT 'MENU_ITEM_INGREDIENTS' as table_name, COUNT(*) as count FROM "menuItemIngredients";
SELECT mi."menuItemId", mi."materialId", m.name as material_name, mi.quantity, mi.unit, mi.cost 
FROM "menuItemIngredients" mi
JOIN materials m ON m.id = mi."materialId"
ORDER BY mi."menuItemId";

-- Check stock entries
SELECT 'STOCK_ENTRIES' as table_name, COUNT(*) as count FROM "stockEntries";
