-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 2: REMAINING MATERIALS
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

    -- Dairy Products
    INSERT INTO materials (name, "baseUnit", "unitType", "inputUnit", "packageQuantity", "categoryId", "createdAt", "updatedAt") VALUES
        ('milk liquid', 'ml', 'volume', 'ml', NULL, dairy_cat_id, NOW(), NOW()),
        ('fresh crème', 'ml', 'volume', 'ml', NULL, dairy_cat_id, NOW(), NOW()),
        ('mozzarella cheese', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('cheddar slice', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('mozzarella cheese slice', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('mozzarella slice', 'pc', 'piece', 'pc', NULL, dairy_cat_id, NOW(), NOW()),
        ('parmesan cheese', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('parmesan', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('emental cheese', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('grilled halloumi', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('whipped crème', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('icecream vanille', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('icecream strawberry', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        ('icecream chocolate', 'g', 'mass', 'g', NULL, dairy_cat_id, NOW(), NOW()),
        
        -- Proteins
        ('chicken roulade', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('marinated grilled chicken', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('breaded chicken', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('beef patty', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('mozzarella patty', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('chicken breast', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('grilled marinated chicken', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('grilled chicken', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('chicken crispy', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('crispy chicken', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('chicken wings', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('bacon', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('ham jonbon', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('salami', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('pepperoni', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('taouk', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('salmon', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('smoked salmon', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('grilled beef filet', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('marinate beef filet', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('shrimps large', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('shrimp', 'g', 'mass', 'g', NULL, proteins_cat_id, NOW(), NOW()),
        ('crab sticks', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('crab mix', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('fish fingers', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('calamari rings', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('tuna', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('mozzarella sticks', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW()),
        ('cheese balls', 'pc', 'piece', 'pc', NULL, proteins_cat_id, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
END $$;

COMMIT;
