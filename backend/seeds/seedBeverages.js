import { MenuItem, Category } from "../models/index.js";

const beverageItems = [
  // Beers & Energy Drinks
  {
    name: "Mexican Red Bull",
    description: "Mexican Red Bull energy drink",
    price: 5.5,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Almaza",
    description: "Lebanese beer",
    price: 4.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Almaza Light",
    description: "Lebanese light beer",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Mexican Beer",
    description: "Mexican beer",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Almaza Rose",
    description: "Lebanese rose beer",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Mexican Energy Drink",
    description: "Mexican energy drink",
    price: 4.5,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },

  // Wines
  {
    name: "Ksara Red Wine Glass",
    description: "Ksara red wine by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Ksara Red Wine Bottle",
    description: "Ksara red wine bottle",
    price: 30.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Ksara White Wine Glass",
    description: "Ksara white wine by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Ksara White Wine Bottle",
    description: "Ksara white wine bottle",
    price: 30.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Ksara Rose Wine Glass",
    description: "Ksara rose wine by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Ksara Rose Wine Bottle",
    description: "Ksara rose wine bottle",
    price: 30.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },

  // Tequila
  {
    name: "Jose Cuervo Silver Bottle",
    description: "Jose Cuervo Silver tequila bottle",
    price: 40.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Jose Cuervo Gold Bottle",
    description: "Jose Cuervo Gold tequila bottle",
    price: 60.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },

  // Gin
  {
    name: "Beefeater Glass",
    description: "Beefeater gin by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Beefeater Bottle",
    description: "Beefeater gin bottle",
    price: 70.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Tanqueray Glass",
    description: "Tanqueray gin by the glass",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Tanqueray Bottle",
    description: "Tanqueray gin bottle",
    price: 80.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Bombay Glass",
    description: "Bombay gin by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Bombay Bottle",
    description: "Bombay gin bottle",
    price: 50.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Gordons Glass",
    description: "Gordons gin by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Gordons Bottle",
    description: "Gordons gin bottle",
    price: 65.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },

  // Whiskey
  {
    name: "J&B Glass",
    description: "J&B whiskey by the glass",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "J&B Bottle",
    description: "J&B whiskey bottle",
    price: 80.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Jack Daniels Glass",
    description: "Jack Daniels whiskey by the glass",
    price: 9.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Jack Daniels Bottle",
    description: "Jack Daniels whiskey bottle",
    price: 100.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Glenfiddich Glass",
    description: "Glenfiddich whiskey by the glass",
    price: 10.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Glenfiddich Bottle",
    description: "Glenfiddich whiskey bottle",
    price: 120.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Black Label Glass",
    description: "Black Label whiskey by the glass",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Black Label Bottle",
    description: "Black Label whiskey bottle",
    price: 90.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Red Label Glass",
    description: "Red Label whiskey by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Red Label Bottle",
    description: "Red Label whiskey bottle",
    price: 65.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Jameson Glass",
    description: "Jameson whiskey by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Jameson Bottle",
    description: "Jameson whiskey bottle",
    price: 70.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Chivas 12y Glass",
    description: "Chivas 12 years whiskey by the glass",
    price: 9.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Chivas 12y Bottle",
    description: "Chivas 12 years whiskey bottle",
    price: 100.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Chivas 15y Glass",
    description: "Chivas 15 years whiskey by the glass",
    price: 11.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Chivas 15y Bottle",
    description: "Chivas 15 years whiskey bottle",
    price: 150.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Jim Beam Glass",
    description: "Jim Beam whiskey by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Jim Beam Bottle",
    description: "Jim Beam whiskey bottle",
    price: 75.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },

  // Vodka
  {
    name: "Grey Goose Bottle",
    description: "Grey Goose vodka bottle",
    price: 120.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Belvedere Bottle",
    description: "Belvedere vodka bottle",
    price: 140.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Stoli Gold Glass",
    description: "Stoli Gold vodka by the glass",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Stoli Gold Bottle",
    description: "Stoli Gold vodka bottle",
    price: 100.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Stoli Red Glass",
    description: "Stoli Red vodka by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Stoli Red Bottle",
    description: "Stoli Red vodka bottle",
    price: 70.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Smirnoff Glass",
    description: "Smirnoff vodka by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Smirnoff Bottle",
    description: "Smirnoff vodka bottle",
    price: 60.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Russian Standard Glass",
    description: "Russian Standard vodka by the glass",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Russian Standard Bottle",
    description: "Russian Standard vodka bottle",
    price: 85.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },

  // Cocktails
  {
    name: "Bull Frog",
    description: "Vodka, tequila, rum, gin, blue curacao, lemon juice and energy drinks",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Take Me Home",
    description: "Vodka, tequila, rum, gin, blue curacao, lime juice and 7up",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Margarita",
    description: "Tequila, triple sec and lime juice",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Long Island",
    description: "Vodka, gin, white rum, gold tequila, blue curacao and pepsi",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Gin Basil",
    description: "Gin, simple syrup, lime juice and fresh basil",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Pina Colada",
    description: "Rum, coconut syrup, pineapple juice, milk and malibu",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Moscow Mule",
    description: "Vodka, lime juice and ginger beer",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "London Mule",
    description: "Gin, lime juice and ginger beer",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Midori Sour",
    description: "Vodka, midori, lime juice, orange juice and 7up",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Sex on the Beach",
    description: "Vodka, archer, orange juice and cranberry juice",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Cosmopolitan",
    description: "Vodka, lime juice, cranberry juice and triple sec",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Passion Fruit Martini",
    description: "Vodka, lime juice, orange juice and passion syrup",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Espresso Martini",
    description: "Vodka, kahlua, simple syrup and shot espresso",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Mojito",
    description: "Rum, simple syrup, lime juice, 7up and fresh mint",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Tequila Sunrise",
    description: "White tequila, orange juice and grenadine",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Jamaica",
    description: "Vodka, pineapple juice, orange juice and grenadine",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "White Russian",
    description: "Vodka and bailey's",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Black Russian",
    description: "Vodka and kahlua",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Jager Bomb",
    description: "Jager and red bull",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true,
    printerId: 2
  },

  // Cold Coffee & Iced Drinks
  {
    name: "Iced Coffee Caramel",
    description: "Iced coffee with caramel flavor",
    price: 6.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Iced Coffee Vanilla",
    description: "Iced coffee with vanilla flavor",
    price: 6.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Iced Coffee",
    description: "Classic iced coffee",
    price: 5.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Toffee Caramel",
    description: "Toffee caramel drink",
    price: 7.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Ice Tea Peach",
    description: "Peach flavored iced tea",
    price: 5.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Ice Tea Mango",
    description: "Mango flavored iced tea",
    price: 4.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Ice Tea Blueberry",
    description: "Blueberry flavored iced tea",
    price: 5.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Ice Tea Passion Fruit",
    description: "Passion fruit flavored iced tea",
    price: 6.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },

  // Energy & Soft Drinks
  {
    name: "Red Bull",
    description: "Red Bull energy drink",
    price: 5.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Water Small",
    description: "Small water bottle",
    price: 1.5,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Water Large",
    description: "Large water bottle",
    price: 3.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Soft Drinks",
    description: "Assorted soft drinks",
    price: 3.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "7up Grenadine",
    description: "7up with grenadine",
    price: 3.5,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Sparkling Water",
    description: "Sparkling water",
    price: 4.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Bzurat",
    description: "Traditional Lebanese drink",
    price: 2.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Energy Drink",
    description: "Energy drink",
    price: 4.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },

  // Smoothies
  {
    name: "Mango Smoothie",
    description: "Fresh mango smoothie",
    price: 6.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Strawberry Smoothie",
    description: "Fresh strawberry smoothie",
    price: 6.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Mixed Berries Smoothie",
    description: "Mixed berries smoothie",
    price: 7.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Peach Smoothie",
    description: "Fresh peach smoothie",
    price: 6.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Peach Passion Smoothie",
    description: "Peach and passion fruit smoothie",
    price: 7.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Passion Strawberry Smoothie",
    description: "Passion fruit and strawberry smoothie",
    price: 7.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Peach Mango Smoothie",
    description: "Peach and mango smoothie",
    price: 6.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },

  // Fresh Juices
  {
    name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice",
    price: 5.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Lemonade",
    description: "Fresh lemonade",
    price: 5.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Minted Lemonade",
    description: "Fresh lemonade with mint",
    price: 7.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },

  // Shakes
  {
    name: "Bounty Shake",
    description: "Bounty chocolate shake",
    price: 8.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Lotus Shake",
    description: "Lotus biscuit shake",
    price: 8.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Chocolate Shake",
    description: "Classic chocolate shake",
    price: 7.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Oreo Shake",
    description: "Oreo cookies shake",
    price: 8.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Strawberry Shake",
    description: "Fresh strawberry shake",
    price: 7.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Vanilla Shake",
    description: "Classic vanilla shake",
    price: 7.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Brownie Shake",
    description: "Chocolate brownie shake",
    price: 9.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Chocolate Strawberry Shake",
    description: "Chocolate and strawberry shake",
    price: 7.0,
    category: "cold",
    isPOSItem: true,
    printerId: 2
  },

  // Hot Drinks
  {
    name: "Espresso",
    description: "Classic espresso",
    price: 2.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Nescafe Gold",
    description: "Nescafe Gold instant coffee",
    price: 4.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Cappuccino",
    description: "Classic cappuccino",
    price: 4.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "American Coffee",
    description: "American style coffee",
    price: 4.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Hot Chocolate",
    description: "Rich hot chocolate",
    price: 5.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Tisane",
    description: "Herbal tea",
    price: 3.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Cafe Latte",
    description: "Classic cafe latte",
    price: 5.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Turkish Coffee",
    description: "Traditional Turkish coffee",
    price: 3.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Cafe Latte Caramel",
    description: "Cafe latte with caramel flavor",
    price: 6.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  },
  {
    name: "Cafe Latte Vanilla",
    description: "Cafe latte with vanilla flavor",
    price: 6.0,
    category: "hot",
    isPOSItem: true,
    printerId: 2
  }
];

