import { MenuItem, Category, CategoryType, MenuItemIngredient, Material } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

const beverageItems = [
  // Beers & Energy Drinks
  {
    name: "Mexican Red Bull",
    description: "Mexican Red Bull energy drink",
    price: 5.5,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null, // Will be populated during seeding
    ingredients: [
      { materialName: "Red Bull", quantity: 250, unit: "ml", cost: 2.50 }
    ]
  },
  {
    name: "Almaza",
    description: "Lebanese beer",
    price: 4.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Almaza Beer", quantity: 330, unit: "ml", cost: 1.80 }
    ]
  },
  {
    name: "Almaza Light",
    description: "Lebanese light beer",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Almaza Light Beer", quantity: 330, unit: "ml", cost: 2.00 }
    ]
  },
  {
    name: "Mexican Beer",
    description: "Mexican beer",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Corona Beer", quantity: 330, unit: "ml", cost: 2.20 }
    ]
  },
  {
    name: "Almaza Rose",
    description: "Lebanese rose beer",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Almaza Rose Beer", quantity: 330, unit: "ml", cost: 2.50 }
    ]
  },
  {
    name: "Mexican Energy Drink",
    description: "Mexican energy drink",
    price: 4.5,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Energy Drink", quantity: 250, unit: "ml", cost: 2.00 }
    ]
  },

  // Wines
  {
    name: "Ksara Red Wine Glass",
    description: "Ksara red wine by the glass",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Ksara Red Wine", quantity: 150, unit: "ml", cost: 2.50 }
    ]
  },
  {
    name: "Ksara Red Wine Bottle",
    description: "Ksara red wine bottle",
    price: 30.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Ksara Red Wine", quantity: 750, unit: "ml", cost: 15.00 }
    ]
  },
  {
    name: "Ksara White Wine Glass",
    description: "Ksara white wine by the glass",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Ksara White Wine", quantity: 150, unit: "ml", cost: 2.50 }
    ]
  },
  {
    name: "Ksara White Wine Bottle",
    description: "Ksara white wine bottle",
    price: 30.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Ksara White Wine", quantity: 750, unit: "ml", cost: 15.00 }
    ]
  },
  {
    name: "Ksara Rose Wine Glass",
    description: "Ksara rose wine by the glass",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Ksara Rose Wine", quantity: 150, unit: "ml", cost: 2.50 }
    ]
  },
  {
    name: "Ksara Rose Wine Bottle",
    description: "Ksara rose wine bottle",
    price: 30.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Ksara Rose Wine", quantity: 750, unit: "ml", cost: 15.00 }
    ]
  },

  // Tequila
  {
    name: "Jose Cuervo Silver Bottle",
    description: "Jose Cuervo Silver tequila bottle",
    price: 40.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Jose Cuervo Silver Tequila", quantity: 750, unit: "ml", cost: 20.00 }
    ]
  },
  {
    name: "Jose Cuervo Gold Bottle",
    description: "Jose Cuervo Gold tequila bottle",
    price: 60.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Jose Cuervo Gold Tequila", quantity: 750, unit: "ml", cost: 30.00 }
    ]
  },

  // Gin
  {
    name: "Beefeater Glass",
    description: "Beefeater gin by the glass",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Beefeater Gin", quantity: 50, unit: "ml", cost: 3.00 }
    ]
  },
  {
    name: "Beefeater Bottle",
    description: "Beefeater gin bottle",
    price: 70.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Beefeater Gin", quantity: 750, unit: "ml", cost: 35.00 }
    ]
  },
  {
    name: "Tanqueray Glass",
    description: "Tanqueray gin by the glass",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Tanqueray Gin", quantity: 50, unit: "ml", cost: 3.50 }
    ]
  },
  {
    name: "Tanqueray Bottle",
    description: "Tanqueray gin bottle",
    price: 80.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Tanqueray Gin", quantity: 750, unit: "ml", cost: 40.00 }
    ]
  },
  {
    name: "Bombay Glass",
    description: "Bombay gin by the glass",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Bombay Gin", quantity: 50, unit: "ml", cost: 2.50 }
    ]
  },
  {
    name: "Bombay Bottle",
    description: "Bombay gin bottle",
    price: 50.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Bombay Gin", quantity: 750, unit: "ml", cost: 25.00 }
    ]
  },
  {
    name: "Gordons Glass",
    description: "Gordons gin by the glass",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Gordons Gin", quantity: 50, unit: "ml", cost: 3.00 }
    ]
  },
  {
    name: "Gordons Bottle",
    description: "Gordons gin bottle",
    price: 65.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Gordons Gin", quantity: 750, unit: "ml", cost: 32.50 }
    ]
  },

  // Whiskey
  {
    name: "J&B Glass",
    description: "J&B whiskey by the glass",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "J&B Whiskey", quantity: 50, unit: "ml", cost: 3.50 }
    ]
  },
  {
    name: "J&B Bottle",
    description: "J&B whiskey bottle",
    price: 80.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "J&B Whiskey", quantity: 750, unit: "ml", cost: 40.00 }
    ]
  },
  {
    name: "Jack Daniels Glass",
    description: "Jack Daniels whiskey by the glass",
    price: 9.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Jack Daniels Whiskey", quantity: 50, unit: "ml", cost: 4.50 }
    ]
  },
  {
    name: "Jack Daniels Bottle",
    description: "Jack Daniels whiskey bottle",
    price: 100.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Jack Daniels Whiskey", quantity: 750, unit: "ml", cost: 50.00 }
    ]
  },
  {
    name: "Glenfiddich Glass",
    description: "Glenfiddich whiskey by the glass",
    price: 10.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Glenfiddich Whiskey", quantity: 50, unit: "ml", cost: 5.00 }
    ]
  },
  {
    name: "Glenfiddich Bottle",
    description: "Glenfiddich whiskey bottle",
    price: 120.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Glenfiddich Whiskey", quantity: 750, unit: "ml", cost: 60.00 }
    ]
  },
  {
    name: "Black Label Glass",
    description: "Black Label whiskey by the glass",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Black Label Whiskey", quantity: 50, unit: "ml", cost: 4.00 }
    ]
  },
  {
    name: "Black Label Bottle",
    description: "Black Label whiskey bottle",
    price: 90.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Black Label Whiskey", quantity: 750, unit: "ml", cost: 45.00 }
    ]
  },
  {
    name: "Red Label Glass",
    description: "Red Label whiskey by the glass",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Red Label Whiskey", quantity: 50, unit: "ml", cost: 3.00 }
    ]
  },
  {
    name: "Red Label Bottle",
    description: "Red Label whiskey bottle",
    price: 70.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Red Label Whiskey", quantity: 750, unit: "ml", cost: 35.00 }
    ]
  },
  {
    name: "Jameson Glass",
    description: "Jameson whiskey by the glass",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Jameson Whiskey", quantity: 50, unit: "ml", cost: 3.00 }
    ]
  },
  {
    name: "Jameson Bottle",
    description: "Jameson whiskey bottle",
    price: 70.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Jameson Whiskey", quantity: 750, unit: "ml", cost: 35.00 }
    ]
  },
  {
    name: "Chivas 12y Glass",
    description: "Chivas 12 years whiskey by the glass",
    price: 9.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Chivas 12y Whiskey", quantity: 50, unit: "ml", cost: 4.50 }
    ]
  },
  {
    name: "Chivas 12y Bottle",
    description: "Chivas 12 years whiskey bottle",
    price: 100.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Chivas 12y Whiskey", quantity: 750, unit: "ml", cost: 50.00 }
    ]
  },
  {
    name: "Chivas 15y Glass",
    description: "Chivas 15 years whiskey by the glass",
    price: 11.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Chivas 15y Whiskey", quantity: 50, unit: "ml", cost: 5.50 }
    ]
  },
  {
    name: "Chivas 15y Bottle",
    description: "Chivas 15 years whiskey bottle",
    price: 150.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Chivas 15y Whiskey", quantity: 750, unit: "ml", cost: 75.00 }
    ]
  },
  {
    name: "Jim Beam Glass",
    description: "Jim Beam whiskey by the glass",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Jim Beam Whiskey", quantity: 50, unit: "ml", cost: 3.00 }
    ]
  },
  {
    name: "Jim Beam Bottle",
    description: "Jim Beam whiskey bottle",
    price: 75.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Jim Beam Whiskey", quantity: 750, unit: "ml", cost: 37.50 }
    ]
  },

  // Vodka
  {
    name: "Grey Goose Bottle",
    description: "Grey Goose vodka bottle",
    price: 120.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Grey Goose Vodka", quantity: 750, unit: "ml", cost: 60.00 }
    ]
  },
  {
    name: "Belvedere Bottle",
    description: "Belvedere vodka bottle",
    price: 140.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Belvedere Vodka", quantity: 750, unit: "ml", cost: 70.00 }
    ]
  },
  {
    name: "Stoli Gold Glass",
    description: "Stoli Gold vodka by the glass",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Stoli Gold Vodka", quantity: 50, unit: "ml", cost: 4.00 }
    ]
  },
  {
    name: "Stoli Gold Bottle",
    description: "Stoli Gold vodka bottle",
    price: 100.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Stoli Gold Vodka", quantity: 750, unit: "ml", cost: 50.00 }
    ]
  },
  {
    name: "Stoli Red Glass",
    description: "Stoli Red vodka by the glass",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Stoli Red Vodka", quantity: 50, unit: "ml", cost: 3.00 }
    ]
  },
  {
    name: "Stoli Red Bottle",
    description: "Stoli Red vodka bottle",
    price: 70.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Stoli Red Vodka", quantity: 750, unit: "ml", cost: 35.00 }
    ]
  },
  {
    name: "Smirnoff Glass",
    description: "Smirnoff vodka by the glass",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Smirnoff Vodka", quantity: 50, unit: "ml", cost: 2.50 }
    ]
  },
  {
    name: "Smirnoff Bottle",
    description: "Smirnoff vodka bottle",
    price: 60.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Smirnoff Vodka", quantity: 750, unit: "ml", cost: 30.00 }
    ]
  },
  {
    name: "Russian Standard Glass",
    description: "Russian Standard vodka by the glass",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Russian Standard Vodka", quantity: 50, unit: "ml", cost: 4.00 }
    ]
  },
  {
    name: "Russian Standard Bottle",
    description: "Russian Standard vodka bottle",
    price: 85.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Russian Standard Vodka", quantity: 750, unit: "ml", cost: 42.50 }
    ]
  },

  // Cocktails
  {
    name: "Bull Frog",
    description: "Vodka, tequila, rum, gin, blue curacao, lemon juice and energy drinks",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Tequila", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Rum", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Gin", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Blue Curacao", quantity: 15, unit: "ml", cost: 0.75 },
      { materialName: "Lemon Juice", quantity: 15, unit: "ml", cost: 0.25 },
      { materialName: "Energy Drink", quantity: 100, unit: "ml", cost: 1.00 }
    ]
  },
  {
    name: "Take Me Home",
    description: "Vodka, tequila, rum, gin, blue curacao, lime juice and 7up",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Tequila", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Rum", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Gin", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Blue Curacao", quantity: 15, unit: "ml", cost: 0.75 },
      { materialName: "Lime Juice", quantity: 15, unit: "ml", cost: 0.25 },
      { materialName: "7up", quantity: 100, unit: "ml", cost: 0.50 }
    ]
  },
  {
    name: "Margarita",
    description: "Tequila, triple sec and lime juice",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Tequila", quantity: 45, unit: "ml", cost: 2.25 },
      { materialName: "Triple Sec", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Lime Juice", quantity: 25, unit: "ml", cost: 0.50 }
    ]
  },
  {
    name: "Long Island",
    description: "Vodka, gin, white rum, gold tequila, blue curacao and pepsi",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 20, unit: "ml", cost: 1.00 },
      { materialName: "Gin", quantity: 20, unit: "ml", cost: 1.00 },
      { materialName: "White Rum", quantity: 20, unit: "ml", cost: 1.00 },
      { materialName: "Gold Tequila", quantity: 20, unit: "ml", cost: 1.00 },
      { materialName: "Blue Curacao", quantity: 15, unit: "ml", cost: 0.75 },
      { materialName: "Pepsi", quantity: 100, unit: "ml", cost: 0.50 }
    ]
  },
  {
    name: "Gin Basil",
    description: "Gin, simple syrup, lime juice and fresh basil",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Gin", quantity: 50, unit: "ml", cost: 2.50 },
      { materialName: "Simple Syrup", quantity: 20, unit: "ml", cost: 0.25 },
      { materialName: "Lime Juice", quantity: 20, unit: "ml", cost: 0.40 },
      { materialName: "Fresh Basil", quantity: 5, unit: "g", cost: 0.30 }
    ]
  },
  {
    name: "Pina Colada",
    description: "Rum, coconut syrup, pineapple juice, milk and malibu",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Rum", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Coconut Syrup", quantity: 20, unit: "ml", cost: 0.50 },
      { materialName: "Pineapple Juice", quantity: 60, unit: "ml", cost: 0.60 },
      { materialName: "Milk", quantity: 30, unit: "ml", cost: 0.20 },
      { materialName: "Malibu", quantity: 20, unit: "ml", cost: 1.00 }
    ]
  },
  {
    name: "Moscow Mule",
    description: "Vodka, lime juice and ginger beer",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 50, unit: "ml", cost: 2.50 },
      { materialName: "Lime Juice", quantity: 20, unit: "ml", cost: 0.40 },
      { materialName: "Ginger Beer", quantity: 100, unit: "ml", cost: 1.00 }
    ]
  },
  {
    name: "London Mule",
    description: "Gin, lime juice and ginger beer",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Gin", quantity: 50, unit: "ml", cost: 2.50 },
      { materialName: "Lime Juice", quantity: 20, unit: "ml", cost: 0.40 },
      { materialName: "Ginger Beer", quantity: 100, unit: "ml", cost: 1.00 }
    ]
  },
  {
    name: "Midori Sour",
    description: "Vodka, midori, lime juice, orange juice and 7up",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Midori", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Lime Juice", quantity: 15, unit: "ml", cost: 0.30 },
      { materialName: "Orange Juice", quantity: 30, unit: "ml", cost: 0.30 },
      { materialName: "7up", quantity: 60, unit: "ml", cost: 0.30 }
    ]
  },
  {
    name: "Sex on the Beach",
    description: "Vodka, archer, orange juice and cranberry juice",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 40, unit: "ml", cost: 2.00 },
      { materialName: "Archer", quantity: 20, unit: "ml", cost: 1.00 },
      { materialName: "Orange Juice", quantity: 40, unit: "ml", cost: 0.40 },
      { materialName: "Cranberry Juice", quantity: 40, unit: "ml", cost: 0.40 }
    ]
  },
  {
    name: "Cosmopolitan",
    description: "Vodka, lime juice, cranberry juice and triple sec",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 40, unit: "ml", cost: 2.00 },
      { materialName: "Lime Juice", quantity: 15, unit: "ml", cost: 0.30 },
      { materialName: "Cranberry Juice", quantity: 30, unit: "ml", cost: 0.30 },
      { materialName: "Triple Sec", quantity: 15, unit: "ml", cost: 0.75 }
    ]
  },
  {
    name: "Passion Fruit Martini",
    description: "Vodka, lime juice, orange juice and passion syrup",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 50, unit: "ml", cost: 2.50 },
      { materialName: "Lime Juice", quantity: 15, unit: "ml", cost: 0.30 },
      { materialName: "Orange Juice", quantity: 30, unit: "ml", cost: 0.30 },
      { materialName: "Passion Fruit Syrup", quantity: 20, unit: "ml", cost: 0.60 }
    ]
  },
  {
    name: "Espresso Martini",
    description: "Vodka, kahlua, simple syrup and shot espresso",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 40, unit: "ml", cost: 2.00 },
      { materialName: "Kahlua", quantity: 20, unit: "ml", cost: 1.00 },
      { materialName: "Simple Syrup", quantity: 10, unit: "ml", cost: 0.15 },
      { materialName: "Espresso Shot", quantity: 30, unit: "ml", cost: 0.50 }
    ]
  },
  {
    name: "Mojito",
    description: "Rum, simple syrup, lime juice, 7up and fresh mint",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Rum", quantity: 50, unit: "ml", cost: 2.50 },
      { materialName: "Simple Syrup", quantity: 20, unit: "ml", cost: 0.25 },
      { materialName: "Lime Juice", quantity: 20, unit: "ml", cost: 0.40 },
      { materialName: "7up", quantity: 60, unit: "ml", cost: 0.30 },
      { materialName: "Fresh Mint", quantity: 5, unit: "g", cost: 0.30 }
    ]
  },
  {
    name: "Tequila Sunrise",
    description: "White tequila, orange juice and grenadine",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "White Tequila", quantity: 50, unit: "ml", cost: 2.50 },
      { materialName: "Orange Juice", quantity: 100, unit: "ml", cost: 1.00 },
      { materialName: "Grenadine", quantity: 10, unit: "ml", cost: 0.25 }
    ]
  },
  {
    name: "Jamaica",
    description: "Vodka, pineapple juice, orange juice and grenadine",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 40, unit: "ml", cost: 2.00 },
      { materialName: "Pineapple Juice", quantity: 40, unit: "ml", cost: 0.40 },
      { materialName: "Orange Juice", quantity: 40, unit: "ml", cost: 0.40 },
      { materialName: "Grenadine", quantity: 10, unit: "ml", cost: 0.25 }
    ]
  },
  {
    name: "White Russian",
    description: "Vodka and bailey's",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 40, unit: "ml", cost: 2.00 },
      { materialName: "Bailey's", quantity: 30, unit: "ml", cost: 1.50 }
    ]
  },
  {
    name: "Black Russian",
    description: "Vodka and kahlua",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vodka", quantity: 40, unit: "ml", cost: 2.00 },
      { materialName: "Kahlua", quantity: 30, unit: "ml", cost: 1.50 }
    ]
  },
  {
    name: "Jager Bomb",
    description: "Jager and red bull",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Jagermeister", quantity: 30, unit: "ml", cost: 1.50 },
      { materialName: "Red Bull", quantity: 100, unit: "ml", cost: 2.00 }
    ]
  },

  // Cold Coffee & Iced Drinks
  {
    name: "Iced Coffee Caramel",
    description: "Iced coffee with caramel flavor",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee", quantity: 100, unit: "ml", cost: 1.00 },
      { materialName: "Caramel Syrup", quantity: 30, unit: "ml", cost: 0.50 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 },
      { materialName: "Milk", quantity: 50, unit: "ml", cost: 0.30 }
    ]
  },
  {
    name: "Iced Coffee Vanilla",
    description: "Iced coffee with vanilla flavor",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee", quantity: 100, unit: "ml", cost: 1.00 },
      { materialName: "Vanilla Syrup", quantity: 30, unit: "ml", cost: 0.50 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 },
      { materialName: "Milk", quantity: 50, unit: "ml", cost: 0.30 }
    ]
  },
  {
    name: "Iced Coffee",
    description: "Classic iced coffee",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee", quantity: 120, unit: "ml", cost: 1.20 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 },
      { materialName: "Milk", quantity: 30, unit: "ml", cost: 0.20 }
    ]
  },
  {
    name: "Toffee Caramel",
    description: "Toffee caramel drink",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee", quantity: 80, unit: "ml", cost: 0.80 },
      { materialName: "Toffee Syrup", quantity: 30, unit: "ml", cost: 0.60 },
      { materialName: "Caramel Syrup", quantity: 20, unit: "ml", cost: 0.40 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 },
      { materialName: "Milk", quantity: 70, unit: "ml", cost: 0.40 }
    ]
  },
  {
    name: "Ice Tea Peach",
    description: "Peach flavored iced tea",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Tea", quantity: 150, unit: "ml", cost: 0.50 },
      { materialName: "Peach Syrup", quantity: 30, unit: "ml", cost: 0.60 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 }
    ]
  },
  {
    name: "Ice Tea Mango",
    description: "Mango flavored iced tea",
    price: 4.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Tea", quantity: 150, unit: "ml", cost: 0.50 },
      { materialName: "Mango Syrup", quantity: 30, unit: "ml", cost: 0.50 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 }
    ]
  },
  {
    name: "Ice Tea Blueberry",
    description: "Blueberry flavored iced tea",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Tea", quantity: 150, unit: "ml", cost: 0.50 },
      { materialName: "Blueberry Syrup", quantity: 30, unit: "ml", cost: 0.60 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 }
    ]
  },
  {
    name: "Ice Tea Passion Fruit",
    description: "Passion fruit flavored iced tea",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Tea", quantity: 150, unit: "ml", cost: 0.50 },
      { materialName: "Passion Fruit Syrup", quantity: 30, unit: "ml", cost: 0.70 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 }
    ]
  },

  // Energy & Soft Drinks
  {
    name: "Red Bull",
    description: "Red Bull energy drink",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Red Bull", quantity: 250, unit: "ml", cost: 2.50 }
    ]
  },
  {
    name: "Water Small",
    description: "Small water bottle",
    price: 1.5,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Bottled Water Small", quantity: 330, unit: "ml", cost: 0.50 }
    ]
  },
  {
    name: "Water Large",
    description: "Large water bottle",
    price: 3.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Bottled Water Large", quantity: 750, unit: "ml", cost: 1.00 }
    ]
  },
  {
    name: "Soft Drinks",
    description: "Assorted soft drinks",
    price: 3.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Soft Drink", quantity: 330, unit: "ml", cost: 1.20 }
    ]
  },
  {
    name: "7up Grenadine",
    description: "7up with grenadine",
    price: 3.5,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "7up", quantity: 250, unit: "ml", cost: 1.00 },
      { materialName: "Grenadine", quantity: 20, unit: "ml", cost: 0.50 }
    ]
  },
  {
    name: "Sparkling Water",
    description: "Sparkling water",
    price: 4.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Sparkling Water", quantity: 330, unit: "ml", cost: 1.50 }
    ]
  },
  {
    name: "Bzurat",
    description: "Traditional Lebanese drink",
    price: 2.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Bzurat Mix", quantity: 200, unit: "ml", cost: 0.80 }
    ]
  },
  {
    name: "Energy Drink",
    description: "Energy drink",
    price: 4.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Energy Drink", quantity: 250, unit: "ml", cost: 2.00 }
    ]
  },

  // Smoothies
  {
    name: "Mango Smoothie",
    description: "Fresh mango smoothie",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Mango Puree", quantity: 100, unit: "ml", cost: 1.50 },
      { materialName: "Milk", quantity: 100, unit: "ml", cost: 0.50 },
      { materialName: "Ice", quantity: 80, unit: "g", cost: 0.10 },
      { materialName: "Sugar Syrup", quantity: 20, unit: "ml", cost: 0.20 }
    ]
  },
  {
    name: "Strawberry Smoothie",
    description: "Fresh strawberry smoothie",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Strawberry Puree", quantity: 100, unit: "ml", cost: 1.50 },
      { materialName: "Milk", quantity: 100, unit: "ml", cost: 0.50 },
      { materialName: "Ice", quantity: 80, unit: "g", cost: 0.10 },
      { materialName: "Sugar Syrup", quantity: 20, unit: "ml", cost: 0.20 }
    ]
  },
  {
    name: "Mixed Berries Smoothie",
    description: "Mixed berries smoothie",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Mixed Berry Puree", quantity: 100, unit: "ml", cost: 1.80 },
      { materialName: "Milk", quantity: 100, unit: "ml", cost: 0.50 },
      { materialName: "Ice", quantity: 80, unit: "g", cost: 0.10 },
      { materialName: "Sugar Syrup", quantity: 20, unit: "ml", cost: 0.20 }
    ]
  },
  {
    name: "Peach Smoothie",
    description: "Fresh peach smoothie",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Peach Puree", quantity: 100, unit: "ml", cost: 1.50 },
      { materialName: "Milk", quantity: 100, unit: "ml", cost: 0.50 },
      { materialName: "Ice", quantity: 80, unit: "g", cost: 0.10 },
      { materialName: "Sugar Syrup", quantity: 20, unit: "ml", cost: 0.20 }
    ]
  },
  {
    name: "Peach Passion Smoothie",
    description: "Peach and passion fruit smoothie",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Peach Puree", quantity: 70, unit: "ml", cost: 1.00 },
      { materialName: "Passion Fruit Puree", quantity: 50, unit: "ml", cost: 1.20 },
      { materialName: "Milk", quantity: 80, unit: "ml", cost: 0.40 },
      { materialName: "Ice", quantity: 80, unit: "g", cost: 0.10 },
      { materialName: "Sugar Syrup", quantity: 20, unit: "ml", cost: 0.20 }
    ]
  },
  {
    name: "Passion Strawberry Smoothie",
    description: "Passion fruit and strawberry smoothie",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Passion Fruit Puree", quantity: 60, unit: "ml", cost: 1.20 },
      { materialName: "Strawberry Puree", quantity: 60, unit: "ml", cost: 1.00 },
      { materialName: "Milk", quantity: 80, unit: "ml", cost: 0.40 },
      { materialName: "Ice", quantity: 80, unit: "g", cost: 0.10 },
      { materialName: "Sugar Syrup", quantity: 20, unit: "ml", cost: 0.20 }
    ]
  },
  {
    name: "Peach Mango Smoothie",
    description: "Peach and mango smoothie",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Peach Puree", quantity: 60, unit: "ml", cost: 0.90 },
      { materialName: "Mango Puree", quantity: 60, unit: "ml", cost: 0.90 },
      { materialName: "Milk", quantity: 80, unit: "ml", cost: 0.40 },
      { materialName: "Ice", quantity: 80, unit: "g", cost: 0.10 },
      { materialName: "Sugar Syrup", quantity: 20, unit: "ml", cost: 0.20 }
    ]
  },

  // Fresh Juices
  {
    name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Fresh Oranges", quantity: 400, unit: "g", cost: 2.00 },
      { materialName: "Ice", quantity: 50, unit: "g", cost: 0.05 }
    ]
  },
  {
    name: "Lemonade",
    description: "Fresh lemonade",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Fresh Lemons", quantity: 200, unit: "g", cost: 1.00 },
      { materialName: "Sugar Syrup", quantity: 50, unit: "ml", cost: 0.50 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 },
      { materialName: "Water", quantity: 200, unit: "ml", cost: 0.05 }
    ]
  },
  {
    name: "Minted Lemonade",
    description: "Fresh lemonade with mint",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Fresh Lemons", quantity: 200, unit: "g", cost: 1.00 },
      { materialName: "Sugar Syrup", quantity: 50, unit: "ml", cost: 0.50 },
      { materialName: "Fresh Mint", quantity: 20, unit: "g", cost: 0.40 },
      { materialName: "Ice", quantity: 100, unit: "g", cost: 0.10 },
      { materialName: "Water", quantity: 200, unit: "ml", cost: 0.05 }
    ]
  },

  // Shakes
  {
    name: "Bounty Shake",
    description: "Bounty chocolate shake",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vanilla Ice Cream", quantity: 100, unit: "g", cost: 1.20 },
      { materialName: "Coconut Syrup", quantity: 30, unit: "ml", cost: 0.60 },
      { materialName: "Chocolate Syrup", quantity: 20, unit: "ml", cost: 0.40 },
      { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.60 },
      { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.50 },
      { materialName: "Coconut Flakes", quantity: 10, unit: "g", cost: 0.30 }
    ]
  },
  {
    name: "Lotus Shake",
    description: "Lotus biscuit shake",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vanilla Ice Cream", quantity: 100, unit: "g", cost: 1.20 },
      { materialName: "Lotus Biscuit Spread", quantity: 40, unit: "g", cost: 0.90 },
      { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.60 },
      { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.50 },
      { materialName: "Lotus Biscuit", quantity: 1, unit: "piece", cost: 0.30 }
    ]
  },
  {
    name: "Chocolate Shake",
    description: "Classic chocolate shake",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Chocolate Ice Cream", quantity: 100, unit: "g", cost: 1.20 },
      { materialName: "Chocolate Syrup", quantity: 30, unit: "ml", cost: 0.60 },
      { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.60 },
      { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.50 },
      { materialName: "Chocolate Sprinkles", quantity: 5, unit: "g", cost: 0.20 }
    ]
  },
  {
    name: "Oreo Shake",
    description: "Oreo cookies shake",
    price: 8.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vanilla Ice Cream", quantity: 100, unit: "g", cost: 1.20 },
      { materialName: "Oreo Cookies", quantity: 4, unit: "piece", cost: 0.80 },
      { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.60 },
      { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.50 },
      { materialName: "Chocolate Syrup", quantity: 15, unit: "ml", cost: 0.30 }
    ]
  },
  {
    name: "Strawberry Shake",
    description: "Fresh strawberry shake",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vanilla Ice Cream", quantity: 100, unit: "g", cost: 1.20 },
      { materialName: "Strawberry Puree", quantity: 50, unit: "ml", cost: 0.90 },
      { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.60 },
      { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.50 },
      { materialName: "Fresh Strawberries", quantity: 30, unit: "g", cost: 0.60 }
    ]
  },
  {
    name: "Vanilla Shake",
    description: "Classic vanilla shake",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Vanilla Ice Cream", quantity: 120, unit: "g", cost: 1.40 },
      { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.60 },
      { materialName: "Vanilla Extract", quantity: 5, unit: "ml", cost: 0.30 },
      { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.50 }
    ]
  },
  {
    name: "Brownie Shake",
    description: "Chocolate brownie shake",
    price: 9.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Chocolate Ice Cream", quantity: 100, unit: "g", cost: 1.20 },
      { materialName: "Brownie Pieces", quantity: 50, unit: "g", cost: 1.50 },
      { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.60 },
      { materialName: "Chocolate Syrup", quantity: 30, unit: "ml", cost: 0.60 },
      { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.50 }
    ]
  },
  {
    name: "Chocolate Strawberry Shake",
    description: "Chocolate and strawberry shake",
    price: 7.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Chocolate Ice Cream", quantity: 60, unit: "g", cost: 0.70 },
      { materialName: "Strawberry Ice Cream", quantity: 60, unit: "g", cost: 0.70 },
      { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.60 },
      { materialName: "Chocolate Syrup", quantity: 15, unit: "ml", cost: 0.30 },
      { materialName: "Strawberry Syrup", quantity: 15, unit: "ml", cost: 0.30 },
      { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.50 }
    ]
  },

  // Hot Drinks
  {
    name: "Espresso",
    description: "Classic espresso",
    price: 2.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee Beans", quantity: 18, unit: "g", cost: 0.80 },
      { materialName: "Water", quantity: 30, unit: "ml", cost: 0.05 }
    ]
  },
  {
    name: "Nescafe Gold",
    description: "Nescafe Gold instant coffee",
    price: 4.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Nescafe Gold Instant Coffee", quantity: 2, unit: "g", cost: 0.50 },
      { materialName: "Hot Water", quantity: 200, unit: "ml", cost: 0.10 },
      { materialName: "Sugar", quantity: 10, unit: "g", cost: 0.05 }
    ]
  },
  {
    name: "Cappuccino",
    description: "Classic cappuccino",
    price: 4.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee Beans", quantity: 18, unit: "g", cost: 0.80 },
      { materialName: "Milk", quantity: 120, unit: "ml", cost: 0.60 },
      { materialName: "Water", quantity: 30, unit: "ml", cost: 0.05 },
      { materialName: "Milk Foam", quantity: 30, unit: "ml", cost: 0.20 }
    ]
  },
  {
    name: "American Coffee",
    description: "American style coffee",
    price: 4.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee Beans", quantity: 18, unit: "g", cost: 0.80 },
      { materialName: "Hot Water", quantity: 180, unit: "ml", cost: 0.10 }
    ]
  },
  {
    name: "Hot Chocolate",
    description: "Rich hot chocolate",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Chocolate Powder", quantity: 25, unit: "g", cost: 0.70 },
      { materialName: "Milk", quantity: 200, unit: "ml", cost: 0.80 },
      { materialName: "Whipped Cream", quantity: 20, unit: "g", cost: 0.40 },
      { materialName: "Chocolate Sprinkles", quantity: 5, unit: "g", cost: 0.20 }
    ]
  },
  {
    name: "Tisane",
    description: "Herbal tea",
    price: 3.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Herbal Tea Bag", quantity: 1, unit: "piece", cost: 0.40 },
      { materialName: "Hot Water", quantity: 200, unit: "ml", cost: 0.10 },
      { materialName: "Honey", quantity: 10, unit: "g", cost: 0.30 }
    ]
  },
  {
    name: "Cafe Latte",
    description: "Classic cafe latte",
    price: 5.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee Beans", quantity: 18, unit: "g", cost: 0.80 },
      { materialName: "Milk", quantity: 180, unit: "ml", cost: 0.90 },
      { materialName: "Water", quantity: 30, unit: "ml", cost: 0.05 }
    ]
  },
  {
    name: "Turkish Coffee",
    description: "Traditional Turkish coffee",
    price: 3.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Turkish Coffee Grounds", quantity: 7, unit: "g", cost: 0.60 },
      { materialName: "Water", quantity: 60, unit: "ml", cost: 0.05 },
      { materialName: "Sugar", quantity: 5, unit: "g", cost: 0.05 }
    ]
  },
  {
    name: "Cafe Latte Caramel",
    description: "Cafe latte with caramel flavor",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee Beans", quantity: 18, unit: "g", cost: 0.80 },
      { materialName: "Milk", quantity: 180, unit: "ml", cost: 0.90 },
      { materialName: "Water", quantity: 30, unit: "ml", cost: 0.05 },
      { materialName: "Caramel Syrup", quantity: 20, unit: "ml", cost: 0.40 },
      { materialName: "Whipped Cream", quantity: 20, unit: "g", cost: 0.40 }
    ]
  },
  {
    name: "Cafe Latte Vanilla",
    description: "Cafe latte with vanilla flavor",
    price: 6.0,
    category: "beverages",
    isPOSItem: true,
    printerId: 2,
    beverageStockId: null,
    ingredients: [
      { materialName: "Coffee Beans", quantity: 18, unit: "g", cost: 0.80 },
      { materialName: "Milk", quantity: 180, unit: "ml", cost: 0.90 },
      { materialName: "Water", quantity: 30, unit: "ml", cost: 0.05 },
      { materialName: "Vanilla Syrup", quantity: 20, unit: "ml", cost: 0.40 },
      { materialName: "Whipped Cream", quantity: 20, unit: "g", cost: 0.40 }
    ]
  }
];

