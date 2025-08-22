-- COMPREHENSIVE DATABASE IMPORT SCRIPT - FINAL EXECUTION GUIDE
-- This script provides instructions for running all parts of the database import

-- IMPORTANT: Execute these scripts in the exact order listed below
-- Each script builds upon the previous one and maintains referential integrity

-- EXECUTION ORDER:
-- 1. database_import_script_part1.sql  - Category types, categories, initial materials
-- 2. database_import_script_part2.sql  - Dairy, proteins, and other material categories
-- 3. database_import_script_part3.sql  - Vegetables, sauces, fruits materials
-- 4. database_import_script_part4.sql  - Syrups, grains, bread, alcohol, tobacco, desserts
-- 5. database_import_script_part5.sql  - Stock entries with cost and quantity data
-- 6. database_import_script_part6.sql  - Menu items with proper category references
-- 7. database_import_script_part7.sql  - Additional menu items (milkshakes, smoothies, etc.)
-- 8. database_import_script_part8.sql  - Menu item ingredients relationships (part 1)
-- 9. database_import_script_part9.sql  - Menu item ingredients relationships (part 2)

-- POSTGRESQL EXECUTION COMMANDS:
-- Run these commands in your PostgreSQL client (psql, pgAdmin, etc.)

-- \i database_import_script_part1.sql
-- \i database_import_script_part2.sql
-- \i database_import_script_part3.sql
-- \i database_import_script_part4.sql
-- \i database_import_script_part5.sql
-- \i database_import_script_part6.sql
-- \i database_import_script_part7.sql
-- \i database_import_script_part8.sql
-- \i database_import_script_part9.sql

-- ALTERNATIVE: Single command execution
-- You can also run all scripts in sequence with:
-- cat database_import_script_part*.sql | psql -d inventory_db1 -U your_username

-- VERIFICATION QUERIES:
-- After running all scripts, verify the data with these queries:

SELECT 'Category Types' as table_name, COUNT(*) as count FROM "categoryTypes"
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Materials', COUNT(*) FROM materials
UNION ALL
SELECT 'Stock Entries', COUNT(*) FROM "stockEntries"
UNION ALL
SELECT 'Menu Items', COUNT(*) FROM "menuItems"
UNION ALL
SELECT 'Menu Item Ingredients', COUNT(*) FROM "menuItemIngredients";

-- Check category relationships
SELECT c.name as category_name, COUNT(m.id) as material_count
FROM categories c
LEFT JOIN materials m ON c.id = m."categoryId"
WHERE c."categoryTypeIds" @> ARRAY[2]  -- Material categories
GROUP BY c.id, c.name
ORDER BY material_count DESC;

-- Check menu item relationships
SELECT c.name as category_name, COUNT(mi.id) as menu_item_count
FROM categories c
LEFT JOIN "menuItems" mi ON c.id = mi."categoryId"
WHERE c."categoryTypeIds" @> ARRAY[1]  -- Menu item categories
GROUP BY c.id, c.name
ORDER BY menu_item_count DESC;

-- Check menu item ingredients
SELECT mi.name as menu_item, COUNT(mii.id) as ingredient_count
FROM "menuItems" mi
LEFT JOIN "menuItemIngredients" mii ON mi.id = mii."menuItemId"
GROUP BY mi.id, mi.name
HAVING COUNT(mii.id) > 0
ORDER BY ingredient_count DESC
LIMIT 10;

-- NOTES:
-- 1. All scripts use ON CONFLICT DO NOTHING to prevent duplicate inserts
-- 2. Scripts respect foreign key relationships and data integrity
-- 3. Timestamps are automatically set for created_at and updated_at fields
-- 4. Scripts are idempotent - safe to run multiple times
-- 5. All monetary values are stored as DECIMAL for precision
-- 6. Unit conversions and validations are handled by the application layer

-- TROUBLESHOOTING:
-- If you encounter errors:
-- 1. Check that your database connection is active
-- 2. Ensure you have proper permissions (INSERT, SELECT)
-- 3. Verify the database schema matches the Sequelize models
-- 4. Check for any custom constraints or triggers that might interfere
-- 5. Review the error messages for specific constraint violations

-- BACKUP RECOMMENDATION:
-- Before running these scripts, create a backup of your database:
-- pg_dump -U your_username -d inventory_db1 > backup_before_import.sql
