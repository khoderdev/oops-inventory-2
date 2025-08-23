-- COMPREHENSIVE DATABASE IMPORT SCRIPT - STOCK ENTRIES (CORRECTED)
-- This script imports stock entries for all materials in the database
-- Generated to respect the StockEntry model structure
-- IMPORTANT: Material IDs have been corrected to match the IDs from database_import_script_part1_categories_materials.sql

-- Start transaction to ensure data consistency
BEGIN;

-- =====================================================
-- INSERT STOCK ENTRIES
-- =====================================================

-- Insert stock entries for all materials with appropriate data
-- Each material will have 1-3 stock entries with different purchase dates to simulate inventory history

-- BEVERAGES CATEGORY STOCK ENTRIES
INSERT INTO "stockEntries" ("materialId", "supplier", "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", 
                          "purchasedIndividualUnit", "costPerPurchasedUnit", "costPerBaseUnit", "totalCost", 
                          "purchaseDate", "expiryDate", "isPOSItem", "createdAt", "updatedAt")
VALUES
-- 7up (materialId: 1)
(1, 'Pepsi Co', 10, 'box', 120, 'bottle', 15.00, 1.25, 150.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(1, 'Pepsi Co', 5, 'box', 60, 'bottle', 15.50, 1.29, 77.50, NOW() - INTERVAL '60 days', NOW() + INTERVAL '130 days', false, NOW(), NOW()),

-- grenadine (materialId: 2)
(2, 'Sysco Foods', 5, 'l', 5000, 'ml', 8.50, 0.0085, 42.50, NOW() - INTERVAL '15 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),
(2, 'Sysco Foods', 3, 'l', 3000, 'ml', 9.00, 0.009, 27.00, NOW() - INTERVAL '45 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),

-- almaza (materialId: 3)
(3, 'Local Distributor', 8, 'box', 192, 'bottle', 20.00, 0.83, 160.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '120 days', false, NOW(), NOW()),
(3, 'Local Distributor', 4, 'box', 96, 'bottle', 21.00, 0.88, 84.00, NOW() - INTERVAL '35 days', NOW() + INTERVAL '85 days', false, NOW(), NOW()),

-- bzurat (materialId: 4)
(4, 'Spice Market', 2, 'kg', 2000, 'g', 12.00, 0.012, 24.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '300 days', false, NOW(), NOW()),

-- pepsi (materialId: 5)
(5, 'Pepsi Co', 12, 'box', 288, 'bottle', 14.00, 0.58, 168.00, NOW() - INTERVAL '7 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(5, 'Pepsi Co', 6, 'box', 144, 'bottle', 14.50, 0.60, 87.00, NOW() - INTERVAL '37 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- pepsi diet (materialId: 6)
(6, 'Pepsi Co', 8, 'box', 192, 'bottle', 14.50, 0.60, 116.00, NOW() - INTERVAL '12 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- redbull (materialId: 7)
(7, 'Red Bull GmbH', 5, 'box', 120, 'bottle', 36.00, 1.50, 180.00, NOW() - INTERVAL '8 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(7, 'Red Bull GmbH', 3, 'box', 72, 'bottle', 37.00, 1.54, 111.00, NOW() - INTERVAL '38 days', NOW() + INTERVAL '335 days', false, NOW(), NOW()),

-- miranda (materialId: 8)
(8, 'Pepsi Co', 10, 'box', 240, 'bottle', 14.00, 0.58, 140.00, NOW() - INTERVAL '9 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- rim (materialId: 9)
(9, 'Local Distributor', 8, 'box', 192, 'bottle', 13.00, 0.54, 104.00, NOW() - INTERVAL '11 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- via tannourine (materialId: 10)
(10, 'Tannourine Water', 15, 'box', 180, 'bottle', 10.00, 0.83, 150.00, NOW() - INTERVAL '6 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(10, 'Tannourine Water', 10, 'box', 120, 'bottle', 10.50, 0.88, 105.00, NOW() - INTERVAL '36 days', NOW() + INTERVAL '335 days', false, NOW(), NOW()),

-- water l (materialId: 11)
(11, 'Local Water Co', 20, 'box', 240, 'bottle', 8.00, 0.67, 160.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(11, 'Local Water Co', 15, 'box', 180, 'bottle', 8.50, 0.71, 127.50, NOW() - INTERVAL '35 days', NOW() + INTERVAL '335 days', false, NOW(), NOW()),

-- water s (materialId: 12)
(12, 'Local Water Co', 20, 'box', 480, 'bottle', 6.00, 0.25, 120.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(12, 'Local Water Co', 15, 'box', 360, 'bottle', 6.50, 0.27, 97.50, NOW() - INTERVAL '35 days', NOW() + INTERVAL '335 days', false, NOW(), NOW()),

-- xxl (materialId: 13)
(13, 'Energy Drinks Inc', 8, 'box', 192, 'bottle', 24.00, 1.00, 192.00, NOW() - INTERVAL '14 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- energy drink (materialId: 14)
(14, 'Energy Drinks Inc', 5, 'box', 60, 'bottle', 30.00, 2.50, 150.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- tonic (materialId: 15)
(15, 'Beverage Supplier', 10, 'l', 10000, 'ml', 5.00, 0.005, 50.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- ginger beer (materialId: 16)
(16, 'Beverage Supplier', 8, 'l', 8000, 'ml', 6.00, 0.006, 48.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- orange juice (materialId: 17)
(17, 'Fresh Juice Co', 20, 'l', 20000, 'ml', 4.00, 0.004, 80.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),
(17, 'Fresh Juice Co', 15, 'l', 15000, 'ml', 4.50, 0.0045, 67.50, NOW() - INTERVAL '15 days', NOW() + INTERVAL '20 days', false, NOW(), NOW()),

-- nescafe gold (materialId: 18)
(18, 'Nestle', 5, 'kg', 5000, 'g', 30.00, 0.03, 150.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- espresso coffee (materialId: 19)
(19, 'Coffee Importers', 10, 'kg', 10000, 'g', 25.00, 0.025, 250.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(19, 'Coffee Importers', 5, 'kg', 5000, 'g', 26.00, 0.026, 130.00, NOW() - INTERVAL '50 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- cappucino (materialId: 20)
(20, 'Nestle', 10, 'pack', 200, 'piece', 15.00, 0.75, 150.00, NOW() - INTERVAL '25 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- PROTEINS CATEGORY STOCK ENTRIES

-- chicken crispy (materialId: 272) - This is the "Crispy" material referenced in memories
(272, 'Poultry Supplier', 20, 'kg', 20000, 'g', 12.00, 0.012, 240.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),
(272, 'Poultry Supplier', 15, 'kg', 15000, 'g', 12.50, 0.0125, 187.50, NOW() - INTERVAL '15 days', NOW() + INTERVAL '20 days', false, NOW(), NOW()),

-- crispy chicken (materialId: 273) - Alternative "Crispy" material
(273, 'Poultry Supplier', 25, 'kg', 25000, 'g', 11.00, 0.011, 275.00, NOW() - INTERVAL '7 days', NOW() + INTERVAL '28 days', false, NOW(), NOW()),
(273, 'Poultry Supplier', 20, 'kg', 20000, 'g', 11.50, 0.0115, 230.00, NOW() - INTERVAL '17 days', NOW() + INTERVAL '18 days', false, NOW(), NOW());

COMMIT;
