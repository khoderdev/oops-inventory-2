-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 8: MENU ITEM INGREDIENTS
-- This script creates the menu item ingredients relationships based on the provided data

BEGIN;

-- First, add unique constraint on menuItemIngredients if it doesn't exist
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

    SELECT id INTO material_id FROM materials WHERE name = 'bzurat';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 1, 'PC', 0.003756, NOW(), NOW())
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

    -- bounty shake ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'bounty shake';
    SELECT id INTO material_id FROM materials WHERE name = 'chocolate powder';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 30, 'G', 0.390000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'chocolate sauce';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 16, 'ML', 0.128760, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'coconut mixer';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 100, 'ML', 1.320000, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'milk liquid';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 100, 'ML', 0.144444, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'vanille powder';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.149850, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    SELECT id INTO material_id FROM materials WHERE name = 'whipped crème';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 10, 'G', 0.159111, NOW(), NOW())
        ON CONFLICT ("menuItemId", "materialId") DO NOTHING;
    END IF;

    -- bzurat drink ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'bzurat';
    SELECT id INTO material_id FROM materials WHERE name = 'bzurat';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 120, 'G', 0.450667, NOW(), NOW())
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

    -- café latte ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'café latte';
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

    -- café latte caramel ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'café latte caramel';
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

    -- café latte vanille ingredients
    SELECT id INTO menu_item_id FROM "menuItems" WHERE name = 'café latte vanille';
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

    SELECT id INTO material_id FROM materials WHERE name = 'vanille syrup';
    IF menu_item_id IS NOT NULL AND material_id IS NOT NULL THEN
        INSERT INTO "menuItemIngredients" ("menuItemId", "materialId", quantity, unit, cost, "createdAt", "updatedAt") 
        VALUES (menu_item_id, material_id, 32, 'ML', 0.291264, NOW(), NOW())
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

END $$;

COMMIT;
