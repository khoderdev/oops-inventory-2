-- Check what categories were actually created
SELECT id, name, value, "categoryTypeIds" FROM categories ORDER BY id;

-- Check specific category lookups that part 7 uses
SELECT 'milkshakes' as lookup, id FROM categories WHERE value = 'milkshakes';
SELECT 'smoothies' as lookup, id FROM categories WHERE value = 'smoothies';
SELECT 'ice_tea' as lookup, id FROM categories WHERE value = 'ice_tea';
SELECT 'iced_coffee' as lookup, id FROM categories WHERE value = 'iced_coffee';
SELECT 'fresh' as lookup, id FROM categories WHERE value = 'fresh';
SELECT 'desserts' as lookup, id FROM categories WHERE value = 'desserts';
SELECT 'appetizers' as lookup, id FROM categories WHERE value = 'appetizers';
SELECT 'pasta' as lookup, id FROM categories WHERE value = 'pasta';
SELECT 'salads' as lookup, id FROM categories WHERE value = 'salads';
