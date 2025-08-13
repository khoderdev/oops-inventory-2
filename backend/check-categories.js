import db from './config/database.js';
import Category from './models/Category.js';

async function checkCategories() {
  try {
    await db.authenticate();
    const categories = await Category.findAll({
      where: { type: 'menu_items' },
      order: [['id', 'ASC']]
    });
    
    console.log('Menu Item Categories:');
    categories.forEach(cat => {
      console.log(`ID: ${cat.id}, Name: ${cat.name}, Value: ${cat.value}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategories();
