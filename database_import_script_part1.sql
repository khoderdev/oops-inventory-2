-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 1: CATEGORIES & MATERIALS
-- This script imports categories and materials based on the provided data
-- Generated to respect the backend model structure

-- Start transaction to ensure data consistency
BEGIN;

-- =====================================================
-- 1. INSERT CATEGORY TYPES
-- =====================================================    -- Insert category types first
INSERT INTO category_types (type, "createdAt", "updatedAt") VALUES
    ('menu_items', NOW(), NOW()),
    ('materials', NOW(), NOW())
ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- 2. INSERT CATEGORIES
-- =====================================================
DO $$
DECLARE
    menu_items_type_id INTEGER;
    materials_type_id INTEGER;
BEGIN
    SELECT id INTO menu_items_type_id FROM category_types WHERE type = 'menu_items';
    SELECT id INTO materials_type_id FROM category_types WHERE type = 'materials';

    -- Insert menu item categories
    INSERT INTO categories (name, value, description, "isActive", "sortOrder", "categoryTypeIds", "createdAt", "updatedAt") VALUES
        ('Appetizers', 'appetizers', 'Appetizer dishes', true, 1, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Platters', 'platters', 'Main platter dishes', true, 2, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Sandwiches', 'sandwiches', 'Sandwich items', true, 3, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Burgers', 'burgers', 'Burger items', true, 4, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Milkshakes', 'milkshakes', 'Milkshake beverages', true, 5, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Cold Drinks', 'cold_drinks', 'Cold beverage items', true, 6, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Hot Drinks', 'hot_drinks', 'Hot beverage items', true, 7, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Alcohol', 'alchool', 'Alcoholic beverages', true, 8, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Tobacco', 'tobacco', 'Tobacco products', true, 9, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Smoothies', 'smoothies', 'Smoothie beverages', true, 10, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Ice Tea', 'ice_tea', 'Iced tea beverages', true, 11, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Iced Coffee', 'iced_coffee', 'Iced coffee beverages', true, 12, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Fresh', 'fresh', 'Fresh beverages', true, 13, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Desserts', 'desserts', 'Dessert items', true, 14, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Pasta', 'pasta', 'Pasta dishes', true, 15, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Salads', 'salads', 'Salad dishes', true, 16, ARRAY[menu_items_type_id], NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;

    -- Insert material categories
    INSERT INTO categories (name, value, description, "isActive", "sortOrder", "categoryTypeIds", "createdAt", "updatedAt") VALUES
        ('Beverages', 'beverages', 'Beverage ingredients', true, 1, ARRAY[materials_type_id], NOW(), NOW()),
        ('Proteins', 'proteins', 'Protein ingredients', true, 2, ARRAY[materials_type_id], NOW(), NOW()),
        ('Dairy', 'dairy', 'Dairy products', true, 3, ARRAY[materials_type_id], NOW(), NOW()),
        ('Vegetables', 'vegetables', 'Vegetable ingredients', true, 4, ARRAY[materials_type_id], NOW(), NOW()),
        ('Sauces', 'sauces', 'Sauce ingredients', true, 5, ARRAY[materials_type_id], NOW(), NOW()),
        ('Spices', 'spices', 'Spice and seasoning ingredients', true, 6, ARRAY[materials_type_id], NOW(), NOW()),
        ('Grains', 'grains', 'Grain and pasta ingredients', true, 7, ARRAY[materials_type_id], NOW(), NOW()),
        ('Fruits', 'fruits', 'Fruit ingredients', true, 8, ARRAY[materials_type_id], NOW(), NOW()),
        ('Bread', 'bread', 'Bread and baked goods', true, 9, ARRAY[materials_type_id], NOW(), NOW()),
        ('Alcohol Materials', 'alcohol_materials', 'Alcoholic beverage ingredients', true, 10, ARRAY[materials_type_id], NOW(), NOW()),
        ('Tobacco Materials', 'tobacco_materials', 'Tobacco product ingredients', true, 11, ARRAY[materials_type_id], NOW(), NOW()),
        ('Dessert Ingredients', 'dessert_ingredients', 'Dessert making ingredients', true, 12, ARRAY[materials_type_id], NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
END $$;

-- =====================================================
-- 3. INSERT MATERIALS
-- =====================================================

-- First, add unique constraint on materials name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'materials_name_unique'
    ) THEN
        ALTER TABLE materials ADD CONSTRAINT materials_name_unique UNIQUE (name);
    END IF;
END $$;

DO $$
DECLARE
    beverages_cat_id INTEGER;
    proteins_cat_id INTEGER;
    dairy_cat_id INTEGER;
    vegetables_cat_id INTEGER;
    sauces_cat_id INTEGER;
    spices_cat_id INTEGER;
    grains_cat_id INTEGER;
    fruits_cat_id INTEGER;
    bread_cat_id INTEGER;
    alcohol_cat_id INTEGER;
    tobacco_cat_id INTEGER;
    dessert_cat_id INTEGER;
BEGIN
    SELECT id INTO beverages_cat_id FROM categories WHERE value = 'beverages';
    SELECT id INTO proteins_cat_id FROM categories WHERE value = 'proteins';
    SELECT id INTO dairy_cat_id FROM categories WHERE value = 'dairy';
    SELECT id INTO vegetables_cat_id FROM categories WHERE value = 'vegetables';
    SELECT id INTO sauces_cat_id FROM categories WHERE value = 'sauces';
    SELECT id INTO spices_cat_id FROM categories WHERE value = 'spices';
    SELECT id INTO grains_cat_id FROM categories WHERE value = 'grains';
    SELECT id INTO fruits_cat_id FROM categories WHERE value = 'fruits';
    SELECT id INTO bread_cat_id FROM categories WHERE value = 'bread';
    SELECT id INTO alcohol_cat_id FROM categories WHERE value = 'alcohol_materials';
    SELECT id INTO tobacco_cat_id FROM categories WHERE value = 'tobacco_materials';
    SELECT id INTO dessert_cat_id FROM categories WHERE value = 'dessert_ingredients';

    -- Insert all unique materials from the data
    INSERT INTO materials (name, "baseUnit", "unitType", "inputUnit", "packageQuantity", "categoryId", "createdAt", "updatedAt") VALUES
        -- Beverages
        ('7up', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('grenadine', 'cl', 'volume', 'cl', NULL, beverages_cat_id, NOW(), NOW()),
        ('almaza', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('bzurat', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('pepsi', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('pepsi diet', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('redbull', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('miranda', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('xxl', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('rim', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('via tannourine', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('water l', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('water s', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('energy drink', 'ml', 'volume', 'ml', NULL, beverages_cat_id, NOW(), NOW()),
        ('tonic', 'ml', 'volume', 'ml', NULL, beverages_cat_id, NOW(), NOW()),
        ('ginger beer', 'ml', 'volume', 'ml', NULL, beverages_cat_id, NOW(), NOW()),
        ('orange juice', 'ml', 'volume', 'ml', NULL, beverages_cat_id, NOW(), NOW()),
        ('lemon juice', 'ml', 'volume', 'ml', NULL, beverages_cat_id, NOW(), NOW()),
        
        -- Coffee and Tea
        ('nescafe gold', 'g', 'mass', 'g', NULL, beverages_cat_id, NOW(), NOW()),
        ('nescafe 2-1', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('nescafe 3-1', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('espresso coffee', 'g', 'mass', 'g', NULL, beverages_cat_id, NOW(), NOW()),
        ('coffee espresso', 'g', 'mass', 'g', NULL, beverages_cat_id, NOW(), NOW()),
        ('cappucino', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('turkish coffee', 'g', 'mass', 'g', NULL, beverages_cat_id, NOW(), NOW()),
        ('tisane', 'pc', 'piece', 'pc', NULL, beverages_cat_id, NOW(), NOW()),
        ('coffeemate', 'g', 'mass', 'g', NULL, beverages_cat_id, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
END $$;

COMMIT;
