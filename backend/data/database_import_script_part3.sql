-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 3: COMPLETE MENU ITEMS
-- This script adds ALL menu items from the provided comprehensive data

BEGIN;

-- Ensure unique constraint exists on menuItems name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'menuItems_name_unique'
    ) THEN
        ALTER TABLE "menuItems" ADD CONSTRAINT menuItems_name_unique UNIQUE (name);
    END IF;
END $$;

-- Declare variables for category IDs
DO $$
DECLARE
    appetizers_id INTEGER;
    platters_id INTEGER;
    burgers_id INTEGER;
    cold_drinks_id INTEGER;
    hot_drinks_id INTEGER;
    alcohol_id INTEGER;
    tobacco_id INTEGER;
BEGIN
    -- Get category IDs dynamically
    SELECT id INTO appetizers_id FROM categories WHERE name = 'Appetizers';
    SELECT id INTO platters_id FROM categories WHERE name = 'Platters';
    SELECT id INTO burgers_id FROM categories WHERE name = 'Burgers';
    SELECT id INTO cold_drinks_id FROM categories WHERE name = 'Fresh';
    SELECT id INTO hot_drinks_id FROM categories WHERE name = 'Hot Drinks';
    SELECT id INTO alcohol_id FROM categories WHERE name = 'Alcohol';
    SELECT id INTO tobacco_id FROM categories WHERE name = 'Tobacco';
    
    -- Insert ALL menu items with proper category assignments based on provided data
    INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
    -- Cold drinks (Fresh category)
    ('7up', '7up soft drink', cold_drinks_id, 2.50, true, NOW(), NOW()),
    ('7up + grenadine', '7up with grenadine syrup', cold_drinks_id, 3.00, true, NOW(), NOW()),
    ('bzurat', 'Bzurat traditional drink', cold_drinks_id, 2.00, true, NOW(), NOW()),
    ('mexican redbull', 'Mexican style Red Bull', cold_drinks_id, 4.50, true, NOW(), NOW()),
    ('mexican xxl', 'Mexican style XXL energy drink', cold_drinks_id, 4.00, true, NOW(), NOW()),
    ('miranda', 'Miranda soft drink', cold_drinks_id, 2.50, true, NOW(), NOW()),
    ('pepsi', 'Pepsi cola', cold_drinks_id, 2.50, true, NOW(), NOW()),
    ('pepsi diet', 'Diet Pepsi', cold_drinks_id, 2.50, true, NOW(), NOW()),
    ('redbull', 'Red Bull energy drink', cold_drinks_id, 4.50, true, NOW(), NOW()),
    ('rim', 'Rim soft drink', cold_drinks_id, 3.00, true, NOW(), NOW()),
    ('via tannourine', 'Via Tannourine water', cold_drinks_id, 2.00, true, NOW(), NOW()),
    ('water l', 'Large water bottle', cold_drinks_id, 1.50, true, NOW(), NOW()),
    ('water s', 'Small water bottle', cold_drinks_id, 1.00, true, NOW(), NOW()),
    ('xxl', 'XXL energy drink', cold_drinks_id, 4.00, true, NOW(), NOW())

    -- Hot drinks (Coffee category)
    ('american coffee', 'American style coffee', hot_drinks_id, 3.50, true, NOW(), NOW()),
    ('café latte', 'Café latte', hot_drinks_id, 4.50, true, NOW(), NOW()),
    ('café latte caramel', 'Caramel café latte', hot_drinks_id, 5.00, true, NOW(), NOW()),
    ('café latte vanille', 'Vanilla café latte', hot_drinks_id, 5.00, true, NOW(), NOW()),
    ('cappucino', 'Cappuccino', hot_drinks_id, 4.00, true, NOW(), NOW()),
    ('espresso', 'Espresso shot', hot_drinks_id, 3.00, true, NOW(), NOW()),
    ('hot chocolate', 'Hot chocolate', hot_drinks_id, 4.00, true, NOW(), NOW()),
    ('nescafe 2-1', 'Nescafe 2-in-1', hot_drinks_id, 2.50, true, NOW(), NOW()),
    ('nescafe 3-1', 'Nescafe 3-in-1', hot_drinks_id, 2.50, true, NOW(), NOW()),
    ('nescafe gold coffeemate', 'Nescafe Gold with Coffeemate', hot_drinks_id, 3.50, true, NOW(), NOW()),
    ('nescafe gold milk', 'Nescafe Gold with milk', hot_drinks_id, 3.50, true, NOW(), NOW()),
    ('tisane', 'Herbal tea', hot_drinks_id, 2.50, true, NOW(), NOW()),
    ('turkish coffee', 'Turkish coffee', hot_drinks_id, 3.00, true, NOW(), NOW())

    -- Alcohol category
    ('almaza beer', 'Almaza beer', alcohol_id, 4.50, true, NOW(), NOW()),
    ('gin basel', 'Gin Basel cocktail', alcohol_id, 8.50, true, NOW(), NOW()),
    ('gin tonic', 'Gin and tonic', alcohol_id, 8.00, true, NOW(), NOW()),
    ('london mule', 'London Mule cocktail', alcohol_id, 9.50, true, NOW(), NOW()),
    ('long island', 'Long Island Iced Tea', alcohol_id, 12.00, true, NOW(), NOW()),
    ('margarita', 'Margarita cocktail', alcohol_id, 9.00, true, NOW(), NOW()),
    ('mexican almaza beer', 'Mexican style Almaza beer', alcohol_id, 5.00, true, NOW(), NOW()),
    ('moscow mule', 'Moscow Mule cocktail', alcohol_id, 8.50, true, NOW(), NOW()),
    ('red wine', 'Red wine glass', alcohol_id, 6.00, true, NOW(), NOW()),
    ('rose wine', 'Rosé wine glass', alcohol_id, 6.00, true, NOW(), NOW()),
    ('vodka + 7up', 'Vodka with 7up', alcohol_id, 7.50, true, NOW(), NOW()),
    ('vodka + energy drink', 'Vodka with energy drink', alcohol_id, 8.50, true, NOW(), NOW()),
    ('vodka + orange', 'Vodka with orange juice', alcohol_id, 7.50, true, NOW(), NOW()),
    ('whiskey black label', 'Black Label whiskey', alcohol_id, 10.00, true, NOW(), NOW()),
    ('whiskey red label', 'Red Label whiskey', alcohol_id, 8.50, true, NOW(), NOW()),
    ('white wine', 'White wine glass', alcohol_id, 6.00, true, NOW(), NOW())

    -- Tobacco/Shisha category
    ('apple', 'Apple flavored shisha', tobacco_id, 8.00, true, NOW(), NOW()),
    ('blueberry', 'Blueberry flavored shisha', tobacco_id, 8.00, true, NOW(), NOW()),
    ('gape mint', 'Grape mint flavored shisha', tobacco_id, 8.50, true, NOW(), NOW()),
    ('grape', 'Grape flavored shisha', tobacco_id, 8.00, true, NOW(), NOW()),
    ('gum', 'Gum flavored shisha', tobacco_id, 8.00, true, NOW(), NOW()),
    ('gum mint', 'Gum mint flavored shisha', tobacco_id, 8.50, true, NOW(), NOW()),
    ('lemon mint', 'Lemon mint flavored shisha', tobacco_id, 8.50, true, NOW(), NOW()),
    ('love', 'Love flavored shisha', tobacco_id, 8.00, true, NOW(), NOW()),
    ('mint', 'Mint flavored shisha', tobacco_id, 8.00, true, NOW(), NOW()),
    ('orange', 'Orange flavored shisha', tobacco_id, 8.00, true, NOW(), NOW()),
    ('orange mint', 'Orange mint flavored shisha', tobacco_id, 8.50, true, NOW(), NOW()),
    ('rass maseh', 'Rass Maseh flavored shisha', tobacco_id, 8.00, true, NOW(), NOW()),
    ('watermelon', 'Watermelon flavored shisha', tobacco_id, 8.00, true, NOW(), NOW())

    
    -- Platters category
    ('bajaxy', 'Bajaxy platter', platters_id, 16.50, true, NOW(), NOW()),
    ('chicken comno', 'Chicken Comno platter', platters_id, 15.50, true, NOW(), NOW()),
    ('chicken halloumi', 'Chicken with halloumi platter', platters_id, 17.00, true, NOW(), NOW()),
    ('chicken mushroom', 'Chicken mushroom platter', platters_id, 16.00, true, NOW(), NOW()),
    ('chicken parmigiana', 'Chicken parmigiana platter', platters_id, 18.50, true, NOW(), NOW()),
    ('crispy platter', 'Crispy chicken platter', platters_id, 15.50, true, NOW(), NOW()),
    ('grilled salmon', 'Grilled salmon platter', platters_id, 22.00, true, NOW(), NOW()),
    ('oops platter', 'Oops special platter', platters_id, 18.00, true, NOW(), NOW()),
    ('steak combo', 'Steak combo platter', platters_id, 24.00, true, NOW(), NOW()),
    ('steak mushroom', 'Steak with mushroom platter', platters_id, 26.00, true, NOW(), NOW()),
    ('taouk platter', 'Taouk platter', platters_id, 14.50, true, NOW(), NOW())

    -- Burgers category
    ('bomba beef bruger', 'Bomba beef burger', burgers_id, 14.50, true, NOW(), NOW()),
    ('bomba chicken burger', 'Bomba chicken burger', burgers_id, 13.50, true, NOW(), NOW()),
    ('chicken burger', 'Chicken burger', burgers_id, 10.50, true, NOW(), NOW()),
    ('classic hamburger', 'Classic hamburger', burgers_id, 9.50, true, NOW(), NOW()),
    ('healthy burger', 'Healthy burger', burgers_id, 11.50, true, NOW(), NOW()),
    ('mozzarella burger', 'Mozzarella burger', burgers_id, 10.50, true, NOW(), NOW()),
    ('oops beef burger', 'Oops beef burger', burgers_id, 15.50, true, NOW(), NOW()),
    ('oops chicken burger', 'Oops chicken burger', burgers_id, 14.50, true, NOW(), NOW()),
    ('the ghost burger', 'The Ghost burger', burgers_id, 18.50, true, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
END $$;

COMMIT;
