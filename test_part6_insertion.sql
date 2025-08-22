-- TEST SCRIPT: Diagnose why Part 6 menu items aren't inserting
-- This script will help identify the exact issue

-- Step 1: Check current menu items count
SELECT 'BEFORE INSERT - Menu Items Count:' as info, COUNT(*) as count FROM "menuItems";

-- Step 2: Check if category IDs exist
SELECT 'CHECKING CATEGORY IDs:' as info;
SELECT id, name, value FROM categories WHERE id IN (19, 25, 26) ORDER BY id;

-- Step 3: Try inserting just ONE menu item to see what happens
BEGIN;

INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
    ('TEST_7up', '7up soft drink TEST', 25, 2.50, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Check if it was inserted
SELECT 'AFTER TEST INSERT:' as info, COUNT(*) as count FROM "menuItems" WHERE name = 'TEST_7up';

ROLLBACK;

-- Step 4: Check if there are existing items with same names
SELECT 'EXISTING ITEMS WITH SAME NAMES:' as info;
SELECT name, "categoryId" FROM "menuItems" 
WHERE name IN ('7up', 'pepsi', 'redbull', 'espresso', 'almaza beer', 'apple', 'mint')
ORDER BY name;

-- Step 5: Check constraints on menuItems table
SELECT 'TABLE CONSTRAINTS:' as info;
SELECT conname, contype FROM pg_constraint 
WHERE conrelid = '"menuItems"'::regclass;

-- Step 6: Check table structure
SELECT 'TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'menuItems' 
ORDER BY ordinal_position;
