import { MenuItem } from "../models/index.js";

const beverageItems = [
  // Beers & Energy Drinks
  {
    name: "Mexican Red Bull",
    description: "Mexican Red Bull energy drink",
    price: 5.5,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Almaza",
    description: "Lebanese beer",
    price: 4.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Almaza Light",
    description: "Lebanese light beer",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Mexican Beer",
    description: "Mexican beer",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Almaza Rose",
    description: "Lebanese rose beer",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Mexican Energy Drink",
    description: "Mexican energy drink",
    price: 4.5,
    category: "alcohol",
    isPOSItem: true
  },

  // Wines
  {
    name: "Ksara Red Wine Glass",
    description: "Ksara red wine by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Ksara Red Wine Bottle",
    description: "Ksara red wine bottle",
    price: 30.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Ksara White Wine Glass",
    description: "Ksara white wine by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Ksara White Wine Bottle",
    description: "Ksara white wine bottle",
    price: 30.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Ksara Rose Wine Glass",
    description: "Ksara rose wine by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Ksara Rose Wine Bottle",
    description: "Ksara rose wine bottle",
    price: 30.0,
    category: "alcohol",
    isPOSItem: true
  },

  // Tequila
  {
    name: "Jose Cuervo Silver Bottle",
    description: "Jose Cuervo Silver tequila bottle",
    price: 40.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Jose Cuervo Gold Bottle",
    description: "Jose Cuervo Gold tequila bottle",
    price: 60.0,
    category: "alcohol",
    isPOSItem: true
  },

  // Gin
  {
    name: "Beefeater Glass",
    description: "Beefeater gin by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Beefeater Bottle",
    description: "Beefeater gin bottle",
    price: 70.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Tanqueray Glass",
    description: "Tanqueray gin by the glass",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Tanqueray Bottle",
    description: "Tanqueray gin bottle",
    price: 80.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Bombay Glass",
    description: "Bombay gin by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Bombay Bottle",
    description: "Bombay gin bottle",
    price: 50.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Gordons Glass",
    description: "Gordons gin by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Gordons Bottle",
    description: "Gordons gin bottle",
    price: 65.0,
    category: "alcohol",
    isPOSItem: true
  },

  // Whiskey
  {
    name: "J&B Glass",
    description: "J&B whiskey by the glass",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "J&B Bottle",
    description: "J&B whiskey bottle",
    price: 80.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Jack Daniels Glass",
    description: "Jack Daniels whiskey by the glass",
    price: 9.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Jack Daniels Bottle",
    description: "Jack Daniels whiskey bottle",
    price: 100.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Glenfiddich Glass",
    description: "Glenfiddich whiskey by the glass",
    price: 10.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Glenfiddich Bottle",
    description: "Glenfiddich whiskey bottle",
    price: 120.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Black Label Glass",
    description: "Black Label whiskey by the glass",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Black Label Bottle",
    description: "Black Label whiskey bottle",
    price: 90.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Red Label Glass",
    description: "Red Label whiskey by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Red Label Bottle",
    description: "Red Label whiskey bottle",
    price: 65.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Jameson Glass",
    description: "Jameson whiskey by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Jameson Bottle",
    description: "Jameson whiskey bottle",
    price: 70.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Chivas 12y Glass",
    description: "Chivas 12 years whiskey by the glass",
    price: 9.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Chivas 12y Bottle",
    description: "Chivas 12 years whiskey bottle",
    price: 100.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Chivas 15y Glass",
    description: "Chivas 15 years whiskey by the glass",
    price: 11.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Chivas 15y Bottle",
    description: "Chivas 15 years whiskey bottle",
    price: 150.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Jim Beam Glass",
    description: "Jim Beam whiskey by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Jim Beam Bottle",
    description: "Jim Beam whiskey bottle",
    price: 75.0,
    category: "alcohol",
    isPOSItem: true
  },

  // Vodka
  {
    name: "Grey Goose Bottle",
    description: "Grey Goose vodka bottle",
    price: 120.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Belvedere Bottle",
    description: "Belvedere vodka bottle",
    price: 140.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Stoli Gold Glass",
    description: "Stoli Gold vodka by the glass",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Stoli Gold Bottle",
    description: "Stoli Gold vodka bottle",
    price: 100.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Stoli Red Glass",
    description: "Stoli Red vodka by the glass",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Stoli Red Bottle",
    description: "Stoli Red vodka bottle",
    price: 70.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Smirnoff Glass",
    description: "Smirnoff vodka by the glass",
    price: 5.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Smirnoff Bottle",
    description: "Smirnoff vodka bottle",
    price: 60.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Russian Standard Glass",
    description: "Russian Standard vodka by the glass",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Russian Standard Bottle",
    description: "Russian Standard vodka bottle",
    price: 85.0,
    category: "alcohol",
    isPOSItem: true
  },

  // Cocktails
  {
    name: "Bull Frog",
    description: "Vodka, tequila, rum, gin, blue curacao, lemon juice and energy drinks",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Take Me Home",
    description: "Vodka, tequila, rum, gin, blue curacao, lime juice and 7up",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Margarita",
    description: "Tequila, triple sec and lime juice",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Long Island",
    description: "Vodka, gin, white rum, gold tequila, blue curacao and pepsi",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Gin Basil",
    description: "Gin, simple syrup, lime juice and fresh basil",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Pina Colada",
    description: "Rum, coconut syrup, pineapple juice, milk and malibu",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Moscow Mule",
    description: "Vodka, lime juice and ginger beer",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "London Mule",
    description: "Gin, lime juice and ginger beer",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Midori Sour",
    description: "Vodka, midori, lime juice, orange juice and 7up",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Sex on the Beach",
    description: "Vodka, archer, orange juice and cranberry juice",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Cosmopolitan",
    description: "Vodka, lime juice, cranberry juice and triple sec",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Passion Fruit Martini",
    description: "Vodka, lime juice, orange juice and passion syrup",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Espresso Martini",
    description: "Vodka, kahlua, simple syrup and shot espresso",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Mojito",
    description: "Rum, simple syrup, lime juice, 7up and fresh mint",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Tequila Sunrise",
    description: "White tequila, orange juice and grenadine",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Jamaica",
    description: "Vodka, pineapple juice, orange juice and grenadine",
    price: 6.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "White Russian",
    description: "Vodka and bailey's",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Black Russian",
    description: "Vodka and kahlua",
    price: 7.0,
    category: "alcohol",
    isPOSItem: true
  },
  {
    name: "Jager Bomb",
    description: "Jager and red bull",
    price: 8.0,
    category: "alcohol",
    isPOSItem: true
  },

  // Cold Coffee & Iced Drinks
  {
    name: "Iced Coffee Caramel",
    description: "Iced coffee with caramel flavor",
    price: 6.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Iced Coffee Vanilla",
    description: "Iced coffee with vanilla flavor",
    price: 6.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Iced Coffee",
    description: "Classic iced coffee",
    price: 5.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Toffee Caramel",
    description: "Toffee caramel drink",
    price: 7.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Ice Tea Peach",
    description: "Peach flavored iced tea",
    price: 5.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Ice Tea Mango",
    description: "Mango flavored iced tea",
    price: 4.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Ice Tea Blueberry",
    description: "Blueberry flavored iced tea",
    price: 5.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Ice Tea Passion Fruit",
    description: "Passion fruit flavored iced tea",
    price: 6.0,
    category: "cold",
    isPOSItem: true
  },

  // Energy & Soft Drinks
  {
    name: "Red Bull",
    description: "Red Bull energy drink",
    price: 5.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Water Small",
    description: "Small water bottle",
    price: 1.5,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Water Large",
    description: "Large water bottle",
    price: 3.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Soft Drinks",
    description: "Assorted soft drinks",
    price: 3.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "7up Grenadine",
    description: "7up with grenadine",
    price: 3.5,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Sparkling Water",
    description: "Sparkling water",
    price: 4.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Bzurat",
    description: "Traditional Lebanese drink",
    price: 2.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Energy Drink",
    description: "Energy drink",
    price: 4.0,
    category: "cold",
    isPOSItem: true
  },

  // Smoothies
  {
    name: "Mango Smoothie",
    description: "Fresh mango smoothie",
    price: 6.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Strawberry Smoothie",
    description: "Fresh strawberry smoothie",
    price: 6.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Mixed Berries Smoothie",
    description: "Mixed berries smoothie",
    price: 7.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Peach Smoothie",
    description: "Fresh peach smoothie",
    price: 6.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Peach Passion Smoothie",
    description: "Peach and passion fruit smoothie",
    price: 7.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Passion Strawberry Smoothie",
    description: "Passion fruit and strawberry smoothie",
    price: 7.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Peach Mango Smoothie",
    description: "Peach and mango smoothie",
    price: 6.0,
    category: "cold",
    isPOSItem: true
  },

  // Fresh Juices
  {
    name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice",
    price: 5.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Lemonade",
    description: "Fresh lemonade",
    price: 5.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Minted Lemonade",
    description: "Fresh lemonade with mint",
    price: 7.0,
    category: "cold",
    isPOSItem: true
  },

  // Shakes
  {
    name: "Bounty Shake",
    description: "Bounty chocolate shake",
    price: 8.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Lotus Shake",
    description: "Lotus biscuit shake",
    price: 8.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Chocolate Shake",
    description: "Classic chocolate shake",
    price: 7.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Oreo Shake",
    description: "Oreo cookies shake",
    price: 8.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Strawberry Shake",
    description: "Fresh strawberry shake",
    price: 7.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Vanilla Shake",
    description: "Classic vanilla shake",
    price: 7.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Brownie Shake",
    description: "Chocolate brownie shake",
    price: 9.0,
    category: "cold",
    isPOSItem: true
  },
  {
    name: "Chocolate Strawberry Shake",
    description: "Chocolate and strawberry shake",
    price: 7.0,
    category: "cold",
    isPOSItem: true
  },

  // Hot Drinks
  {
    name: "Espresso",
    description: "Classic espresso",
    price: 2.0,
    category: "hot",
    isPOSItem: true
  },
  {
    name: "Nescafe Gold",
    description: "Nescafe Gold instant coffee",
    price: 4.0,
    category: "hot",
    isPOSItem: true
  },
  {
    name: "Cappuccino",
    description: "Classic cappuccino",
    price: 4.0,
    category: "hot",
    isPOSItem: true
  },
  {
    name: "American Coffee",
    description: "American style coffee",
    price: 4.0,
    category: "hot",
    isPOSItem: true
  },
  {
    name: "Hot Chocolate",
    description: "Rich hot chocolate",
    price: 5.0,
    category: "hot",
    isPOSItem: true
  },
  {
    name: "Tisane",
    description: "Herbal tea",
    price: 3.0,
    category: "hot",
    isPOSItem: true
  },
  {
    name: "Cafe Latte",
    description: "Classic cafe latte",
    price: 5.0,
    category: "hot",
    isPOSItem: true
  },
  {
    name: "Turkish Coffee",
    description: "Traditional Turkish coffee",
    price: 3.0,
    category: "hot",
    isPOSItem: true
  },
  {
    name: "Cafe Latte Caramel",
    description: "Cafe latte with caramel flavor",
    price: 6.0,
    category: "hot",
    isPOSItem: true
  },
  {
    name: "Cafe Latte Vanilla",
    description: "Cafe latte with vanilla flavor",
    price: 6.0,
    category: "hot",
    isPOSItem: true
  }
];

export const seedBeverages = async () => {
  console.log("🍹 Starting beverages seeding...");

  let createdCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const beverage of beverageItems) {
    try {
      const [menuItem, created] = await MenuItem.findOrCreate({
        where: { name: beverage.name },
        defaults: beverage
      });

      if (created) {
        createdCount++;
        console.log(`✅ Created beverage: ${beverage.name} ($${beverage.price})`);
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