export const seedBeverages = async () => {
  console.log("🍹 Starting beverages seeding...");

  // Get all materials for ingredient mapping
  const materials = await Material.findAll();
  const materialMap = {};
  materials.forEach(material => {
    materialMap[material.name] = material;
  });

  // Get the ID of the 'beverages' category type
  const beveragesCategoryType = await CategoryType.findOne({ where: { type: 'beverages' } });
  
  if (!beveragesCategoryType) {
    console.error("❌ Error: 'beverages' category type not found!");
    return { created: 0, skipped: 0, errors: beverageItems.length };
  }
  
  const beveragesCategoryTypeId = beveragesCategoryType.id;
  
  // Get all beverage categories to map category values to IDs
  // Filter categories where categoryTypeIds array contains the beverages type ID
  const categories = await Category.findAll({
    where: {
      categoryTypeIds: { [Op.contains]: [beveragesCategoryTypeId] }
    }
  });
  
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.value] = cat.id;
  });

  console.log("📋 Available beverage categories:", categoryMap);

  // Make sure we have a default 'beverages' category
  const defaultBeverageCategoryId = categoryMap['beverages'] || categoryMap['cold'] || categoryMap['hot'] || categoryMap['alcohol'];
  if (!defaultBeverageCategoryId) {
    console.error("❌ Error: No suitable beverage category found!");
    return { created: 0, skipped: 0, errors: beverageItems.length };
  }

  // Convert beverages data to use categoryIds
  const beveragesWithCategoryIds = beverageItems.map(beverage => {
    // Always use the beverages category for all drinks
    const categoryId = categoryMap[beverage.category] || defaultBeverageCategoryId;
    
    const { category, ...beverageData } = beverage;
    return {
      ...beverageData,
      categoryId
    };
  });

  let createdCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const beverage of beveragesWithCategoryIds) {
    try {
      // Extract ingredients before creating the menu item
      const { ingredients, ...beverageData } = beverage;
      
      // Check if menu item already exists
      const existingItem = await MenuItem.findOne({
        where: { name: beverageData.name }
      });

      if (!existingItem) {
        // Create menu item with beverageStockId
        const menuItem = await MenuItem.create(beverageData);

        // Create ingredients for the beverage
        for (const ingredientData of ingredients) {
          const material = materialMap[ingredientData.materialName];
          if (material) {
            await MenuItemIngredient.create({
              menuItemId: menuItem.id,
              materialId: material.id,
              quantity: ingredientData.quantity,
              unit: ingredientData.unit,
              cost: ingredientData.cost
            });
          } else {
            console.log(`⚠️  Material not found for ingredient: ${ingredientData.materialName} in beverage: ${beverageData.name}`);
          }
        }

        createdCount++;
        console.log(`✅ Created beverage: ${beverageData.name} ($${beverageData.price}) - Category ID: ${beverageData.categoryId} with ${ingredients.length} ingredients`);
      } else {
        skippedCount++;
        console.log(`⏭️  Beverage already exists: ${beverageData.name}`);
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
