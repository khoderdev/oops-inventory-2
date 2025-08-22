-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 3: VEGETABLES, SAUCES, AND OTHER MATERIALS
-- This script continues the materials insertion

BEGIN;

-- Ensure unique constraint exists (should already be added by part 1, but check again)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'materials_name_unique'
    ) THEN
        ALTER TABLE materials ADD CONSTRAINT materials_name_unique UNIQUE (name);
    END IF;
END $$;

-- Continue materials insertion
DO $$
DECLARE
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
    SELECT id INTO vegetables_cat_id FROM categories WHERE value = 'vegetables';
    SELECT id INTO sauces_cat_id FROM categories WHERE value = 'sauces';
    SELECT id INTO spices_cat_id FROM categories WHERE value = 'spices';
    SELECT id INTO grains_cat_id FROM categories WHERE value = 'grains';
    SELECT id INTO fruits_cat_id FROM categories WHERE value = 'fruits';
    SELECT id INTO bread_cat_id FROM categories WHERE value = 'bread';
    SELECT id INTO alcohol_cat_id FROM categories WHERE value = 'alcohol_materials';
    SELECT id INTO tobacco_cat_id FROM categories WHERE value = 'tobacco_materials';
    SELECT id INTO dessert_cat_id FROM categories WHERE value = 'dessert_ingredients';

    -- Vegetables and Produce
    INSERT INTO materials (name, "baseUnit", "unitType", "inputUnit", "packageQuantity", "categoryId", "createdAt", "updatedAt") VALUES
        ('bell pepper', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('icebUrg', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('iceburg', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('cherry tomatoes', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('cherry tomato', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('tomato', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('mushroom', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('fresh mushroom', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('onion', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('caramelized onion', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('avocado', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('rocca leaves', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('rocca', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('vegetables', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('green pepper', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('carrot', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('cucumber', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('corn', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('red cabbage', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('jalapeno', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('lemon', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),
        ('mint', 'lvs', 'piece', 'lvs', NULL, vegetables_cat_id, NOW(), NOW()),
        ('coleslaw', 'g', 'mass', 'g', NULL, vegetables_cat_id, NOW(), NOW()),

        -- Fruits
        ('orange', 'ml', 'volume', 'ml', NULL, fruits_cat_id, NOW(), NOW()),
        ('mango', 'g', 'mass', 'g', NULL, fruits_cat_id, NOW(), NOW()),
        ('walnut', 'g', 'mass', 'g', NULL, fruits_cat_id, NOW(), NOW()),

        -- Sauces and Condiments
        ('mayo sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('mayo', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('bbq sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('bbq', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('cheddar sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('oops sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('garlic mayo', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('garlic mayo sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('mayo garlic sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('cocktail sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('honey mustard sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('honey mustard', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('avocado sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('caesar sauce', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('cesar sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('light mayo pesto sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('pesto sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('pesto', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('red sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('lemon mustard sauce', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('lemon mustard', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('special sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('submarine sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('steak sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('salmon sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('mushroom sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('buffelo sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('hot sauce', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('sweet and chili', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('balsamic sauce', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('ketchup', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('ketshup', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('honey', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('soya', 'g', 'mass', 'g', NULL, sauces_cat_id, NOW(), NOW()),
        ('suggar syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
END $$;

COMMIT;
