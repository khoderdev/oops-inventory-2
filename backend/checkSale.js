import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/inventory_db', {
  dialect: 'postgres',
  logging: false
});

async function checkSale() {
  try {
    const [results] = await sequelize.query(
      'SELECT id, "totalAmount", "menuItems" FROM "Sales" WHERE id = 102;'
    );
    console.log('Sale data:', JSON.stringify(results[0], null, 2));
  } catch (error) {
    console.error('Error checking sale:', error);
  } finally {
    await sequelize.close();
  }
}

checkSale();
