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
        ('Beverages', 'menu_items', 'Beverage ingredients', true, 9, ARRAY[beverages_type_id], NOW(), NOW())
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
    -- Beverages (categoryId = 17)
    ('7up', 'bottle', 'package', 'box', 12, 17, NOW(), NOW()),
    ('grenadine', 'ml', 'volume', 'l', NULL, 17, NOW(), NOW()),
    ('almaza', 'bottle', 'package', 'box', 24, 17, NOW(), NOW()),
    ('bzurat', 'bottle', 'package', 'box', 24, 17, NOW(), NOW()),
    ('pepsi', 'bottle', 'package', 'box', 24, 17, NOW(), NOW()),
    ('pepsi diet', 'bottle', 'package', 'box', 24, 17, NOW(), NOW()),
    ('redbull', 'bottle', 'package', 'box', 24, 17, NOW(), NOW()),
    ('miranda', 'bottle', 'package', 'box', 24, 17, NOW(), NOW()),
    ('rim', 'bottle', 'package', 'box', 24, 17, NOW(), NOW()),
    ('via tannourine', 'bottle', 'package', 'box', 12, 17, NOW(), NOW()),
    ('water l', 'bottle', 'package', 'box', 12, 17, NOW(), NOW()),
    ('water s', 'bottle', 'package', 'box', 24, 17, NOW(), NOW()),
    ('xxl', 'bottle', 'package', 'box', 24, 17, NOW(), NOW()),
    ('energy drink', 'ml', 'volume', 'l', NULL, 17, NOW(), NOW()),
    ('tonic', 'ml', 'volume', 'l', NULL, 17, NOW(), NOW()),
    ('ginger beer', 'ml', 'volume', 'l', NULL, 17, NOW(), NOW()),
    ('orange juice', 'ml', 'volume', 'l', NULL, 17, NOW(), NOW()),
    ('nescafe gold', 'g', 'mass', 'kg', NULL, 17, NOW(), NOW()),
    ('espresso coffee', 'g', 'mass', 'kg', NULL, 17, NOW(), NOW()),
    ('cappucino', 'piece', 'package', 'box', 20, 17, NOW(), NOW()),
    ('chocolate powder', 'g', 'mass', 'kg', NULL, 17, NOW(), NOW()),
    ('nescafe 2-1', 'piece', 'package', 'box', 20, 17, NOW(), NOW()),
    ('nescafe 3-1', 'piece', 'package', 'box', 20, 17, NOW(), NOW()),
    ('coffeemate', 'g', 'mass', 'kg', NULL, 17, NOW(), NOW()),
    ('tisane', 'piece', 'package', 'box', 25, 17, NOW(), NOW()),
    ('turkish coffee', 'mass', 'g', 'kg', NULL, 17, NOW(), NOW()),
    ('coffee espresso', 'mass', 'g', 'kg', NULL, 17, NOW(), NOW()),
    ('vanille syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('chocolate syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('strawberry syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('caramel syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('coockies syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('blueberry syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('mango syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('passion fruit syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('peach syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('coconut mixer', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('strawberry mixer', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('mango mixer', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('passion fruit mixer', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('peach mixer', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    ('suggar syrup', 'volume', 'ml', 'l', NULL, 17, NOW(), NOW()),
    
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
    
    -- Tobacco Materials (categoryId = 27)
    ('apple', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('blueberry', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('grape', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('gum', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('gum mint', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('lemon mint', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('love', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('mint', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('orange', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('orange mint', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('watermelon', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('gape mint', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    ('rass maseh', 'mass', 'g', 'kg', NULL, 27, NOW(), NOW()),
    
    -- Dairy (categoryId = 19)
    ('milk liquid', 'volume', 'ml', 'l', NULL, 19, NOW(), NOW()),
    ('fresh crème', 'volume', 'ml', 'l', NULL, 19, NOW(), NOW()),
    ('whipped crème', 'mass', 'g', 'kg', NULL, 19, NOW(), NOW()),
    ('mozzarella cheese', 'mass', 'g', 'kg', NULL, 19, NOW(), NOW()),
    ('cheddar slice', 'piece', 'package', 'pack', 10, 19, NOW(), NOW()),
    ('mozzarella cheese slice', 'piece', 'package', 'pack', 10, 19, NOW(), NOW()),
    ('mozzarella slice', 'piece', 'package', 'pack', 10, 19, NOW(), NOW()),
    ('mozzarella patty', 'mass', 'g', 'kg', NULL, 19, NOW(), NOW()),
    ('parmesan cheese', 'mass', 'g', 'kg', NULL, 19, NOW(), NOW()),
    ('parmesan', 'mass', 'g', 'kg', NULL, 19, NOW(), NOW()),
    ('grilled halloumi', 'mass', 'g', 'kg', NULL, 19, NOW(), NOW()),
    ('emental cheese', 'mass', 'g', 'kg', NULL, 19, NOW(), NOW()),
    ('mozzarella sticks', 'package', 'piece', 'pack', 8, 19, NOW(), NOW()),
    ('cheese balls', 'package', 'piece', 'pack', 12, 19, NOW(), NOW()),
    ('coleslaw', 'mass', 'g', 'kg', NULL, 19, NOW(), NOW()),
    ('croutons', 'mass', 'g', 'kg', NULL, 19, NOW(), NOW()),
    
    -- Sauces (categoryId = 21)
    ('chocolate sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('caramel sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('strawberry sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('bbq sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('mayo sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('mayo', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('ketchup', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('cocktail sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('garlic mayo', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('garlic mayo sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('mayo garlic sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('honey mustard sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('cheddar sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('buffelo sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('hot sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('sweet and chili', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('avocado sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('special sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('oops sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('submarine sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('steak sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('caesar sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('cesar sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('lemon mustard sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('lemon mustard', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('balsamic sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('pesto', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('pesto sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('light mayo pesto sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('red sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('salmon sauce', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW()),
    ('mushroom sauce', 'g', 'mass', 'kg', NULL, 21, NOW(), NOW()),
    ('honey mustard', 'ml', 'volume', 'l', NULL, 21, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
END $$;

COMMIT;
