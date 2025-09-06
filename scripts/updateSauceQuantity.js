const { sequelize } = require('../backend/config/database');

async function updateSauceQuantity() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Update oOps Special Sauce to 1000ml
    const [updated] = await sequelize.query(
      `UPDATE sauces 
       SET yield_quantity = '1000.000', 
           unit = 'ml', 
           updated_at = NOW() 
       WHERE name = 'oOps Special Sauce' 
       RETURNING id, name, yield_quantity, unit`
    );

    if (updated[0] && updated[0].length > 0) {
      console.log('✅ Successfully updated sauce:');
      console.log(updated[0][0]);
    } else {
      console.log('⚠️ Sauce not found. Creating new entry...');
      
      // If sauce doesn't exist, create it
      const [created] = await sequelize.query(
        `INSERT INTO sauces (name, yield_quantity, unit, created_at, updated_at)
         VALUES ('oOps Special Sauce', '1000.000', 'ml', NOW(), NOW())
         RETURNING id, name, yield_quantity, unit`
      );
      
      console.log('✅ Created new sauce:');
      console.log(created[0]);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

updateSauceQuantity();