export const seedBeverages = async () => {
  console.log("🍹 Starting beverages seeding...");

  // Get all menu item categories to map category values to IDs
  const categories = await Category.findAll({ where: { type: 'menu_items' } });
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.value] = cat.id;
  });

  console.log("📋 Available beverage categories:", categoryMap);

  // Convert beverages data to use categoryIds
  const beveragesWithCategoryIds = beverageItems.map(beverage => {
    const categoryId = categoryMap[beverage.category];
    if (!categoryId) {
      console.warn(`⚠️  No category found for value '${beverage.category}' in beverage: ${beverage.name}`);
    }
    
    const { category, ...beverageData } = beverage;
    return {
      ...beverageData,
      categoryId: categoryId || null
    };
  });

  let createdCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const beverage of beveragesWithCategoryIds) {
    try {
      const [menuItem, created] = await MenuItem.findOrCreate({
        where: { name: beverage.name },
        defaults: beverage
      });

      if (created) {
        createdCount++;
        console.log(`✅ Created beverage: ${beverage.name} ($${beverage.price}) - Category ID: ${beverage.categoryId}`);
      } else {
        skippedCount++;
        console.log(`⏭️  Beverage already exists: ${beverage.name}`);
      }
    } catch (error) {
      errors.push({ name: beverage.name, error: error.message });
      console.error(`❌ Error creating beverage ${beverage.name}:`, error.message);
    }
  }

  console.log("\n🍹 Beverages seeding summary:");
  console.log(`✅ Created: ${createdCount} beverages`);
  console.log(`⏭️  Skipped: ${skippedCount} beverages`);

  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length} beverages`);
    errors.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  return {
    created: createdCount,
    skipped: skippedCount,
    errors: errors.length
  };
};
