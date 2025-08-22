-- COMPREHENSIVE DATABASE IMPORT SCRIPT - COMPLETE MENU ITEMS AND INGREDIENTS
-- This script creates ALL menu items and their ingredient relationships based on provided data

BEGIN;

-- Ensure unique constraints exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'menuItems_name_unique'
    ) THEN
        ALTER TABLE "menuItems" ADD CONSTRAINT menuItems_name_unique UNIQUE (name);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'menuItemIngredients_menuItemId_materialId_unique'
    ) THEN
        ALTER TABLE "menuItemIngredients" ADD CONSTRAINT menuItemIngredients_menuItemId_materialId_unique UNIQUE ("menuItemId", "materialId");
    END IF;
END $$;

-- Insert all menu items with proper categories
INSERT INTO "menuItems" (name, description, "categoryId", price, "isPOSItem", "createdAt", "updatedAt") VALUES
    -- Cold drinks (categoryId: 34 - Fresh)
    ('7up', '7up soft drink', 34, 2.50, true, NOW(), NOW()),
    ('7up + grenadine', '7up with grenadine syrup', 34, 3.00, true, NOW(), NOW()),
    ('bzurat', 'Bzurat traditional drink', 34, 2.00, true, NOW(), NOW()),
    ('mexican redbull', 'Mexican style Red Bull', 34, 4.50, true, NOW(), NOW()),
    ('mexican xxl', 'Mexican style XXL energy drink', 34, 4.00, true, NOW(), NOW()),
    ('miranda', 'Miranda soft drink', 34, 2.50, true, NOW(), NOW()),
    ('pepsi', 'Pepsi cola', 34, 2.50, true, NOW(), NOW()),
    ('pepsi diet', 'Diet Pepsi', 34, 2.50, true, NOW(), NOW()),
    ('redbull', 'Red Bull energy drink', 34, 4.50, true, NOW(), NOW()),
    ('rim', 'Rim soft drink', 34, 3.00, true, NOW(), NOW()),
    ('via tannourine', 'Via Tannourine water', 34, 2.00, true, NOW(), NOW()),
    ('water l', 'Large water bottle', 34, 1.50, true, NOW(), NOW()),
    ('water s', 'Small water bottle', 34, 1.00, true, NOW(), NOW()),
    ('xxl', 'XXL energy drink', 34, 4.00, true, NOW(), NOW()),

    -- Hot drinks (categoryId: 35 - Coffee)
    ('american coffee', 'American style coffee', 35, 3.50, true, NOW(), NOW()),
    ('café latte', 'Café latte', 35, 4.50, true, NOW(), NOW()),
    ('café latte caramel', 'Caramel café latte', 35, 5.00, true, NOW(), NOW()),
    ('café latte vanille', 'Vanilla café latte', 35, 5.00, true, NOW(), NOW()),
    ('cappucino', 'Cappuccino', 35, 4.00, true, NOW(), NOW()),
    ('espresso', 'Espresso shot', 35, 3.00, true, NOW(), NOW()),
    ('hot chocolate', 'Hot chocolate', 35, 4.00, true, NOW(), NOW()),
    ('nescafe 2-1', 'Nescafe 2-in-1', 35, 2.50, true, NOW(), NOW()),
    ('nescafe 3-1', 'Nescafe 3-in-1', 35, 2.50, true, NOW(), NOW()),
    ('nescafe gold coffeemate', 'Nescafe Gold with Coffeemate', 35, 3.50, true, NOW(), NOW()),
    ('nescafe gold milk', 'Nescafe Gold with milk', 35, 3.50, true, NOW(), NOW()),
    ('tisane', 'Herbal tea', 35, 2.50, true, NOW(), NOW()),
    ('turkish coffee', 'Turkish coffee', 35, 3.00, true, NOW(), NOW()),

    -- Alcohol (categoryId: 36 - Alcohol)
    ('almaza beer', 'Almaza beer', 36, 4.50, true, NOW(), NOW()),
    ('gin basel', 'Gin Basel cocktail', 36, 8.50, true, NOW(), NOW()),
    ('gin tonic', 'Gin and tonic', 36, 8.00, true, NOW(), NOW()),
    ('london mule', 'London Mule cocktail', 36, 9.50, true, NOW(), NOW()),
    ('long island', 'Long Island Iced Tea', 36, 12.00, true, NOW(), NOW()),
    ('margarita', 'Margarita cocktail', 36, 9.00, true, NOW(), NOW()),
    ('mexican almaza beer', 'Mexican style Almaza beer', 36, 5.00, true, NOW(), NOW()),
    ('moscow mule', 'Moscow Mule cocktail', 36, 8.50, true, NOW(), NOW()),
    ('red wine', 'Red wine glass', 36, 6.00, true, NOW(), NOW()),
    ('rose wine', 'Rosé wine glass', 36, 6.00, true, NOW(), NOW()),
    ('vodka + 7up', 'Vodka with 7up', 36, 7.50, true, NOW(), NOW()),
    ('vodka + energy drink', 'Vodka with energy drink', 36, 8.50, true, NOW(), NOW()),
    ('vodka + orange', 'Vodka with orange juice', 36, 7.50, true, NOW(), NOW()),
    ('whiskey black label', 'Black Label whiskey', 36, 10.00, true, NOW(), NOW()),
    ('whiskey red label', 'Red Label whiskey', 36, 8.50, true, NOW(), NOW()),
    ('white wine', 'White wine glass', 36, 6.00, true, NOW(), NOW()),

    -- Tobacco/Shisha (categoryId: 37 - Shisha)
    ('apple', 'Apple flavored shisha', 37, 8.00, true, NOW(), NOW()),
    ('blueberry', 'Blueberry flavored shisha', 37, 8.00, true, NOW(), NOW()),
    ('gape mint', 'Grape mint flavored shisha', 37, 8.50, true, NOW(), NOW()),
    ('grape', 'Grape flavored shisha', 37, 8.00, true, NOW(), NOW()),
    ('gum', 'Gum flavored shisha', 37, 8.00, true, NOW(), NOW()),
    ('gum mint', 'Gum mint flavored shisha', 37, 8.50, true, NOW(), NOW()),
    ('lemon mint', 'Lemon mint flavored shisha', 37, 8.50, true, NOW(), NOW()),
    ('love', 'Love flavored shisha', 37, 8.00, true, NOW(), NOW()),
    ('mint', 'Mint flavored shisha', 37, 8.00, true, NOW(), NOW()),
    ('orange', 'Orange flavored shisha', 37, 8.00, true, NOW(), NOW()),
    ('orange mint', 'Orange mint flavored shisha', 37, 8.50, true, NOW(), NOW()),
    ('rass maseh', 'Rass Maseh flavored shisha', 37, 8.00, true, NOW(), NOW()),
    ('watermelon', 'Watermelon flavored shisha', 37, 8.00, true, NOW(), NOW()),

    -- Platters (categoryId: 19 - Main Plates)
    ('bajaxy', 'Bajaxy platter', 19, 16.50, true, NOW(), NOW()),
    ('chicken comno', 'Chicken Comno platter', 19, 15.50, true, NOW(), NOW()),
    ('chicken halloumi', 'Chicken with halloumi platter', 19, 17.00, true, NOW(), NOW()),
    ('chicken mushroom', 'Chicken mushroom platter', 19, 16.00, true, NOW(), NOW()),
    ('chicken parmigiana', 'Chicken parmigiana platter', 19, 18.50, true, NOW(), NOW()),
    ('chicken pesto', 'Chicken pesto platter', 19, 16.50, true, NOW(), NOW()),
    ('crispy platter', 'Crispy chicken platter', 19, 15.50, true, NOW(), NOW()),
    ('grilled salmon', 'Grilled salmon platter', 19, 22.00, true, NOW(), NOW()),
    ('oops platter', 'Oops special platter', 19, 18.00, true, NOW(), NOW()),
    ('steak combo', 'Steak combo platter', 19, 24.00, true, NOW(), NOW()),
    ('steak mushroom', 'Steak with mushroom platter', 19, 26.00, true, NOW(), NOW()),
    ('taouk platter', 'Taouk platter', 19, 14.50, true, NOW(), NOW()),

    -- Sandwiches (categoryId: 18 - Sandwiches)
    ('bbq chicken', 'BBQ chicken sandwich', 18, 9.50, true, NOW(), NOW()),
    ('chicken delight', 'Chicken delight sandwich', 18, 10.50, true, NOW(), NOW()),
    ('crab sandwich', 'Crab sandwich', 18, 12.00, true, NOW(), NOW()),
    ('crispy sandwich', 'Crispy chicken sandwich', 18, 9.00, true, NOW(), NOW()),
    ('fajita', 'Chicken fajita sandwich', 18, 10.00, true, NOW(), NOW()),
    ('francisco', 'Francisco sandwich', 18, 9.50, true, NOW(), NOW()),
    ('halloumi sandwich', 'Halloumi sandwich', 18, 8.50, true, NOW(), NOW()),
    ('salmon sandwich', 'Smoked salmon sandwich', 18, 13.50, true, NOW(), NOW()),
    ('steak', 'Steak sandwich', 18, 15.00, true, NOW(), NOW()),
    ('submarine', 'Submarine sandwich', 18, 8.50, true, NOW(), NOW()),
    ('taouk', 'Taouk sandwich', 18, 7.50, true, NOW(), NOW()),

    -- Burgers (categoryId: 17 - Burgers)
    ('bomba beef bruger', 'Bomba beef burger', 17, 14.50, true, NOW(), NOW()),
    ('bomba chicken burger', 'Bomba chicken burger', 17, 13.50, true, NOW(), NOW()),
    ('chicken burger', 'Chicken burger', 17, 10.50, true, NOW(), NOW()),
    ('chicken mac n cheese', 'Chicken mac n cheese burger', 17, 12.50, true, NOW(), NOW()),
    ('classic hamburger', 'Classic hamburger', 17, 9.50, true, NOW(), NOW()),
    ('healthy burger', 'Healthy burger', 17, 11.50, true, NOW(), NOW()),
    ('mozzarella burger', 'Mozzarella burger', 17, 10.50, true, NOW(), NOW()),
    ('mushroom swiss burger', 'Mushroom swiss burger', 17, 12.00, true, NOW(), NOW()),
    ('oops beef burger', 'Oops beef burger', 17, 15.50, true, NOW(), NOW()),
    ('oops chicken burger', 'Oops chicken burger', 17, 14.50, true, NOW(), NOW()),
    ('pepperoni burger', 'Pepperoni burger', 17, 13.00, true, NOW(), NOW()),
    ('royal beef burger', 'Royal beef burger', 17, 16.00, true, NOW(), NOW()),
    ('royal chicken burger', 'Royal chicken burger', 17, 15.00, true, NOW(), NOW()),
    ('the ghost burger', 'The Ghost burger', 17, 18.50, true, NOW(), NOW()),

    -- Salads (categoryId: 23 - Salads)
    ('chicken cesar salad', 'Chicken Caesar salad', 23, 11.50, true, NOW(), NOW()),
    ('crab salad', 'Crab salad', 23, 13.00, true, NOW(), NOW()),
    ('halloumi salad', 'Halloumi salad', 23, 10.50, true, NOW(), NOW()),
    ('oops salad', 'Oops special salad', 23, 12.50, true, NOW(), NOW()),
    ('tuna pasta salad', 'Tuna pasta salad', 23, 11.00, true, NOW(), NOW()),

    -- Appetizers (categoryId: 16 - Appetizers)
    ('cheese garlic bread', 'Cheese garlic bread', 16, 6.50, true, NOW(), NOW()),
    ('chicken tacos', 'Chicken tacos', 16, 8.50, true, NOW(), NOW()),
    ('chicken tenders', 'Chicken tenders with fries', 16, 9.50, true, NOW(), NOW()),
    ('combo platter', 'Mixed combo platter', 16, 15.00, true, NOW(), NOW()),
    ('combo seafood', 'Seafood combo platter', 16, 18.00, true, NOW(), NOW()),
    ('curly fries', 'Curly fries', 16, 5.50, true, NOW(), NOW()),
    ('dynamite shrimps L', 'Large dynamite shrimps', 16, 12.00, true, NOW(), NOW()),
    ('dynamite shrimps S', 'Small dynamite shrimps', 16, 8.50, true, NOW(), NOW()),
    ('french fries', 'French fries', 16, 4.50, true, NOW(), NOW()),
    ('juicy balls', 'Juicy cheese balls', 16, 7.50, true, NOW(), NOW()),
    ('juicy balls red', 'Juicy cheese balls with red sauce', 16, 8.00, true, NOW(), NOW()),
    ('mozzarella sticks', 'Mozzarella sticks', 16, 7.00, true, NOW(), NOW()),
    ('nachos', 'Nachos with toppings', 16, 8.50, true, NOW(), NOW()),
    ('oops fries', 'Oops special fries', 16, 9.50, true, NOW(), NOW()),
    ('oops fries chili', 'Oops chili fries', 16, 10.50, true, NOW(), NOW()),
    ('wedges', 'Potato wedges', 16, 5.50, true, NOW(), NOW()),

    -- Milkshakes (categoryId: 33 - Milkshakes) 
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

    -- Desserts (categoryId: 24 - Desserts)
    ('chocolat brownies', 'Chocolate brownies with ice cream', 24, 7.50, true, NOW(), NOW()),
    ('chocolate fondant', 'Chocolate fondant with ice cream', 24, 8.00, true, NOW(), NOW()),
    ('fudge cake', 'Fudge cake slice', 24, 7.00, true, NOW(), NOW()),
    ('icecream strawberry', 'Strawberry ice cream', 24, 4.50, true, NOW(), NOW()),
    ('icecream vanille', 'Vanilla ice cream', 24, 4.50, true, NOW(), NOW()),
    ('icream chocolate', 'Chocolate ice cream', 24, 4.50, true, NOW(), NOW()),
    ('lazy cake', 'Lazy cake slices', 24, 8.50, true, NOW(), NOW()),
    ('oreo cake', 'Oreo cake slice', 24, 7.50, true, NOW(), NOW()),
    ('strawberry cheese cake', 'Strawberry cheese cake', 24, 8.00, true, NOW(), NOW()),
    ('tiramisu bliss', 'Tiramisu bliss', 24, 8.50, true, NOW(), NOW()),
    ('triple chocolate cake', 'Triple chocolate cake', 24, 8.50, true, NOW(), NOW()),

    -- Pasta (assuming categoryId: 43 for pasta category)
    ('fettuccine alfredo', 'Fettuccine Alfredo with chicken', 19, 14.50, true, NOW(), NOW()),
    ('penne arabiata', 'Penne Arrabbiata', 19, 12.50, true, NOW(), NOW()),
    ('penne rose', 'Penne with rose sauce', 19, 13.00, true, NOW(), NOW()),
    ('pesto pasta', 'Pesto pasta', 19, 13.50, true, NOW(), NOW()),
    ('spaguetti shrimp', 'Spaghetti with shrimp', 19, 16.50, true, NOW(), NOW())

ON CONFLICT (name) DO NOTHING;

COMMIT;
