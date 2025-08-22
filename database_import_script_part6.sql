-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 6: MENU ITEMS
-- This script creates menu items with proper category relationships

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

-- Insert menu items with proper category relationships
DO $$
DECLARE
    appetizers_cat_id INTEGER;
    platters_cat_id INTEGER;
    sandwiches_cat_id INTEGER;
    burgers_cat_id INTEGER;
    milkshakes_cat_id INTEGER;
    cold_drinks_cat_id INTEGER;
    hot_drinks_cat_id INTEGER;
    alcohol_cat_id INTEGER;
    tobacco_cat_id INTEGER;
    smoothies_cat_id INTEGER;
    ice_tea_cat_id INTEGER;
    iced_coffee_cat_id INTEGER;
    fresh_cat_id INTEGER;
    desserts_cat_id INTEGER;
    pasta_cat_id INTEGER;
    salads_cat_id INTEGER;
BEGIN
    -- Get category IDs
    SELECT id INTO appetizers_cat_id FROM categories WHERE value = 'appetizers';
    SELECT id INTO platters_cat_id FROM categories WHERE value = 'platters';
    SELECT id INTO sandwiches_cat_id FROM categories WHERE value = 'sandwiches';
    SELECT id INTO burgers_cat_id FROM categories WHERE value = 'burgers';
    SELECT id INTO milkshakes_cat_id FROM categories WHERE value = 'milkshakes';
    SELECT id INTO cold_drinks_cat_id FROM categories WHERE value = 'cold_drinks';
    SELECT id INTO hot_drinks_cat_id FROM categories WHERE value = 'hot_drinks';
    SELECT id INTO alcohol_cat_id FROM categories WHERE value = 'alchool';
    SELECT id INTO tobacco_cat_id FROM categories WHERE value = 'tobacco';
    SELECT id INTO smoothies_cat_id FROM categories WHERE value = 'smoothies';
    SELECT id INTO ice_tea_cat_id FROM categories WHERE value = 'ice_tea';
    SELECT id INTO iced_coffee_cat_id FROM categories WHERE value = 'iced_coffee';
    SELECT id INTO fresh_cat_id FROM categories WHERE value = 'fresh';
    SELECT id INTO desserts_cat_id FROM categories WHERE value = 'desserts';
    SELECT id INTO pasta_cat_id FROM categories WHERE value = 'pasta';
    SELECT id INTO salads_cat_id FROM categories WHERE value = 'salads';

    -- Insert menu items
    INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
        -- Cold Drinks
        ('7up', '7up soft drink', cold_drinks_cat_id, 2.50, true, NOW(), NOW()),
        ('7up + grenadine', '7up with grenadine syrup', cold_drinks_cat_id, 3.00, true, NOW(), NOW()),
        ('bzurat', 'Bzurat drink', cold_drinks_cat_id, 2.00, true, NOW(), NOW()),
        ('mexican redbull', 'Red Bull with lemon', cold_drinks_cat_id, 4.50, true, NOW(), NOW()),
        ('mexican xxl', 'XXL energy drink with lemon', cold_drinks_cat_id, 4.00, true, NOW(), NOW()),
        ('miranda', 'Miranda soft drink', cold_drinks_cat_id, 2.50, true, NOW(), NOW()),
        ('pepsi', 'Pepsi cola', cold_drinks_cat_id, 2.50, true, NOW(), NOW()),
        ('pepsi diet', 'Diet Pepsi', cold_drinks_cat_id, 2.50, true, NOW(), NOW()),
        ('redbull', 'Red Bull energy drink', cold_drinks_cat_id, 4.00, true, NOW(), NOW()),
        ('rim', 'Rim soft drink', cold_drinks_cat_id, 2.50, true, NOW(), NOW()),
        ('via tannourine', 'Via Tannourine water', cold_drinks_cat_id, 1.50, true, NOW(), NOW()),
        ('water l', 'Large water bottle', cold_drinks_cat_id, 1.00, true, NOW(), NOW()),
        ('water s', 'Small water bottle', cold_drinks_cat_id, 0.75, true, NOW(), NOW()),
        ('xxl', 'XXL energy drink', cold_drinks_cat_id, 3.50, true, NOW(), NOW()),

        -- Hot Drinks
        ('american coffee', 'American style coffee', hot_drinks_cat_id, 3.00, true, NOW(), NOW()),
        ('café latte', 'Café latte', hot_drinks_cat_id, 4.50, true, NOW(), NOW()),
        ('café latte caramel', 'Caramel café latte', hot_drinks_cat_id, 5.00, true, NOW(), NOW()),
        ('café latte vanille', 'Vanilla café latte', hot_drinks_cat_id, 5.00, true, NOW(), NOW()),
        ('cappucino', 'Cappuccino', hot_drinks_cat_id, 4.00, true, NOW(), NOW()),
        ('espresso', 'Espresso shot', hot_drinks_cat_id, 2.50, true, NOW(), NOW()),
        ('hot chocolate', 'Hot chocolate drink', hot_drinks_cat_id, 4.00, true, NOW(), NOW()),
        ('nescafe 2-1', 'Nescafe 2-in-1', hot_drinks_cat_id, 2.50, true, NOW(), NOW()),
        ('nescafe 3-1', 'Nescafe 3-in-1', hot_drinks_cat_id, 3.00, true, NOW(), NOW()),
        ('nescafe gold coffeemate', 'Nescafe Gold with Coffeemate', hot_drinks_cat_id, 3.50, true, NOW(), NOW()),
        ('nescafe gold milk', 'Nescafe Gold with milk', hot_drinks_cat_id, 3.50, true, NOW(), NOW()),
        ('tisane', 'Herbal tea', hot_drinks_cat_id, 2.00, true, NOW(), NOW()),
        ('turkish coffee', 'Turkish coffee', hot_drinks_cat_id, 3.50, true, NOW(), NOW()),

        -- Alcohol
        ('almaza beer', 'Almaza beer', alcohol_cat_id, 4.00, true, NOW(), NOW()),
        ('gin basel', 'Gin with basil and energy drink', alcohol_cat_id, 8.00, true, NOW(), NOW()),
        ('gin tonic', 'Gin and tonic', alcohol_cat_id, 7.50, true, NOW(), NOW()),
        ('london mule', 'London Mule cocktail', alcohol_cat_id, 9.00, true, NOW(), NOW()),
        ('long island', 'Long Island Iced Tea', alcohol_cat_id, 10.00, true, NOW(), NOW()),
        ('margarita', 'Classic margarita', alcohol_cat_id, 8.50, true, NOW(), NOW()),
        ('mexican almaza beer', 'Mexican style Almaza beer', alcohol_cat_id, 4.50, true, NOW(), NOW()),
        ('moscow mule', 'Moscow Mule cocktail', alcohol_cat_id, 8.50, true, NOW(), NOW()),
        ('red wine', 'Red wine glass', alcohol_cat_id, 6.00, true, NOW(), NOW()),
        ('rose wine', 'Rosé wine glass', alcohol_cat_id, 6.00, true, NOW(), NOW()),
        ('vodka + 7up', 'Vodka with 7up', alcohol_cat_id, 7.00, true, NOW(), NOW()),
        ('vodka + energy drink', 'Vodka with energy drink', alcohol_cat_id, 8.00, true, NOW(), NOW()),
        ('vodka + orange', 'Vodka with orange juice', alcohol_cat_id, 7.50, true, NOW(), NOW()),
        ('whiskey black label', 'Black Label whiskey', alcohol_cat_id, 9.00, true, NOW(), NOW()),
        ('whiskey red label', 'Red Label whiskey', alcohol_cat_id, 8.00, true, NOW(), NOW()),
        ('white wine', 'White wine glass', alcohol_cat_id, 6.00, true, NOW(), NOW()),

        -- Tobacco
        ('apple', 'Apple flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('blueberry', 'Blueberry flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('gape mint', 'Grape mint flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('grape', 'Grape flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('gum', 'Gum flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('gum mint', 'Gum mint flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('lemon mint', 'Lemon mint flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('love', 'Love flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('mint', 'Mint flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('orange', 'Orange flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('orange mint', 'Orange mint flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('rass maseh', 'Rass Maseh flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW()),
        ('watermelon', 'Watermelon flavored shisha', tobacco_cat_id, 12.00, true, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
END $$;

COMMIT;
