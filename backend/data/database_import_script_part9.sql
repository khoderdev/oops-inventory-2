-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 9: MORE MENU ITEM INGREDIENTS
-- This script continues adding menu item ingredients relationships

BEGIN;

-- Ensure unique constraint exists on menuItemIngredients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'menuItemIngredients_menuItemId_materialId_unique'
    ) THEN
        ALTER TABLE "menuItemIngredients" ADD CONSTRAINT menuItemIngredients_menuItemId_materialId_unique UNIQUE ("menuItemId", "materialId");
    END IF;
END $$;

-- Continue inserting menu item ingredients relationships
DO $$
DECLARE
    menu_item_id INTEGER;
    material_id INTEGER;
BEGIN
    -- chocolate shake ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'chocolate shake';
    SELECT id INTO material_id FROM materials WHERE name = 'chocolate powder';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 30, 'G', 0.390000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'milk liquid';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 100, 'ML', 0.144444, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'whipped crème';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.159111, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- chocolate strawberry shake ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'chocolate strawberry shake';
    SELECT id INTO material_id FROM materials WHERE name = 'chocolate powder';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 30, 'G', 0.390000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'milk liquid';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 100, 'ML', 0.144444, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'strawberry syrup';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 32, 'ML', 0.291264, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'whipped crème';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.159111, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- coca cola ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'coca cola';
    SELECT id INTO material_id FROM materials WHERE name = 'coca cola';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.520833, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- coca cola + grenadine ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'coca cola + grenadine';
    SELECT id INTO material_id FROM materials WHERE name = 'coca cola';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.520833, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'grenadine';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'CL', 0.091020, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- espresso ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'espresso';
    SELECT id INTO material_id FROM materials WHERE name = 'espresso coffee';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.130000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- fanta ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'fanta';
    SELECT id INTO material_id FROM materials WHERE name = 'fanta';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.520833, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- fanta + grenadine ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'fanta + grenadine';
    SELECT id INTO material_id FROM materials WHERE name = 'fanta';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.520833, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'grenadine';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'CL', 0.091020, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- frappucino caramel ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'frappucino caramel';
    SELECT id INTO material_id FROM materials WHERE name = 'caramel sauce';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 32, 'ML', 0.317707, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'espresso coffee';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.130000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'milk liquid';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 100, 'ML', 0.144444, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'whipped crème';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.159111, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- frappucino chocolate ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'frappucino chocolate';
    SELECT id INTO material_id FROM materials WHERE name = 'chocolate powder';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 30, 'G', 0.390000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'espresso coffee';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.130000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'milk liquid';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 100, 'ML', 0.144444, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'whipped crème';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.159111, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- hot chocolate ingredients (already handled in part 8, skip duplicate)
    
    -- Add more beverage ingredients for existing menu items
    -- miranda ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'miranda';
    SELECT id INTO material_id FROM materials WHERE name = 'miranda';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.520833, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- pepsi diet ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'pepsi diet';
    SELECT id INTO material_id FROM materials WHERE name = 'pepsi diet';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.520833, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- water l ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'water l';
    SELECT id INTO material_id FROM materials WHERE name = 'water l';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.208333, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- water s ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'water s';
    SELECT id INTO material_id FROM materials WHERE name = 'water s';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.125000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- nescafe 2-1 ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'nescafe 2-1';
    SELECT id INTO material_id FROM materials WHERE name = 'nescafe 2-1';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.083333, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- nescafe 3-1 ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'nescafe 3-1';
    SELECT id INTO material_id FROM materials WHERE name = 'nescafe 3-1';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.083333, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

END $$;

COMMIT;
