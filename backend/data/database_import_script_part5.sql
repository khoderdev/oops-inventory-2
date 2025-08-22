-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 5: STOCK ENTRIES
-- This script creates stock entries for all materials with proper cost calculations

BEGIN;

-- Create stock entries for materials with cost data from the provided spreadsheet
DO $$
DECLARE
    material_id INTEGER;
BEGIN
    -- Insert stock entries for materials with known costs from the data
    
    -- 7up
    SELECT id INTO material_id FROM materials WHERE name = '7up';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 24, 'pc', 24, 'pc', 0.5208, 0.5208, 12.4992, NOW() - INTERVAL '30 days', true, NOW(), NOW());
    END IF;

    -- grenadine
    SELECT id INTO material_id FROM materials WHERE name = 'grenadine';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 1000, 'cl', 1000, 'cl', 0.0091, 0.0091, 9.1, NOW() - INTERVAL '25 days', false, NOW(), NOW());
    END IF;

    -- almaza
    SELECT id INTO material_id FROM materials WHERE name = 'almaza';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 24, 'pc', 24, 'pc', 0.5833, 0.5833, 13.9992, NOW() - INTERVAL '20 days', true, NOW(), NOW());
    END IF;

    -- bzurat
    SELECT id INTO material_id FROM materials WHERE name = 'bzurat';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 1000, 'pc', 1000, 'pc', 0.0038, 0.0038, 3.8, NOW() - INTERVAL '15 days', false, NOW(), NOW());
    END IF;

    -- nescafe gold
    SELECT id INTO material_id FROM materials WHERE name = 'nescafe gold';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 500, 'g', 500, 'g', 0.0316, 0.0316, 15.8, NOW() - INTERVAL '10 days', false, NOW(), NOW());
    END IF;

    -- chicken breast
    SELECT id INTO material_id FROM materials WHERE name = 'chicken breast';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 5000, 'g', 5000, 'g', 0.0077, 0.0077, 38.5, NOW() - INTERVAL '5 days', false, NOW(), NOW());
    END IF;

    -- mozzarella cheese
    SELECT id INTO material_id FROM materials WHERE name = 'mozzarella cheese';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 2000, 'g', 2000, 'g', 0.0070, 0.0070, 14.0, NOW() - INTERVAL '8 days', false, NOW(), NOW());
    END IF;

    -- milk liquid
    SELECT id INTO material_id FROM materials WHERE name = 'milk liquid';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 5000, 'ml', 5000, 'ml', 0.0014, 0.0014, 7.0, NOW() - INTERVAL '12 days', false, NOW(), NOW());
    END IF;

    -- fresh crème
    SELECT id INTO material_id FROM materials WHERE name = 'fresh crème';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 2000, 'ml', 2000, 'ml', 0.0030, 0.0030, 6.0, NOW() - INTERVAL '7 days', false, NOW(), NOW());
    END IF;

    -- bell pepper
    SELECT id INTO material_id FROM materials WHERE name = 'bell pepper';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 1000, 'g', 1000, 'g', 0.0140, 0.0140, 14.0, NOW() - INTERVAL '3 days', false, NOW(), NOW());
    END IF;

    -- mayo sauce
    SELECT id INTO material_id FROM materials WHERE name = 'mayo sauce';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 2000, 'g', 2000, 'g', 0.0032, 0.0032, 6.4, NOW() - INTERVAL '6 days', false, NOW(), NOW());
    END IF;

    -- sub bread
    SELECT id INTO material_id FROM materials WHERE name = 'sub bread';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 50, 'pc', 50, 'pc', 0.3500, 0.3500, 17.5, NOW() - INTERVAL '2 days', false, NOW(), NOW());
    END IF;

    -- bacon
    SELECT id INTO material_id FROM materials WHERE name = 'bacon';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 1000, 'g', 1000, 'g', 0.0173, 0.0173, 17.3, NOW() - INTERVAL '4 days', false, NOW(), NOW());
    END IF;

    -- cheddar sauce
    SELECT id INTO material_id FROM materials WHERE name = 'cheddar sauce';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 2000, 'g', 2000, 'g', 0.0110, 0.0110, 22.0, NOW() - INTERVAL '9 days', false, NOW(), NOW());
    END IF;

    -- cheddar slice
    SELECT id INTO material_id FROM materials WHERE name = 'cheddar slice';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 1000, 'g', 1000, 'g', 0.0154, 0.0154, 15.4, NOW() - INTERVAL '11 days', false, NOW(), NOW());
    END IF;

    -- chips sticks
    SELECT id INTO material_id FROM materials WHERE name = 'chips sticks';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 500, 'g', 500, 'g', 0.6667, 0.6667, 333.35, NOW() - INTERVAL '13 days', false, NOW(), NOW());
    END IF;

    -- white bun
    SELECT id INTO material_id FROM materials WHERE name = 'white bun';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 100, 'pc', 100, 'pc', 0.3574, 0.3574, 35.74, NOW() - INTERVAL '14 days', false, NOW(), NOW());
    END IF;

    -- chocolate powder
    SELECT id INTO material_id FROM materials WHERE name = 'chocolate powder';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 1000, 'g', 1000, 'g', 0.0130, 0.0130, 13.0, NOW() - INTERVAL '16 days', false, NOW(), NOW());
    END IF;

    -- chocolate sauce
    SELECT id INTO material_id FROM materials WHERE name = 'chocolate sauce';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 2000, 'ml', 2000, 'ml', 0.0080, 0.0080, 16.0, NOW() - INTERVAL '17 days', false, NOW(), NOW());
    END IF;

    -- coconut mixer
    SELECT id INTO material_id FROM materials WHERE name = 'coconut mixer';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 2000, 'ml', 2000, 'ml', 0.0132, 0.0132, 26.4, NOW() - INTERVAL '18 days', false, NOW(), NOW());
    END IF;

    -- vanille powder
    SELECT id INTO material_id FROM materials WHERE name = 'vanille powder';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 1000, 'g', 1000, 'g', 0.0150, 0.0150, 15.0, NOW() - INTERVAL '19 days', false, NOW(), NOW());
    END IF;

    -- whipped crème
    SELECT id INTO material_id FROM materials WHERE name = 'whipped crème';
    IF material_id IS NOT NULL THEN
        INSERT INTO "stockEntries" ("materialId", supplier, "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", "purchaseDate", "isPOSItem", "createdAt", "updatedAt") 
        VALUES (material_id, 'Default Supplier', 1000, 'g', 1000, 'g', 0.0159, 0.0159, 15.9, NOW() - INTERVAL '21 days', false, NOW(), NOW());
    END IF;

END $$;

COMMIT;
