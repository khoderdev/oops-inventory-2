-- COMPREHENSIVE DEBUG SCRIPT - PART 6: MENU ITEMS
-- This script will insert items one by one with detailed logging

BEGIN;

-- First, add unique constraint on menuItems name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'menuItems_name_unique'
    ) THEN
        ALTER TABLE "menuItems" ADD CONSTRAINT menuItems_name_unique UNIQUE (name);
        RAISE NOTICE 'Added unique constraint on menuItems name';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on menuItems name';
    END IF;
END $$;

-- Check current state
DO $$
DECLARE
    menu_count INTEGER;
    cat_25_exists BOOLEAN;
    cat_19_exists BOOLEAN;
    cat_26_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO menu_count FROM "menuItems";
    RAISE NOTICE 'Current menu items count: %', menu_count;
    
    SELECT EXISTS(SELECT 1 FROM categories WHERE id = 25) INTO cat_25_exists;
    SELECT EXISTS(SELECT 1 FROM categories WHERE id = 19) INTO cat_19_exists;
    SELECT EXISTS(SELECT 1 FROM categories WHERE id = 26) INTO cat_26_exists;
    
    RAISE NOTICE 'Category 25 exists: %', cat_25_exists;
    RAISE NOTICE 'Category 19 exists: %', cat_19_exists;
    RAISE NOTICE 'Category 26 exists: %', cat_26_exists;
END $$;

-- Insert menu items with individual error handling
DO $$
DECLARE
    inserted_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- Cold Drinks (Category 25)
    BEGIN
        INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
            ('7up', '7up soft drink', 25, 2.50, true, NOW(), NOW());
        inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting 7up: %', SQLERRM;
        error_count := error_count + 1;
    END;

    BEGIN
        INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
            ('pepsi', 'Pepsi cola', 25, 2.50, true, NOW(), NOW());
        inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting pepsi: %', SQLERRM;
        error_count := error_count + 1;
    END;

    BEGIN
        INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
            ('redbull', 'Red Bull energy drink', 25, 4.00, true, NOW(), NOW());
        inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting redbull: %', SQLERRM;
        error_count := error_count + 1;
    END;

    -- Hot Drinks (Category 25)
    BEGIN
        INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
            ('espresso', 'Espresso shot', 25, 2.50, true, NOW(), NOW());
        inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting espresso: %', SQLERRM;
        error_count := error_count + 1;
    END;

    -- Alcohol (Category 19)
    BEGIN
        INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
            ('almaza beer', 'Almaza beer', 19, 4.00, true, NOW(), NOW());
        inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting almaza beer: %', SQLERRM;
        error_count := error_count + 1;
    END;

    -- Shisha (Category 26)
    BEGIN
        INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
            ('apple', 'Apple flavored shisha', 26, 12.00, true, NOW(), NOW());
        inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting apple: %', SQLERRM;
        error_count := error_count + 1;
    END;

    RAISE NOTICE 'Successfully inserted % items', inserted_count;
    RAISE NOTICE 'Encountered % errors', error_count;
END $$;

-- Check final state
DO $$
DECLARE
    final_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM "menuItems";
    RAISE NOTICE 'Final menu items count: %', final_count;
END $$;

-- Show any items that were inserted
SELECT 'NEWLY INSERTED ITEMS:' as info;
SELECT name, "categoryId", price FROM "menuItems" 
WHERE name IN ('7up', 'pepsi', 'redbull', 'espresso', 'almaza beer', 'apple')
ORDER BY name;

COMMIT;
