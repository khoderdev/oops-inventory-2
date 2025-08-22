-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 1: CATEGORIES & MATERIALS
-- This script imports categories and materials based on the provided data
-- Generated to respect the backend model structure

-- Start transaction to ensure data consistency
BEGIN;

-- =====================================================
-- 1. INSERT CATEGORY TYPES
-- =====================================================

-- Insert category types first
INSERT INTO category_types (type, "createdAt", "updatedAt") VALUES
    ('menu_items', NOW(), NOW()),
    ('materials', NOW(), NOW()),
    ('beverages', NOW(), NOW())
ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- 2. INSERT CATEGORIES
-- =====================================================
DO $$
DECLARE
    menu_items_type_id INTEGER;
    materials_type_id INTEGER;
    beverages_type_id INTEGER;
BEGIN
    SELECT id INTO menu_items_type_id FROM category_types WHERE type = 'menu_items';
    SELECT id INTO materials_type_id FROM category_types WHERE type = 'materials';
    SELECT id INTO beverages_type_id FROM category_types WHERE type = 'beverages';

    -- Insert menu item categories
    INSERT INTO categories (name, value, description, "isActive", "sortOrder", "categoryTypeIds", "createdAt", "updatedAt") VALUES
        ('Appetizers', 'appetizers', 'Appetizer dishes', true, 1, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Platters', 'platters', 'Main platter dishes', true, 2, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Sandwiches', 'sandwiches', 'Sandwich items', true, 3, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Burgers', 'burgers', 'Burger items', true, 4, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Tobacco', 'tobacco', 'Tobacco products', true, 5, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Desserts', 'desserts', 'Dessert items', true, 6, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Pasta', 'pasta', 'Pasta dishes', true, 7, ARRAY[menu_items_type_id], NOW(), NOW()),
        ('Salads', 'salads', 'Salad dishes', true, 8, ARRAY[menu_items_type_id], NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;

    -- Insert beverage categories (beverages_type_id only)
    INSERT INTO categories (name, value, description, "isActive", "sortOrder", "categoryTypeIds", "createdAt", "updatedAt") VALUES
        ('Milkshakes', 'milkshakes', 'Milkshake beverages', true, 1, ARRAY[beverages_type_id], NOW(), NOW()),
        ('Cold Drinks', 'cold_drinks', 'Cold beverage items', true, 2, ARRAY[beverages_type_id], NOW(), NOW()),
        ('Hot Drinks', 'hot_drinks', 'Hot beverage items', true, 3, ARRAY[beverages_type_id], NOW(), NOW()),
        ('Alcohol', 'alcohol', 'Alcoholic beverages', true, 4, ARRAY[beverages_type_id], NOW(), NOW()),
        ('Smoothies', 'smoothies', 'Smoothie beverages', true, 5, ARRAY[beverages_type_id], NOW(), NOW()),
        ('Ice Tea', 'ice_tea', 'Iced tea beverages', true, 6, ARRAY[beverages_type_id], NOW(), NOW()),
        ('Iced Coffee', 'iced_coffee', 'Iced coffee beverages', true, 7, ARRAY[beverages_type_id], NOW(), NOW()),
        ('Fresh', 'fresh', 'Fresh beverages', true, 8, ARRAY[beverages_type_id], NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;

    -- Insert material categories
    INSERT INTO categories (name, value, description, "isActive", "sortOrder", "categoryTypeIds", "createdAt", "updatedAt") VALUES
        ('Proteins', 'proteins', 'Protein ingredients', true, 1, ARRAY[materials_type_id], NOW(), NOW()),
        ('Dairy', 'dairy', 'Dairy products', true, 2, ARRAY[materials_type_id], NOW(), NOW()),
        ('Vegetables', 'vegetables', 'Vegetable ingredients', true, 3, ARRAY[materials_type_id], NOW(), NOW()),
        ('Sauces', 'sauces', 'Sauce ingredients', true, 4, ARRAY[materials_type_id], NOW(), NOW()),
        ('Spices', 'spices', 'Spice and seasoning ingredients', true, 5, ARRAY[materials_type_id], NOW(), NOW()),
        ('Grains', 'grains', 'Grain and pasta ingredients', true, 6, ARRAY[materials_type_id], NOW(), NOW()),
        ('Fruits', 'fruits', 'Fruit ingredients', true, 7, ARRAY[materials_type_id], NOW(), NOW()),
        ('Bread', 'bread', 'Bread and baked goods', true, 8, ARRAY[materials_type_id], NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;

    -- Insert beverage material category (beverages_type_id only)
    INSERT INTO categories (name, value, description, "isActive", "sortOrder", "categoryTypeIds", "createdAt", "updatedAt") VALUES
        ('Beverages', 'beverages', 'Beverage ingredients', true, 9, ARRAY[materials_type_id], NOW(), NOW())
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
    SELECT id INTO alcohol_cat_id FROM categories WHERE value = 'alcohol';
    SELECT id INTO tobacco_cat_id FROM categories WHERE value = 'tobacco';
    SELECT id INTO dessert_cat_id FROM categories WHERE value = 'desserts';

-- Insert materials with correct category IDs from your database
INSERT INTO materials (name, "baseUnit", "unitType", "inputUnit", "packageQuantity", "categoryId", "createdAt", "updatedAt")
VALUES
    -- Beverages
    ('7up', 'bottle', 'package', 'box', 12, beverages_cat_id, NOW(), NOW()),
    ('grenadine', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('almaza', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    ('bzurat', 'g', 'mass', 'kg', NULL, spices_cat_id, NOW(), NOW()),
    ('pepsi', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    ('pepsi diet', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    ('redbull', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    ('miranda', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    ('rim', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    ('via tannourine', 'bottle', 'package', 'box', 12, beverages_cat_id, NOW(), NOW()),
    ('water l', 'bottle', 'package', 'box', 12, beverages_cat_id, NOW(), NOW()),
    ('water s', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    ('xxl', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    ('energy drink', 'bottle', 'package', 'box', 12, beverages_cat_id, NOW(), NOW()),
    ('tonic', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('ginger beer', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('orange juice', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('nescafe gold', 'g', 'mass', 'kg', NULL, beverages_cat_id, NOW(), NOW()),
    ('espresso coffee', 'g', 'mass', 'kg', NULL, beverages_cat_id, NOW(), NOW()),
    ('cappucino', 'piece', 'package', 'pack', 20, beverages_cat_id, NOW(), NOW()),
    ('chocolate powder', 'g', 'mass', 'kg', NULL, beverages_cat_id, NOW(), NOW()),
    ('nescafe 2-1', 'piece', 'package', 'box', 20, beverages_cat_id, NOW(), NOW()),
    ('nescafe 3-1', 'piece', 'package', 'box', 20, beverages_cat_id, NOW(), NOW()),
    ('coffeemate', 'g', 'mass', 'kg', NULL, beverages_cat_id, NOW(), NOW()),
    ('tisane', 'piece', 'package', 'box', 25, beverages_cat_id, NOW(), NOW()),
    ('turkish coffee', 'g', 'mass', 'kg', NULL, beverages_cat_id, NOW(), NOW()),
    ('coffee espresso', 'g', 'mass', 'kg', NULL, beverages_cat_id, NOW(), NOW()),
    ('vanille syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('chocolate syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('strawberry syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('caramel syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('coockies syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('blueberry syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('mango syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('passion fruit syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('peach syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('coconut mixer', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('strawberry mixer', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('mango mixer', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('passion fruit mixer', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('peach mixer', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('suggar syrup', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    
    -- Alcohol Materials (moved to Beverages category)
    ('gin', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('vodka', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('rum', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('tequila silver', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('triple sec', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('whiskey black', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('whiskey red', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('red wine', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('rose wine', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('white wine', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('black label', 'bottle', 'package', 'box', 12, beverages_cat_id, NOW(), NOW()),
    ('red label', 'bottle', 'package', 'box', 12, beverages_cat_id, NOW(), NOW()),
    ('grey goose', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('absolut vodka', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('bacardi rum', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('jose cuervo', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('cointreau', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('grand marnier', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('baileys', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('kahlua', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('amaretto', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('sambuca', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('jagermeister', 'ml', 'volume', 'l', NULL, beverages_cat_id, NOW(), NOW()),
    ('champagne', 'bottle', 'package', 'box', 6, beverages_cat_id, NOW(), NOW()),
    ('prosecco', 'bottle', 'package', 'box', 6, beverages_cat_id, NOW(), NOW()),
    ('beer local', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    ('beer imported', 'bottle', 'package', 'box', 24, beverages_cat_id, NOW(), NOW()),
    
    -- Tobacco Materials
    ('apple', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('blueberry', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('grape', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('gum', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('gum mint', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('lemon mint', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('love', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('mint', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('orange', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('orange mint', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('watermelon', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('gape mint', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    ('rass maseh', 'g', 'mass', 'kg', NULL, tobacco_cat_id, NOW(), NOW()),
    
    -- Dairy
    ('milk liquid', 'ml', 'volume', 'l', NULL, dairy_cat_id, NOW(), NOW()),
    ('fresh crème', 'ml', 'volume', 'l', NULL, dairy_cat_id, NOW(), NOW()),
    ('whipped crème', 'g', 'mass', 'kg', NULL, dairy_cat_id, NOW(), NOW()),
    ('mozzarella cheese', 'g', 'mass', 'kg', NULL, dairy_cat_id, NOW(), NOW()),
    ('cheddar slice', 'piece', 'package', 'pack', 10, dairy_cat_id, NOW(), NOW()),
    ('mozzarella cheese slice', 'piece', 'package', 'pack', 10, dairy_cat_id, NOW(), NOW()),
    ('mozzarella slice', 'piece', 'package', 'pack', 10, dairy_cat_id, NOW(), NOW()),
    ('mozzarella patty', 'g', 'mass', 'kg', NULL, dairy_cat_id, NOW(), NOW()),
    ('parmesan cheese', 'g', 'mass', 'kg', NULL, dairy_cat_id, NOW(), NOW()),
    ('parmesan', 'g', 'mass', 'kg', NULL, dairy_cat_id, NOW(), NOW()),
    ('grilled halloumi', 'g', 'mass', 'kg', NULL, dairy_cat_id, NOW(), NOW()),
    ('emental cheese', 'g', 'mass', 'kg', NULL, dairy_cat_id, NOW(), NOW()),
    ('mozzarella sticks', 'piece', 'package', 'pack', 8, dairy_cat_id, NOW(), NOW()),
    ('cheese balls', 'piece', 'package', 'pack', 12, dairy_cat_id, NOW(), NOW()),
    ('coleslaw', 'g', 'mass', 'kg', NULL, dairy_cat_id, NOW(), NOW()),
    ('croutons', 'g', 'mass', 'kg', NULL, dairy_cat_id, NOW(), NOW()),
    
    -- Sauces
    ('chocolate sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('caramel sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('strawberry sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('bbq sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('mayo sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('mayo', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('ketchup', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('cocktail sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('garlic mayo', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('garlic mayo sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('mayo garlic sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('honey mustard sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('cheddar sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('buffelo sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('hot sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('sweet and chili', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('avocado sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('special sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('oops sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('submarine sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('steak sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('caesar sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('cesar sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('lemon mustard sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('lemon mustard', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('balsamic sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('pesto', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('pesto sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('light mayo pesto sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('red sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('salmon sauce', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW()),
    ('mushroom sauce', 'g', 'mass', 'kg', NULL, sauces_cat_id, NOW(), NOW()),
    ('honey mustard', 'ml', 'volume', 'l', NULL, sauces_cat_id, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
END $$;

COMMIT;
