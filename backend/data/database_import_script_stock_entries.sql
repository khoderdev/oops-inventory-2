-- COMPREHENSIVE DATABASE IMPORT SCRIPT - STOCK ENTRIES
-- This script imports stock entries for all materials in the database
-- Generated to respect the StockEntry model structure

-- Start transaction to ensure data consistency
BEGIN;

-- =====================================================
-- INSERT STOCK ENTRIES
-- =====================================================

-- First, add unique constraint if it doesn't exist (optional for stock entries)
-- Stock entries don't typically have unique constraints as multiple entries can exist for the same material

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
(9, 'Local Distributor', 8, 'box', 192, 'bottle', 12.00, 0.50, 96.00, NOW() - INTERVAL '14 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- via tannourine (materialId: 10)
(10, 'Tannourine Water', 15, 'box', 180, 'bottle', 8.00, 0.67, 120.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(10, 'Tannourine Water', 10, 'box', 120, 'bottle', 8.50, 0.71, 85.00, NOW() - INTERVAL '33 days', NOW() + INTERVAL '335 days', false, NOW(), NOW()),

-- water l (materialId: 11)
(11, 'Tannourine Water', 20, 'box', 240, 'bottle', 7.00, 0.58, 140.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(11, 'Tannourine Water', 15, 'box', 180, 'bottle', 7.50, 0.63, 112.50, NOW() - INTERVAL '22 days', NOW() + INTERVAL '345 days', false, NOW(), NOW()),

-- water s (materialId: 12)
(12, 'Tannourine Water', 25, 'box', 600, 'bottle', 6.00, 0.25, 150.00, NOW() - INTERVAL '4 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(12, 'Tannourine Water', 15, 'box', 360, 'bottle', 6.50, 0.27, 97.50, NOW() - INTERVAL '24 days', NOW() + INTERVAL '345 days', false, NOW(), NOW()),

-- xxl (materialId: 13)
(13, 'Energy Drinks Inc', 6, 'box', 144, 'bottle', 24.00, 1.00, 144.00, NOW() - INTERVAL '11 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- energy drink (materialId: 14)
(14, 'Energy Drinks Inc', 5, 'box', 60, 'bottle', 30.00, 2.50, 150.00, NOW() - INTERVAL '13 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- tonic (materialId: 15)
(15, 'Beverage Supplier', 4, 'l', 4000, 'ml', 7.50, 0.0075, 30.00, NOW() - INTERVAL '18 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- ginger beer (materialId: 16)
(16, 'Beverage Supplier', 5, 'l', 5000, 'ml', 8.00, 0.008, 40.00, NOW() - INTERVAL '16 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- orange juice (materialId: 17)
(17, 'Fresh Juice Co', 10, 'l', 10000, 'ml', 5.00, 0.005, 50.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),
(17, 'Fresh Juice Co', 8, 'l', 8000, 'ml', 5.50, 0.0055, 44.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', false, NOW(), NOW()),

-- nescafe gold (materialId: 18)
(18, 'Nestle', 3, 'kg', 3000, 'g', 45.00, 0.045, 135.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- espresso coffee (materialId: 19)
(19, 'Coffee Supplier', 5, 'kg', 5000, 'g', 35.00, 0.035, 175.00, NOW() - INTERVAL '25 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(19, 'Coffee Supplier', 3, 'kg', 3000, 'g', 36.00, 0.036, 108.00, NOW() - INTERVAL '55 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- cappucino (materialId: 20)
(20, 'Nestle', 10, 'pack', 200, 'piece', 12.00, 0.60, 120.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- DAIRY CATEGORY STOCK ENTRIES
-- milk liquid (materialId: 87)
(87, 'Dairy Farm', 20, 'l', 20000, 'ml', 1.50, 0.0015, 30.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),
(87, 'Dairy Farm', 15, 'l', 15000, 'ml', 1.60, 0.0016, 24.00, NOW() - INTERVAL '8 days', NOW() + INTERVAL '9 days', false, NOW(), NOW()),

-- fresh crème (materialId: 88)
(88, 'Dairy Farm', 5, 'l', 5000, 'ml', 8.00, 0.008, 40.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- whipped crème (materialId: 89)
(89, 'Dairy Farm', 3, 'kg', 3000, 'g', 12.00, 0.012, 36.00, NOW() - INTERVAL '7 days', NOW() + INTERVAL '21 days', false, NOW(), NOW()),

-- mozzarella cheese (materialId: 90)
(90, 'Cheese Supplier', 10, 'kg', 10000, 'g', 18.00, 0.018, 180.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),
(90, 'Cheese Supplier', 5, 'kg', 5000, 'g', 19.00, 0.019, 95.00, NOW() - INTERVAL '40 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),

-- cheddar slice (materialId: 91)
(91, 'Cheese Supplier', 15, 'pack', 150, 'piece', 8.00, 0.80, 120.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', false, NOW(), NOW()),

-- PROTEINS CATEGORY STOCK ENTRIES
-- chicken breast (materialId: 131)
(131, 'Meat Supplier', 15, 'kg', 15000, 'g', 12.00, 0.012, 180.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),
(131, 'Meat Supplier', 10, 'kg', 10000, 'g', 12.50, 0.0125, 125.00, NOW() - INTERVAL '7 days', NOW() + INTERVAL '9 days', false, NOW(), NOW()),

-- grilled chicken (materialId: 133)
(133, 'Meat Supplier', 12, 'kg', 12000, 'g', 15.00, 0.015, 180.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- chicken crispy (materialId: 134)
(134, 'Meat Supplier', 50, 'piece', 50, 'piece', 2.50, 2.50, 125.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '21 days', false, NOW(), NOW()),
(134, 'Meat Supplier', 30, 'piece', 30, 'piece', 2.60, 2.60, 78.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '11 days', false, NOW(), NOW()),

-- crispy chicken (materialId: 135)
(135, 'Meat Supplier', 8, 'kg', 8000, 'g', 18.00, 0.018, 144.00, NOW() - INTERVAL '4 days', NOW() + INTERVAL '21 days', false, NOW(), NOW()),

-- chicken wings (materialId: 136)
(136, 'Meat Supplier', 100, 'piece', 100, 'piece', 0.80, 0.80, 80.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),
(136, 'Meat Supplier', 80, 'piece', 80, 'piece', 0.85, 0.85, 68.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- SAUCES CATEGORY STOCK ENTRIES
-- bbq sauce (materialId: 107)
(107, 'Sauce Supplier', 5, 'kg', 5000, 'g', 8.00, 0.008, 40.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(107, 'Sauce Supplier', 3, 'kg', 3000, 'g', 8.50, 0.0085, 25.50, NOW() - INTERVAL '50 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- mayo sauce (materialId: 108)
(108, 'Sauce Supplier', 8, 'kg', 8000, 'g', 7.00, 0.007, 56.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- ketchup (materialId: 110)
(110, 'Sauce Supplier', 10, 'l', 10000, 'ml', 5.00, 0.005, 50.00, NOW() - INTERVAL '25 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(110, 'Sauce Supplier', 5, 'l', 5000, 'ml', 5.50, 0.0055, 27.50, NOW() - INTERVAL '55 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- TOBACCO CATEGORY STOCK ENTRIES
-- apple (materialId: 73)
(73, 'Tobacco Supplier', 5, 'kg', 5000, 'g', 45.00, 0.045, 225.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- mint (materialId: 80)
(80, 'Tobacco Supplier', 6, 'kg', 6000, 'g', 50.00, 0.05, 300.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(80, 'Tobacco Supplier', 4, 'kg', 4000, 'g', 52.00, 0.052, 208.00, NOW() - INTERVAL '35 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- ALCOHOL CATEGORY STOCK ENTRIES
-- gin (materialId: 43)
(43, 'Alcohol Distributor', 3, 'l', 3000, 'ml', 40.00, 0.04, 120.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- vodka (materialId: 44)
(44, 'Alcohol Distributor', 5, 'l', 5000, 'ml', 35.00, 0.035, 175.00, NOW() - INTERVAL '25 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),
(44, 'Alcohol Distributor', 3, 'l', 3000, 'ml', 36.00, 0.036, 108.00, NOW() - INTERVAL '85 days', NOW() + INTERVAL '670 days', false, NOW(), NOW()),

-- rum (materialId: 45)
(45, 'Alcohol Distributor', 4, 'l', 4000, 'ml', 38.00, 0.038, 152.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- whiskey black (materialId: 48)
(48, 'Alcohol Distributor', 3, 'l', 3000, 'ml', 60.00, 0.06, 180.00, NOW() - INTERVAL '40 days', NOW() + INTERVAL '1095 days', false, NOW(), NOW()),

-- whiskey red (materialId: 49)
(49, 'Alcohol Distributor', 3, 'l', 3000, 'ml', 45.00, 0.045, 135.00, NOW() - INTERVAL '35 days', NOW() + INTERVAL '1095 days', false, NOW(), NOW()),

-- SPECIAL CASE: Material ID 216 "Crispy" (referenced in memories)
(216, 'Special Supplier', 10, 'box', 40, 'piece', 12.50, 3.125, 125.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),
(216, 'Special Supplier', 5, 'box', 20, 'piece', 13.00, 3.25, 65.00, NOW() - INTERVAL '35 days', NOW() + INTERVAL '60 days', false, NOW(), NOW());

-- Add more stock entries for remaining materials as needed
-- This script provides a representative sample of stock entries across different material categories

-- Update purchasedConvertedQuantity and purchasedConvertedUnit
-- These will be calculated by the model hooks, but we can set them explicitly for clarity
UPDATE "stockEntries" SET 
  "purchasedConvertedQuantity" = "purchasedQuantity",
  "purchasedConvertedUnit" = "purchasedUnit"
WHERE "purchasedConvertedQuantity" IS NULL;

-- Commit the transaction
COMMIT;
-- COMPREHENSIVE DATABASE IMPORT SCRIPT - STOCK ENTRIES
-- This script imports stock entries for all materials in the database
-- Generated to respect the StockEntry model structure

-- Start transaction to ensure data consistency
BEGIN;

-- =====================================================
-- INSERT STOCK ENTRIES
-- =====================================================

-- First, add unique constraint if it doesn't exist (optional for stock entries)
-- Stock entries don't typically have unique constraints as multiple entries can exist for the same material

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
(9, 'Local Distributor', 8, 'box', 192, 'bottle', 12.00, 0.50, 96.00, NOW() - INTERVAL '14 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- via tannourine (materialId: 10)
(10, 'Tannourine Water', 15, 'box', 180, 'bottle', 8.00, 0.67, 120.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(10, 'Tannourine Water', 10, 'box', 120, 'bottle', 8.50, 0.71, 85.00, NOW() - INTERVAL '33 days', NOW() + INTERVAL '335 days', false, NOW(), NOW()),

-- water l (materialId: 11)
(11, 'Tannourine Water', 20, 'box', 240, 'bottle', 7.00, 0.58, 140.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(11, 'Tannourine Water', 15, 'box', 180, 'bottle', 7.50, 0.63, 112.50, NOW() - INTERVAL '22 days', NOW() + INTERVAL '345 days', false, NOW(), NOW()),

-- water s (materialId: 12)
(12, 'Tannourine Water', 25, 'box', 600, 'bottle', 6.00, 0.25, 150.00, NOW() - INTERVAL '4 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),
(12, 'Tannourine Water', 15, 'box', 360, 'bottle', 6.50, 0.27, 97.50, NOW() - INTERVAL '24 days', NOW() + INTERVAL '345 days', false, NOW(), NOW()),

-- xxl (materialId: 13)
(13, 'Energy Drinks Inc', 6, 'box', 144, 'bottle', 24.00, 1.00, 144.00, NOW() - INTERVAL '11 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- energy drink (materialId: 14)
(14, 'Energy Drinks Inc', 5, 'box', 60, 'bottle', 30.00, 2.50, 150.00, NOW() - INTERVAL '13 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- tonic (materialId: 15)
(15, 'Beverage Supplier', 4, 'l', 4000, 'ml', 7.50, 0.0075, 30.00, NOW() - INTERVAL '18 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- ginger beer (materialId: 16)
(16, 'Beverage Supplier', 5, 'l', 5000, 'ml', 8.00, 0.008, 40.00, NOW() - INTERVAL '16 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- orange juice (materialId: 17)
(17, 'Fresh Juice Co', 10, 'l', 10000, 'ml', 5.00, 0.005, 50.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),
(17, 'Fresh Juice Co', 8, 'l', 8000, 'ml', 5.50, 0.0055, 44.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', false, NOW(), NOW()),

-- nescafe gold (materialId: 18)
(18, 'Nestle', 3, 'kg', 3000, 'g', 45.00, 0.045, 135.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- espresso coffee (materialId: 19)
(19, 'Coffee Supplier', 5, 'kg', 5000, 'g', 35.00, 0.035, 175.00, NOW() - INTERVAL '25 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(19, 'Coffee Supplier', 3, 'kg', 3000, 'g', 36.00, 0.036, 108.00, NOW() - INTERVAL '55 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- cappucino (materialId: 20)
(20, 'Nestle', 10, 'pack', 200, 'piece', 12.00, 0.60, 120.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- DAIRY CATEGORY STOCK ENTRIES
-- milk liquid (materialId: 87)
(87, 'Dairy Farm', 20, 'l', 20000, 'ml', 1.50, 0.0015, 30.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),
(87, 'Dairy Farm', 15, 'l', 15000, 'ml', 1.60, 0.0016, 24.00, NOW() - INTERVAL '8 days', NOW() + INTERVAL '9 days', false, NOW(), NOW()),

-- fresh crème (materialId: 88)
(88, 'Dairy Farm', 5, 'l', 5000, 'ml', 8.00, 0.008, 40.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- whipped crème (materialId: 89)
(89, 'Dairy Farm', 3, 'kg', 3000, 'g', 12.00, 0.012, 36.00, NOW() - INTERVAL '7 days', NOW() + INTERVAL '21 days', false, NOW(), NOW()),

-- mozzarella cheese (materialId: 90)
(90, 'Cheese Supplier', 10, 'kg', 10000, 'g', 18.00, 0.018, 180.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),
(90, 'Cheese Supplier', 5, 'kg', 5000, 'g', 19.00, 0.019, 95.00, NOW() - INTERVAL '40 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),

-- cheddar slice (materialId: 91)
(91, 'Cheese Supplier', 15, 'pack', 150, 'piece', 8.00, 0.80, 120.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', false, NOW(), NOW()),

-- PROTEINS CATEGORY STOCK ENTRIES
-- chicken breast (materialId: 131)
(131, 'Meat Supplier', 15, 'kg', 15000, 'g', 12.00, 0.012, 180.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),
(131, 'Meat Supplier', 10, 'kg', 10000, 'g', 12.50, 0.0125, 125.00, NOW() - INTERVAL '7 days', NOW() + INTERVAL '9 days', false, NOW(), NOW()),

-- grilled chicken (materialId: 133)
(133, 'Meat Supplier', 12, 'kg', 12000, 'g', 15.00, 0.015, 180.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- chicken crispy (materialId: 134)
(134, 'Meat Supplier', 50, 'piece', 50, 'piece', 2.50, 2.50, 125.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '21 days', false, NOW(), NOW()),
(134, 'Meat Supplier', 30, 'piece', 30, 'piece', 2.60, 2.60, 78.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '11 days', false, NOW(), NOW()),

-- crispy chicken (materialId: 135)
(135, 'Meat Supplier', 8, 'kg', 8000, 'g', 18.00, 0.018, 144.00, NOW() - INTERVAL '4 days', NOW() + INTERVAL '21 days', false, NOW(), NOW()),

-- chicken wings (materialId: 136)
(136, 'Meat Supplier', 100, 'piece', 100, 'piece', 0.80, 0.80, 80.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),
(136, 'Meat Supplier', 80, 'piece', 80, 'piece', 0.85, 0.85, 68.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- SAUCES CATEGORY STOCK ENTRIES
-- bbq sauce (materialId: 107)
(107, 'Sauce Supplier', 5, 'kg', 5000, 'g', 8.00, 0.008, 40.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(107, 'Sauce Supplier', 3, 'kg', 3000, 'g', 8.50, 0.0085, 25.50, NOW() - INTERVAL '50 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- mayo sauce (materialId: 108)
(108, 'Sauce Supplier', 8, 'kg', 8000, 'g', 7.00, 0.007, 56.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- ketchup (materialId: 110)
(110, 'Sauce Supplier', 10, 'l', 10000, 'ml', 5.00, 0.005, 50.00, NOW() - INTERVAL '25 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(110, 'Sauce Supplier', 5, 'l', 5000, 'ml', 5.50, 0.0055, 27.50, NOW() - INTERVAL '55 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- TOBACCO CATEGORY STOCK ENTRIES
-- apple (materialId: 73)
(73, 'Tobacco Supplier', 5, 'kg', 5000, 'g', 45.00, 0.045, 225.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- mint (materialId: 80)
(80, 'Tobacco Supplier', 6, 'kg', 6000, 'g', 50.00, 0.05, 300.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),
(80, 'Tobacco Supplier', 4, 'kg', 4000, 'g', 52.00, 0.052, 208.00, NOW() - INTERVAL '35 days', NOW() + INTERVAL '150 days', false, NOW(), NOW()),

-- ALCOHOL CATEGORY STOCK ENTRIES
-- gin (materialId: 43)
(43, 'Alcohol Distributor', 3, 'l', 3000, 'ml', 40.00, 0.04, 120.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- vodka (materialId: 44)
(44, 'Alcohol Distributor', 5, 'l', 5000, 'ml', 35.00, 0.035, 175.00, NOW() - INTERVAL '25 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),
(44, 'Alcohol Distributor', 3, 'l', 3000, 'ml', 36.00, 0.036, 108.00, NOW() - INTERVAL '85 days', NOW() + INTERVAL '670 days', false, NOW(), NOW()),

-- rum (materialId: 45)
(45, 'Alcohol Distributor', 4, 'l', 4000, 'ml', 38.00, 0.038, 152.00, NOW() - INTERVAL '20 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- whiskey black (materialId: 48)
(48, 'Alcohol Distributor', 3, 'l', 3000, 'ml', 60.00, 0.06, 180.00, NOW() - INTERVAL '40 days', NOW() + INTERVAL '1095 days', false, NOW(), NOW()),

-- whiskey red (materialId: 49)
(49, 'Alcohol Distributor', 3, 'l', 3000, 'ml', 45.00, 0.045, 135.00, NOW() - INTERVAL '35 days', NOW() + INTERVAL '1095 days', false, NOW(), NOW()),

-- SPECIAL CASE: Material ID 216 "Crispy" (referenced in memories)
(216, 'Special Supplier', 10, 'box', 40, 'piece', 12.50, 3.125, 125.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),
(216, 'Special Supplier', 5, 'box', 20, 'piece', 13.00, 3.25, 65.00, NOW() - INTERVAL '35 days', NOW() + INTERVAL '60 days', false, NOW(), NOW());

-- Add more stock entries for remaining materials as needed
-- This script provides a representative sample of stock entries across different material categories

-- Update purchasedConvertedQuantity and purchasedConvertedUnit
-- These will be calculated by the model hooks, but we can set them explicitly for clarity
UPDATE "stockEntries" SET 
  "purchasedConvertedQuantity" = "purchasedQuantity",
  "purchasedConvertedUnit" = "purchasedUnit"
WHERE "purchasedConvertedQuantity" IS NULL;

-- Commit the transaction
COMMIT;

-- rose wine (materialId: 51)
(51, 'Chateau Ksara', 12, 'bottle', 12, 'bottle', 15.00, 15.00, 180.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- white wine (materialId: 52)
(52, 'Chateau Ksara', 12, 'bottle', 12, 'bottle', 15.00, 15.00, 180.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- black label (materialId: 53)
(53, 'Johnnie Walker', 6, 'box', 72, 'bottle', 45.00, 3.75, 270.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- red label (materialId: 54)
(54, 'Johnnie Walker', 6, 'box', 72, 'bottle', 35.00, 2.92, 210.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- grey goose (materialId: 55)
(55, 'Grey Goose', 4, 'l', 4000, 'ml', 40.00, 0.040, 160.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- absolut vodka (materialId: 56)
(56, 'Absolut', 6, 'l', 6000, 'ml', 25.00, 0.025, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- bacardi rum (materialId: 57)
(57, 'Bacardi', 6, 'l', 6000, 'ml', 25.00, 0.025, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- jose cuervo (materialId: 58)
(58, 'Jose Cuervo', 4, 'l', 4000, 'ml', 30.00, 0.030, 120.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- cointreau (materialId: 59)
(59, 'Cointreau', 3, 'l', 3000, 'ml', 32.00, 0.032, 96.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- grand marnier (materialId: 60)
(60, 'Grand Marnier', 3, 'l', 3000, 'ml', 35.00, 0.035, 105.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),
-- baileys (materialId: 61)
(61, 'Diageo', 3, 'l', 3000, 'ml', 30.00, 0.030, 90.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- kahlua (materialId: 62)
(62, 'Pernod Ricard', 3, 'l', 3000, 'ml', 28.00, 0.028, 84.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- amaretto (materialId: 63)
(63, 'Disaronno', 3, 'l', 3000, 'ml', 25.00, 0.025, 75.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- sambuca (materialId: 64)
(64, 'Molinari', 3, 'l', 3000, 'ml', 25.00, 0.025, 75.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- jagermeister (materialId: 65)
(65, 'Mast-Jägermeister', 3, 'l', 3000, 'ml', 28.00, 0.028, 84.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- champagne (materialId: 66)
(66, 'Moët & Chandon', 6, 'box', 36, 'bottle', 60.00, 10.00, 360.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- prosecco (materialId: 67)
(67, 'La Marca', 6, 'box', 36, 'bottle', 25.00, 4.17, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- beer local (materialId: 68)
(68, 'Local Brewery', 10, 'box', 240, 'bottle', 15.00, 0.63, 150.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- beer imported (materialId: 69)
(69, 'Heineken', 8, 'box', 192, 'bottle', 20.00, 0.83, 160.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- TOBACCO CATEGORY STOCK ENTRIES

-- apple (materialId: 70)
(70, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- blueberry (materialId: 71)
(71, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- grape (materialId: 72)
(72, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- gum (materialId: 73)
(73, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- gum mint (materialId: 74)
(74, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- lemon mint (materialId: 75)
(75, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- love (materialId: 76)
(76, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- mint (materialId: 77)
(77, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- orange (materialId: 78)
(78, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- orange mint (materialId: 79)
(79, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- watermelon (materialId: 80)
(80, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- gape mint (materialId: 81)
(81, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- rass maseh (materialId: 82)
(82, 'Al Fakher', 5, 'kg', 5000, 'g', 30.00, 0.030, 150.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- DAIRY CATEGORY STOCK ENTRIES

-- milk liquid (materialId: 83)
(83, 'Dairy Farms', 20, 'l', 20000, 'ml', 2.00, 0.002, 40.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '10 days', false, NOW(), NOW()),

-- fresh crème (materialId: 84)
(84, 'Dairy Farms', 10, 'l', 10000, 'ml', 4.00, 0.004, 40.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- whipped crème (materialId: 85)
(85, 'Dairy Farms', 5, 'kg', 5000, 'g', 6.00, 0.006, 30.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- mozzarella cheese (materialId: 86)
(86, 'Dairy Farms', 10, 'kg', 10000, 'g', 12.00, 0.012, 120.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),

-- cheddar slice (materialId: 87)
(87, 'Dairy Farms', 10, 'pack', 100, 'piece', 8.00, 0.80, 80.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),

-- mozzarella cheese slice (materialId: 88)
(88, 'Dairy Farms', 10, 'pack', 100, 'piece', 8.00, 0.80, 80.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),

-- mozzarella slice (materialId: 89)
(89, 'Dairy Farms', 10, 'pack', 100, 'piece', 8.00, 0.80, 80.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),

-- mozzarella patty (materialId: 90)
(90, 'Dairy Farms', 10, 'kg', 10000, 'g', 12.00, 0.012, 120.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),

-- MEAT CATEGORY STOCK ENTRIES

-- beef patty (materialId: 91)
(91, 'Premium Meats', 20, 'kg', 20000, 'g', 15.00, 0.015, 300.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),

-- chicken breast (materialId: 92)
(92, 'Premium Meats', 15, 'kg', 15000, 'g', 12.00, 0.012, 180.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- chicken patty (materialId: 93)
(93, 'Premium Meats', 20, 'kg', 20000, 'g', 10.00, 0.010, 200.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),

-- chicken strips (materialId: 94)
(94, 'Premium Meats', 15, 'kg', 15000, 'g', 12.00, 0.012, 180.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- chicken wings (materialId: 95)
(95, 'Premium Meats', 15, 'kg', 15000, 'g', 10.00, 0.010, 150.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- crispy chicken (materialId: 96)
(96, 'Premium Meats', 15, 'kg', 15000, 'g', 12.00, 0.012, 180.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- grilled chicken (materialId: 97)
(97, 'Premium Meats', 15, 'kg', 15000, 'g', 12.00, 0.012, 180.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- ham (materialId: 98)
(98, 'Premium Meats', 10, 'kg', 10000, 'g', 15.00, 0.015, 150.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),

-- hot dog (materialId: 99)
(99, 'Premium Meats', 10, 'kg', 10000, 'g', 8.00, 0.008, 80.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),

-- pepperoni (materialId: 100)
(100, 'Premium Meats', 8, 'kg', 8000, 'g', 18.00, 0.018, 144.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),

-- VEGETABLES CATEGORY STOCK ENTRIES

-- cucumber (materialId: 101)
(101, 'Fresh Produce', 10, 'kg', 10000, 'g', 2.00, 0.002, 20.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- green pepper (materialId: 102)
(102, 'Fresh Produce', 8, 'kg', 8000, 'g', 3.00, 0.003, 24.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- lettuce (materialId: 103)
(103, 'Fresh Produce', 10, 'kg', 10000, 'g', 2.50, 0.0025, 25.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '5 days', false, NOW(), NOW()),

-- mushroom (materialId: 104)
(104, 'Fresh Produce', 5, 'kg', 5000, 'g', 6.00, 0.006, 30.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- olives black (materialId: 105)
(105, 'Mediterranean Imports', 5, 'kg', 5000, 'g', 8.00, 0.008, 40.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- olives green (materialId: 106)
(106, 'Mediterranean Imports', 5, 'kg', 5000, 'g', 8.00, 0.008, 40.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- onion (materialId: 107)
(107, 'Fresh Produce', 15, 'kg', 15000, 'g', 1.50, 0.0015, 22.50, NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', false, NOW(), NOW()),

-- pickles (materialId: 108)
(108, 'Mediterranean Imports', 10, 'kg', 10000, 'g', 3.00, 0.003, 30.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- potato (materialId: 109)
(109, 'Fresh Produce', 50, 'kg', 50000, 'g', 1.00, 0.001, 50.00, NOW() - INTERVAL '7 days', NOW() + INTERVAL '60 days', false, NOW(), NOW()),

-- red pepper (materialId: 110)
(110, 'Fresh Produce', 8, 'kg', 8000, 'g', 3.50, 0.0035, 28.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- tomato (materialId: 111)
(111, 'Fresh Produce', 15, 'kg', 15000, 'g', 2.00, 0.002, 30.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- FRUITS CATEGORY STOCK ENTRIES

-- apple (materialId: 112)
(112, 'Fresh Produce', 10, 'kg', 10000, 'g', 3.00, 0.003, 30.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- banana (materialId: 113)
(113, 'Fresh Produce', 10, 'kg', 10000, 'g', 2.50, 0.0025, 25.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- kiwi (materialId: 114)
(114, 'Fresh Produce', 5, 'kg', 5000, 'g', 4.00, 0.004, 20.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '10 days', false, NOW(), NOW()),

-- lemon (materialId: 115)
(115, 'Fresh Produce', 8, 'kg', 8000, 'g', 3.00, 0.003, 24.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- orange (materialId: 116)
(116, 'Fresh Produce', 10, 'kg', 10000, 'g', 2.50, 0.0025, 25.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- pineapple (materialId: 117)
(117, 'Fresh Produce', 8, 'kg', 8000, 'g', 4.00, 0.004, 32.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- strawberry (materialId: 118)
(118, 'Fresh Produce', 5, 'kg', 5000, 'g', 6.00, 0.006, 30.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', false, NOW(), NOW()),

-- watermelon (materialId: 119)
(119, 'Fresh Produce', 20, 'kg', 20000, 'g', 1.50, 0.0015, 30.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- BREAD CATEGORY STOCK ENTRIES

-- bread slice (materialId: 120)
(120, 'Local Bakery', 10, 'pack', 200, 'piece', 3.00, 0.15, 30.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- burger bun (materialId: 121)
(121, 'Local Bakery', 10, 'pack', 60, 'piece', 5.00, 0.83, 50.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- croissant (materialId: 122)
(122, 'Local Bakery', 5, 'pack', 30, 'piece', 12.00, 2.00, 60.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '5 days', false, NOW(), NOW()),

-- hot dog bun (materialId: 123)
(123, 'Local Bakery', 10, 'pack', 60, 'piece', 5.00, 0.83, 50.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- kaak (materialId: 124)
(124, 'Local Bakery', 5, 'pack', 50, 'piece', 6.00, 0.60, 30.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '10 days', false, NOW(), NOW()),

-- markouk (materialId: 125)
(125, 'Local Bakery', 5, 'pack', 50, 'piece', 5.00, 0.50, 25.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- pizza dough (materialId: 126)
(126, 'Local Bakery', 10, 'kg', 10000, 'g', 5.00, 0.005, 50.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '5 days', false, NOW(), NOW()),

-- saj (materialId: 127)
(127, 'Local Bakery', 5, 'pack', 50, 'piece', 5.00, 0.50, 25.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', false, NOW(), NOW()),

-- toast (materialId: 128)
(128, 'Local Bakery', 10, 'pack', 200, 'piece', 3.50, 0.175, 35.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '10 days', false, NOW(), NOW()),

-- tortilla (materialId: 129)
(129, 'Local Bakery', 8, 'pack', 80, 'piece', 6.00, 0.60, 48.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days', false, NOW(), NOW()),

-- SPICES CATEGORY STOCK ENTRIES

-- 7 spices (materialId: 130)
(130, 'Spice Market', 2, 'kg', 2000, 'g', 15.00, 0.015, 30.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- black pepper (materialId: 131)
(131, 'Spice Market', 2, 'kg', 2000, 'g', 20.00, 0.020, 40.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- cajun (materialId: 132)
(132, 'Spice Market', 2, 'kg', 2000, 'g', 18.00, 0.018, 36.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- cinnamon (materialId: 133)
(133, 'Spice Market', 1, 'kg', 1000, 'g', 25.00, 0.025, 25.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- cumin (materialId: 134)
(134, 'Spice Market', 1, 'kg', 1000, 'g', 15.00, 0.015, 15.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- curry (materialId: 135)
(135, 'Spice Market', 2, 'kg', 2000, 'g', 18.00, 0.018, 36.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- garlic powder (materialId: 136)
(136, 'Spice Market', 2, 'kg', 2000, 'g', 16.00, 0.016, 32.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- oregano (materialId: 137)
(137, 'Spice Market', 1, 'kg', 1000, 'g', 20.00, 0.020, 20.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- paprika (materialId: 138)
(138, 'Spice Market', 1, 'kg', 1000, 'g', 18.00, 0.018, 18.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- salt (materialId: 139)
(139, 'Wholesale Supplier', 10, 'kg', 10000, 'g', 1.00, 0.001, 10.00, NOW() - INTERVAL '60 days', NOW() + INTERVAL '730 days', false, NOW(), NOW()),

-- sumac (materialId: 140)
(140, 'Spice Market', 1, 'kg', 1000, 'g', 22.00, 0.022, 22.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- thyme (materialId: 141)
(141, 'Spice Market', 2, 'kg', 2000, 'g', 15.00, 0.015, 30.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- zaatar (materialId: 142)
(142, 'Spice Market', 3, 'kg', 3000, 'g', 18.00, 0.018, 54.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- SAUCES CATEGORY STOCK ENTRIES

-- aioli (materialId: 143)
(143, 'Gourmet Foods', 5, 'l', 5000, 'ml', 8.00, 0.008, 40.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- bbq (materialId: 144)
(144, 'Gourmet Foods', 10, 'l', 10000, 'ml', 6.00, 0.006, 60.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- cocktail (materialId: 145)
(145, 'Gourmet Foods', 5, 'l', 5000, 'ml', 7.00, 0.007, 35.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- garlic (materialId: 146)
(146, 'Gourmet Foods', 5, 'l', 5000, 'ml', 7.00, 0.007, 35.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '90 days', false, NOW(), NOW()),

-- honey mustard (materialId: 147)
(147, 'Gourmet Foods', 5, 'l', 5000, 'ml', 8.00, 0.008, 40.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- hot sauce (materialId: 148)
(148, 'Gourmet Foods', 5, 'l', 5000, 'ml', 6.00, 0.006, 30.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- ketchup (materialId: 149)
(149, 'Gourmet Foods', 15, 'l', 15000, 'ml', 4.00, 0.004, 60.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- mayonnaise (materialId: 150)
(150, 'Gourmet Foods', 15, 'l', 15000, 'ml', 5.00, 0.005, 75.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- mustard (materialId: 151)
(151, 'Gourmet Foods', 5, 'l', 5000, 'ml', 6.00, 0.006, 30.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- ranch (materialId: 152)
(152, 'Gourmet Foods', 5, 'l', 5000, 'ml', 7.00, 0.007, 35.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- soy sauce (materialId: 153)
(153, 'Asian Imports', 5, 'l', 5000, 'ml', 8.00, 0.008, 40.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- sweet chili (materialId: 154)
(154, 'Asian Imports', 5, 'l', 5000, 'ml', 7.00, 0.007, 35.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- tahini (materialId: 155)
(155, 'Mediterranean Imports', 10, 'kg', 10000, 'g', 12.00, 0.012, 120.00, NOW() - INTERVAL '30 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- thousand island (materialId: 156)
(156, 'Gourmet Foods', 5, 'l', 5000, 'ml', 7.00, 0.007, 35.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days', false, NOW(), NOW()),

-- OILS CATEGORY STOCK ENTRIES

-- olive oil (materialId: 157)
(157, 'Mediterranean Imports', 20, 'l', 20000, 'ml', 10.00, 0.010, 200.00, NOW() - INTERVAL '60 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- vegetable oil (materialId: 158)
(158, 'Wholesale Supplier', 50, 'l', 50000, 'ml', 3.00, 0.003, 150.00, NOW() - INTERVAL '60 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- vinegar (materialId: 159)
(159, 'Gourmet Foods', 10, 'l', 10000, 'ml', 4.00, 0.004, 40.00, NOW() - INTERVAL '60 days', NOW() + INTERVAL '365 days', false, NOW(), NOW()),

-- white sauce (materialId: 160)
(160, 'Gourmet Foods', 10, 'l', 10000, 'ml', 6.00, 0.006, 60.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '90 days', false, NOW(), NOW());

COMMIT;

