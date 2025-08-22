-- COMPREHENSIVE DATABASE IMPORT SCRIPT - PART 7: MORE MENU ITEMS (FIXED)
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

-- Insert menu items with hardcoded category IDs based on actual database
INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
    -- Milkshakes (categoryId: 33)
    ('bounty shake', 'Bounty flavored milkshake', 33, 6.50, true, NOW(), NOW()),
    ('chocolate shake', 'Chocolate milkshake', 33, 6.00, true, NOW(), NOW()),
    ('chocolate strawberry shake', 'Chocolate strawberry milkshake', 33, 6.50, true, NOW(), NOW()),
    ('frappucino caramel', 'Caramel frappuccino', 33, 7.00, true, NOW(), NOW()),
    ('frappucino chocolate', 'Chocolate frappuccino', 33, 7.00, true, NOW(), NOW()),
    ('orea strawberry shake', 'Oreo strawberry milkshake', 33, 6.50, true, NOW(), NOW()),
    ('oreo shake', 'Oreo milkshake', 33, 6.00, true, NOW(), NOW()),
    ('strawberry shake', 'Strawberry milkshake', 33, 6.00, true, NOW(), NOW()),
    ('tofe caramel', 'Toffee caramel milkshake', 33, 6.50, true, NOW(), NOW()),
    ('vanille shake', 'Vanilla milkshake', 33, 6.00, true, NOW(), NOW()),

    -- Smoothies (categoryId: 38)
    ('mango', 'Mango smoothie', 38, 5.50, true, NOW(), NOW()),
    ('mixed berries', 'Mixed berries smoothie', 38, 5.50, true, NOW(), NOW()),
    ('passion strawberry', 'Passion fruit strawberry smoothie', 38, 6.00, true, NOW(), NOW()),
    ('peach', 'Peach smoothie', 38, 5.50, true, NOW(), NOW()),
    ('peach mango', 'Peach mango smoothie', 38, 6.00, true, NOW(), NOW()),
    ('peach passion', 'Peach passion fruit smoothie', 38, 6.00, true, NOW(), NOW()),
    ('strawberry', 'Strawberry smoothie', 38, 5.50, true, NOW(), NOW()),

    -- Ice Tea (categoryId: 39)
    ('ice tea blueberry', 'Blueberry iced tea', 39, 4.00, true, NOW(), NOW()),
    ('ice tea mago', 'Mango iced tea', 39, 4.00, true, NOW(), NOW()),
    ('ice tea passion fruit', 'Passion fruit iced tea', 39, 4.00, true, NOW(), NOW()),
    ('ice tea peach', 'Peach iced tea', 39, 4.00, true, NOW(), NOW()),

    -- Iced Coffee (categoryId: 40)
    ('iced coffee', 'Iced coffee', 40, 4.50, true, NOW(), NOW()),
    ('iced coffee caramel', 'Caramel iced coffee', 40, 5.00, true, NOW(), NOW()),
    ('iced coffee vanille', 'Vanilla iced coffee', 40, 5.00, true, NOW(), NOW()),

    -- Fresh Drinks (categoryId: 41)
    ('lemonade', 'Fresh lemonade', 41, 3.50, true, NOW(), NOW()),
    ('minted lemonade', 'Fresh minted lemonade', 41, 4.00, true, NOW(), NOW()),
    ('orange', 'Fresh orange juice', 41, 4.50, true, NOW(), NOW()),

    -- Desserts (categoryId: 42)
    ('chocolat brownies', 'Chocolate brownies with ice cream', 42, 7.50, true, NOW(), NOW()),
    ('chocolate fondant', 'Chocolate fondant with ice cream', 42, 8.00, true, NOW(), NOW()),
    ('fudge cake', 'Fudge cake slice', 42, 7.00, true, NOW(), NOW()),
    ('icecream strawberry', 'Strawberry ice cream', 42, 4.50, true, NOW(), NOW()),
    ('icecream vanille', 'Vanilla ice cream', 42, 4.50, true, NOW(), NOW()),
    ('icream chocolate', 'Chocolate ice cream', 42, 4.50, true, NOW(), NOW()),
    ('lazy cake', 'Lazy cake slices', 42, 8.50, true, NOW(), NOW()),
    ('oreo cake', 'Oreo cake slice', 42, 7.50, true, NOW(), NOW()),
    ('strawberry cheese cake', 'Strawberry cheese cake', 42, 8.00, true, NOW(), NOW()),
    ('tiramisu bliss', 'Tiramisu bliss', 42, 8.50, true, NOW(), NOW()),
    ('triple chocolate cake', 'Triple chocolate cake', 42, 8.50, true, NOW(), NOW()),

    -- Appetizers (categoryId: 29)
    ('cheese garlic bread', 'Cheese garlic bread', 29, 6.50, true, NOW(), NOW()),
    ('chicken tacos', 'Chicken tacos', 29, 8.50, true, NOW(), NOW()),
    ('chicken tenders', 'Chicken tenders with fries', 29, 9.50, true, NOW(), NOW()),
    ('combo platter', 'Mixed combo platter', 29, 15.00, true, NOW(), NOW()),
    ('combo seafood', 'Seafood combo platter', 29, 18.00, true, NOW(), NOW()),
    ('curly fries', 'Curly fries', 29, 5.50, true, NOW(), NOW()),
    ('dynamite shrimps L', 'Large dynamite shrimps', 29, 12.00, true, NOW(), NOW()),
    ('dynamite shrimps S', 'Small dynamite shrimps', 29, 8.50, true, NOW(), NOW()),
    ('french fries', 'French fries', 29, 4.50, true, NOW(), NOW()),
    ('juicy balls', 'Juicy cheese balls', 29, 7.50, true, NOW(), NOW()),
    ('juicy balls red', 'Juicy cheese balls with red sauce', 29, 8.00, true, NOW(), NOW()),
    ('mozzarella sticks', 'Mozzarella sticks', 29, 7.00, true, NOW(), NOW()),
    ('nachos', 'Nachos with toppings', 29, 8.50, true, NOW(), NOW()),
    ('oops fries', 'Oops special fries', 29, 9.50, true, NOW(), NOW()),
    ('oops fries chili', 'Oops chili fries', 29, 10.50, true, NOW(), NOW()),
    ('wedges', 'Potato wedges', 29, 5.50, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;
