-- COMPREHENSIVE DATABASE IMPORT SCRIPT: MENU ITEM INGREDIENTS (FIXED)
-- This script creates all menu item ingredients relationships

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

-- Insert menu item ingredients relationships
DO $$
DECLARE
    menu_item_id INTEGER;
    material_id INTEGER;
BEGIN
    -- 7up menu item ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = '7up';
    SELECT id INTO material_id FROM materials WHERE name = '7up';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.520833, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- 7up + grenadine menu item ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = '7up + grenadine';
    SELECT id INTO material_id FROM materials WHERE name = '7up';
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

    -- almaza beer menu item ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'almaza beer';
    SELECT id INTO material_id FROM materials WHERE name = 'almaza';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.583333, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- american coffee menu item ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'american coffee';
    SELECT id INTO material_id FROM materials WHERE name = 'nescafe gold';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 5, 'G', 0.157895, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- apple shisha ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'apple';
    SELECT id INTO material_id FROM materials WHERE name = 'apple';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 38, 'G', 0.288800, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- cappucino ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'cappucino';
    SELECT id INTO material_id FROM materials WHERE name = 'cappucino';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.150000, NOW(), NOW())
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

    -- hot chocolate ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'hot chocolate';
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

    -- Add more ingredient relationships for existing menu items
    -- pepsi ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'pepsi';
    SELECT id INTO material_id FROM materials WHERE name = 'pepsi';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.520833, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- redbull ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'redbull';
    SELECT id INTO material_id FROM materials WHERE name = 'redbull';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.583333, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- turkish coffee ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'turkish coffee';
    SELECT id INTO material_id FROM materials WHERE name = 'turkish coffee';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.195000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- tisane ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'tisane';
    SELECT id INTO material_id FROM materials WHERE name = 'tisane';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.083333, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

END $$;

COMMIT;
