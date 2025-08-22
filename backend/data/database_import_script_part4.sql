-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 4: SYRUPS, GRAINS, BREAD, ALCOHOL, TOBACCO, DESSERTS
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
    sauces_cat_id INTEGER;
    spices_cat_id INTEGER;
    grains_cat_id INTEGER;
    bread_cat_id INTEGER;
    alcohol_cat_id INTEGER;
    tobacco_cat_id INTEGER;
    dessert_cat_id INTEGER;
BEGIN
    SELECT id INTO sauces_cat_id FROM categories WHERE value = 'sauces';
    SELECT id INTO spices_cat_id FROM categories WHERE value = 'spices';
    SELECT id INTO grains_cat_id FROM categories WHERE value = 'grains';
    SELECT id INTO bread_cat_id FROM categories WHERE value = 'bread';
    SELECT id INTO alcohol_cat_id FROM categories WHERE value = 'alcohol_materials';
    SELECT id INTO tobacco_cat_id FROM categories WHERE value = 'tobacco_materials';
    SELECT id INTO dessert_cat_id FROM categories WHERE value = 'dessert_ingredients';

    -- Syrups and Mixers
    INSERT INTO materials (name, "baseUnit", "unitType", "inputUnit", "packageQuantity", "categoryId", "createdAt", "updatedAt") VALUES
        ('caramel sauce', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('caramel syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('vanille syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('chocolate sauce', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('chocolate syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('strawberry sauce', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('strawberry syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('coockies syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('blueberry syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('mango syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('passion fruit syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('peach syrup', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('coconut mixer', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('strawberry mixer', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('mango mixer', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('passion fruit mixer', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('peach mixer', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        ('forest mixer', 'ml', 'volume', 'ml', NULL, sauces_cat_id, NOW(), NOW()),
        
        -- Powders and Spices
        ('chocolate powder', 'g', 'mass', 'g', NULL, spices_cat_id, NOW(), NOW()),
        ('vanille powder', 'g', 'mass', 'g', NULL, spices_cat_id, NOW(), NOW()),
        ('coockies powder', 'g', 'mass', 'g', NULL, spices_cat_id, NOW(), NOW()),
        ('tofe powder', 'g', 'mass', 'g', NULL, spices_cat_id, NOW(), NOW()),
        ('suggar', 'g', 'mass', 'g', NULL, spices_cat_id, NOW(), NOW()),
        
        -- Grains and Pasta
        ('fries', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('french fries', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('wedges', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('curly fries', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('tagliatelle pasta', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('tagliatele', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('spaguetti pasta', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('penne pasta', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('penne', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('mac n cheese pasta', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('liguine pasta', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('linguini pasta', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('mashed potato', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('chips', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('chips sticks', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('nachos', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        ('croutons', 'g', 'mass', 'g', NULL, grains_cat_id, NOW(), NOW()),
        
        -- Bread Products
        ('sub bread', 'pc', 'piece', 'pc', NULL, bread_cat_id, NOW(), NOW()),
        ('white bun', 'pc', 'piece', 'pc', NULL, bread_cat_id, NOW(), NOW()),
        ('brown bread', 'pc', 'piece', 'pc', NULL, bread_cat_id, NOW(), NOW()),
        ('borwn bun', 'pc', 'piece', 'pc', NULL, bread_cat_id, NOW(), NOW()),
        ('tacos bread', 'pc', 'piece', 'pc', NULL, bread_cat_id, NOW(), NOW()),
        ('francesco bread', 'pc', 'piece', 'pc', NULL, bread_cat_id, NOW(), NOW()),
        ('ciabatta bread', 'pc', 'piece', 'pc', NULL, bread_cat_id, NOW(), NOW()),
        ('arabic bread', 'pc', 'piece', 'pc', NULL, bread_cat_id, NOW(), NOW()),
        
        -- Dessert Items
        ('chocolate brownies', 'pc', 'piece', 'pc', NULL, dessert_cat_id, NOW(), NOW()),
        ('chocolate fondant', 'pc', 'piece', 'pc', NULL, dessert_cat_id, NOW(), NOW()),
        ('fudge cake', 'pc', 'piece', 'pc', NULL, dessert_cat_id, NOW(), NOW()),
        ('oreo cake', 'pc', 'piece', 'pc', NULL, dessert_cat_id, NOW(), NOW()),
        ('lazy cake', 'pc', 'piece', 'pc', NULL, dessert_cat_id, NOW(), NOW()),
        ('strawberry cheese cake', 'pc', 'piece', 'pc', NULL, dessert_cat_id, NOW(), NOW()),
        ('triple chocolate cake', 'pc', 'piece', 'pc', NULL, dessert_cat_id, NOW(), NOW()),
        ('tiramisu bliss', 'ml', 'volume', 'ml', NULL, dessert_cat_id, NOW(), NOW()),
        
        -- Alcohol
        ('gin', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        ('vodka', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        ('rum', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        ('tequila silver', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        ('triple sec', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        ('whiskey black', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        ('whiskey red', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        ('red wine', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        ('rose wine', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        ('white wine', 'ml', 'volume', 'ml', NULL, alcohol_cat_id, NOW(), NOW()),
        
        -- Tobacco
        ('apple', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('blueberry', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('gape mint', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('grape', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('gum', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('gum mint', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('lemon mint', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('love', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('orange', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('orange mint', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('rass maseh', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW()),
        ('watermelon', 'g', 'mass', 'g', NULL, tobacco_cat_id, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
END $$;

COMMIT;
