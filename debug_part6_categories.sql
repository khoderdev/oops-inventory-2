-- DEBUG SCRIPT: Check why Part 6 menu items aren't inserting
-- This script checks what categories exist vs what Part 6 is looking for

-- Check all existing categories
SELECT 'EXISTING CATEGORIES:' as info;
SELECT id, name, value, type FROM categories ORDER BY id;

-- Check specifically for categories that Part 6 is looking for
SELECT 'CATEGORIES PART 6 IS LOOKING FOR:' as info;
SELECT 
    'appetizers' as looking_for,
    (SELECT id FROM categories WHERE value = 'appetizers') as found_id,
    (SELECT name FROM categories WHERE value = 'appetizers') as found_name;

SELECT 
    'platters' as looking_for,
    (SELECT id FROM categories WHERE value = 'platters') as found_id,
    (SELECT name FROM categories WHERE value = 'platters') as found_name;

SELECT 
    'cold_drinks' as looking_for,
    (SELECT id FROM categories WHERE value = 'cold_drinks') as found_id,
    (SELECT name FROM categories WHERE value = 'cold_drinks') as found_name;

SELECT 
    'hot_drinks' as looking_for,
    (SELECT id FROM categories WHERE value = 'hot_drinks') as found_id,
    (SELECT name FROM categories WHERE value = 'hot_drinks') as found_name;

SELECT 
    'alchool' as looking_for,
    (SELECT id FROM categories WHERE value = 'alchool') as found_id,
    (SELECT name FROM categories WHERE value = 'alchool') as found_name;

SELECT 
    'tobacco' as looking_for,
    (SELECT id FROM categories WHERE value = 'tobacco') as found_id,
    (SELECT name FROM categories WHERE value = 'tobacco') as found_name;

-- Check if any menu items from Part 6 already exist
SELECT 'EXISTING MENU ITEMS FROM PART 6:' as info;
SELECT name, "categoryId" FROM "menuItems" 
WHERE name IN ('7up', 'pepsi', 'redbull', 'espresso', 'almaza beer', 'apple', 'mint')
ORDER BY name;
