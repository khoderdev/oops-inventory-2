-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 6: MENU ITEMS (FIXED)
-- This script creates menu items with correct category IDs from actual database

BEGIN;

-- First, add unique constraint on menuItems name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'menuItems_name_unique'
    ) THEN
        ALTER TABLE "menuItems" ADD CONSTRAINT menuItems_name_unique UNIQUE (name);
    END IF;
END $$;

-- Insert menu items with hardcoded category IDs based on actual database values
-- Category IDs: Appetizers=16, Main Plates=19, Sushi=21, Salads=23, Sandwiches=18, Burgers=17, Desserts=24, Shisha=26, Breakfast=25

INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
    -- Cold Drinks (using Breakfast category ID=25 as beverages placeholder)
    ('7up', '7up soft drink', 25, 2.50, true, NOW(), NOW()),
    ('7up + grenadine', '7up with grenadine syrup', 25, 3.00, true, NOW(), NOW()),
    ('bzurat', 'Bzurat drink', 25, 2.00, true, NOW(), NOW()),
    ('mexican redbull', 'Red Bull with lemon', 25, 4.50, true, NOW(), NOW()),
    ('mexican xxl', 'XXL energy drink with lemon', 25, 4.00, true, NOW(), NOW()),
    ('miranda', 'Miranda soft drink', 25, 2.50, true, NOW(), NOW()),
    ('pepsi', 'Pepsi cola', 25, 2.50, true, NOW(), NOW()),
    ('pepsi diet', 'Diet Pepsi', 25, 2.50, true, NOW(), NOW()),
    ('redbull', 'Red Bull energy drink', 25, 4.00, true, NOW(), NOW()),
    ('rim', 'Rim soft drink', 25, 2.50, true, NOW(), NOW()),
    ('via tannourine', 'Via Tannourine water', 25, 1.50, true, NOW(), NOW()),
    ('water l', 'Large water bottle', 25, 1.00, true, NOW(), NOW()),
    ('water s', 'Small water bottle', 25, 0.75, true, NOW(), NOW()),
    ('xxl', 'XXL energy drink', 25, 3.50, true, NOW(), NOW()),

    -- Hot Drinks (using Breakfast category ID=25 as beverages placeholder)
    ('american coffee', 'American style coffee', 25, 3.00, true, NOW(), NOW()),
    ('café latte', 'Café latte', 25, 4.50, true, NOW(), NOW()),
    ('café latte caramel', 'Caramel café latte', 25, 5.00, true, NOW(), NOW()),
    ('café latte vanille', 'Vanilla café latte', 25, 5.00, true, NOW(), NOW()),
    ('cappucino', 'Cappuccino', 25, 4.00, true, NOW(), NOW()),
    ('espresso', 'Espresso shot', 25, 2.50, true, NOW(), NOW()),
    ('hot chocolate', 'Hot chocolate drink', 25, 4.00, true, NOW(), NOW()),
    ('nescafe 2-1', 'Nescafe 2-in-1', 25, 2.50, true, NOW(), NOW()),
    ('nescafe 3-1', 'Nescafe 3-in-1', 25, 3.00, true, NOW(), NOW()),
    ('nescafe gold coffeemate', 'Nescafe Gold with Coffeemate', 25, 3.50, true, NOW(), NOW()),
    ('nescafe gold milk', 'Nescafe Gold with milk', 25, 3.50, true, NOW(), NOW()),
    ('tisane', 'Herbal tea', 25, 2.00, true, NOW(), NOW()),
    ('turkish coffee', 'Turkish coffee', 25, 3.50, true, NOW(), NOW()),

    -- Alcohol (using Main Plates category ID=19 as placeholder)
    ('almaza beer', 'Almaza beer', 19, 4.00, true, NOW(), NOW()),
    ('gin basel', 'Gin with basil and energy drink', 19, 8.00, true, NOW(), NOW()),
    ('gin tonic', 'Gin and tonic', 19, 7.50, true, NOW(), NOW()),
    ('london mule', 'London Mule cocktail', 19, 9.00, true, NOW(), NOW()),
    ('long island', 'Long Island Iced Tea', 19, 10.00, true, NOW(), NOW()),
    ('margarita', 'Classic margarita', 19, 8.50, true, NOW(), NOW()),
    ('mexican almaza beer', 'Mexican style Almaza beer', 19, 4.50, true, NOW(), NOW()),
    ('moscow mule', 'Moscow Mule cocktail', 19, 8.50, true, NOW(), NOW()),
    ('red wine', 'Red wine glass', 19, 6.00, true, NOW(), NOW()),
    ('rose wine', 'Rosé wine glass', 19, 6.00, true, NOW(), NOW()),
    ('vodka + 7up', 'Vodka with 7up', 19, 7.00, true, NOW(), NOW()),
    ('vodka + energy drink', 'Vodka with energy drink', 19, 8.00, true, NOW(), NOW()),
    ('vodka + orange', 'Vodka with orange juice', 19, 7.50, true, NOW(), NOW()),
    ('whiskey black label', 'Black Label whiskey', 19, 9.00, true, NOW(), NOW()),
    ('whiskey red label', 'Red Label whiskey', 19, 8.00, true, NOW(), NOW()),
    ('white wine', 'White wine glass', 19, 6.00, true, NOW(), NOW()),

    -- Tobacco/Shisha (using Shisha category ID=26)
    ('apple', 'Apple flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('blueberry', 'Blueberry flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('gape mint', 'Grape mint flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('grape', 'Grape flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('gum', 'Gum flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('gum mint', 'Gum mint flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('lemon mint', 'Lemon mint flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('love', 'Love flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('mint', 'Mint flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('orange', 'Orange flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('orange mint', 'Orange mint flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('rass maseh', 'Rass Maseh flavored shisha', 26, 12.00, true, NOW(), NOW()),
    ('watermelon', 'Watermelon flavored shisha', 26, 12.00, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;
