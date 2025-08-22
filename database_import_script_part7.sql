-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 7: MORE MENU ITEMS
-- This script continues adding menu items for all categories

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

-- Continue inserting menu items
DO $$
DECLARE
    appetizers_cat_id INTEGER;
    platters_cat_id INTEGER;
    sandwiches_cat_id INTEGER;
    burgers_cat_id INTEGER;
    milkshakes_cat_id INTEGER;
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
    SELECT id INTO smoothies_cat_id FROM categories WHERE value = 'smoothies';
    SELECT id INTO ice_tea_cat_id FROM categories WHERE value = 'ice_tea';
    SELECT id INTO iced_coffee_cat_id FROM categories WHERE value = 'iced_coffee';
    SELECT id INTO fresh_cat_id FROM categories WHERE value = 'fresh';
    SELECT id INTO desserts_cat_id FROM categories WHERE value = 'desserts';
    SELECT id INTO pasta_cat_id FROM categories WHERE value = 'pasta';
    SELECT id INTO salads_cat_id FROM categories WHERE value = 'salads';

    -- Insert more menu items
    INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
        -- Milkshakes
        ('bounty shake', 'Bounty flavored milkshake', milkshakes_cat_id, 6.50, true, NOW(), NOW()),
        ('chocolate shake', 'Chocolate milkshake', milkshakes_cat_id, 6.00, true, NOW(), NOW()),
        ('chocolate strawberry shake', 'Chocolate strawberry milkshake', milkshakes_cat_id, 6.50, true, NOW(), NOW()),
        ('frappucino caramel', 'Caramel frappuccino', milkshakes_cat_id, 7.00, true, NOW(), NOW()),
        ('frappucino chocolate', 'Chocolate frappuccino', milkshakes_cat_id, 7.00, true, NOW(), NOW()),
        ('orea strawberry shake', 'Oreo strawberry milkshake', milkshakes_cat_id, 6.50, true, NOW(), NOW()),
        ('oreo shake', 'Oreo milkshake', milkshakes_cat_id, 6.00, true, NOW(), NOW()),
        ('strawberry shake', 'Strawberry milkshake', milkshakes_cat_id, 6.00, true, NOW(), NOW()),
        ('tofe caramel', 'Toffee caramel milkshake', milkshakes_cat_id, 6.50, true, NOW(), NOW()),
        ('vanille shake', 'Vanilla milkshake', milkshakes_cat_id, 6.00, true, NOW(), NOW()),

        -- Smoothies
        ('mango', 'Mango smoothie', smoothies_cat_id, 5.50, true, NOW(), NOW()),
        ('mixed berries', 'Mixed berries smoothie', smoothies_cat_id, 5.50, true, NOW(), NOW()),
        ('passion strawberry', 'Passion fruit strawberry smoothie', smoothies_cat_id, 6.00, true, NOW(), NOW()),
        ('peach', 'Peach smoothie', smoothies_cat_id, 5.50, true, NOW(), NOW()),
        ('peach mango', 'Peach mango smoothie', smoothies_cat_id, 6.00, true, NOW(), NOW()),
        ('peach passion', 'Peach passion fruit smoothie', smoothies_cat_id, 6.00, true, NOW(), NOW()),
        ('strawberry', 'Strawberry smoothie', smoothies_cat_id, 5.50, true, NOW(), NOW()),

        -- Ice Tea
        ('ice tea blueberry', 'Blueberry iced tea', ice_tea_cat_id, 4.00, true, NOW(), NOW()),
        ('ice tea mago', 'Mango iced tea', ice_tea_cat_id, 4.00, true, NOW(), NOW()),
        ('ice tea passion fruit', 'Passion fruit iced tea', ice_tea_cat_id, 4.00, true, NOW(), NOW()),
        ('ice tea peach', 'Peach iced tea', ice_tea_cat_id, 4.00, true, NOW(), NOW()),

        -- Iced Coffee
        ('iced coffee', 'Iced coffee', iced_coffee_cat_id, 4.50, true, NOW(), NOW()),
        ('iced coffee caramel', 'Caramel iced coffee', iced_coffee_cat_id, 5.00, true, NOW(), NOW()),
        ('iced coffee vanille', 'Vanilla iced coffee', iced_coffee_cat_id, 5.00, true, NOW(), NOW()),

        -- Fresh Drinks
        ('lemonade', 'Fresh lemonade', fresh_cat_id, 3.50, true, NOW(), NOW()),
        ('minted lemonade', 'Fresh minted lemonade', fresh_cat_id, 4.00, true, NOW(), NOW()),
        ('orange', 'Fresh orange juice', fresh_cat_id, 4.50, true, NOW(), NOW()),

        -- Desserts
        ('chocolat brownies', 'Chocolate brownies with ice cream', desserts_cat_id, 7.50, true, NOW(), NOW()),
        ('chocolate fondant', 'Chocolate fondant with ice cream', desserts_cat_id, 8.00, true, NOW(), NOW()),
        ('fudge cake', 'Fudge cake slice', desserts_cat_id, 7.00, true, NOW(), NOW()),
        ('icecream strawberry', 'Strawberry ice cream', desserts_cat_id, 4.50, true, NOW(), NOW()),
        ('icecream vanille', 'Vanilla ice cream', desserts_cat_id, 4.50, true, NOW(), NOW()),
        ('icream chocolate', 'Chocolate ice cream', desserts_cat_id, 4.50, true, NOW(), NOW()),
        ('lazy cake', 'Lazy cake slices', desserts_cat_id, 8.50, true, NOW(), NOW()),
        ('oreo cake', 'Oreo cake slice', desserts_cat_id, 7.50, true, NOW(), NOW()),
        ('strawberry cheese cake', 'Strawberry cheese cake', desserts_cat_id, 8.00, true, NOW(), NOW()),
        ('tiramisu bliss', 'Tiramisu bliss', desserts_cat_id, 8.50, true, NOW(), NOW()),
        ('triple chocolate cake', 'Triple chocolate cake', desserts_cat_id, 8.50, true, NOW(), NOW()),

        -- Appetizers
        ('cheese garlic bread', 'Cheese garlic bread', appetizers_cat_id, 6.50, true, NOW(), NOW()),
        ('chicken tacos', 'Chicken tacos', appetizers_cat_id, 8.50, true, NOW(), NOW()),
        ('chicken tenders', 'Chicken tenders with fries', appetizers_cat_id, 9.50, true, NOW(), NOW()),
        ('combo platter', 'Mixed combo platter', appetizers_cat_id, 15.00, true, NOW(), NOW()),
        ('combo seafood', 'Seafood combo platter', appetizers_cat_id, 18.00, true, NOW(), NOW()),
        ('curly fries', 'Curly fries', appetizers_cat_id, 5.50, true, NOW(), NOW()),
        ('dynamite shrimps L', 'Large dynamite shrimps', appetizers_cat_id, 12.00, true, NOW(), NOW()),
        ('dynamite shrimps S', 'Small dynamite shrimps', appetizers_cat_id, 8.50, true, NOW(), NOW()),
        ('french fries', 'French fries', appetizers_cat_id, 4.50, true, NOW(), NOW()),
        ('juicy balls', 'Juicy cheese balls', appetizers_cat_id, 7.50, true, NOW(), NOW()),
        ('juicy balls red', 'Juicy cheese balls with red sauce', appetizers_cat_id, 8.00, true, NOW(), NOW()),
        ('mozzarella sticks', 'Mozzarella sticks', appetizers_cat_id, 7.00, true, NOW(), NOW()),
        ('nachos', 'Nachos with toppings', appetizers_cat_id, 8.50, true, NOW(), NOW()),
        ('oops fries', 'Oops special fries', appetizers_cat_id, 9.50, true, NOW(), NOW()),
        ('oops fries chili', 'Oops chili fries', appetizers_cat_id, 10.50, true, NOW(), NOW()),
        ('wedges', 'Potato wedges', appetizers_cat_id, 5.50, true, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
END $$;

COMMIT;
