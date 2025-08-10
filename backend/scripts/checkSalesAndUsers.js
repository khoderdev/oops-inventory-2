import sequelize from '../config/database.js';
import { Sale, User } from '../models/index.js';

async function checkSalesAndUsers() {
  try {
    console.log('🔍 Checking Sales and Users data...\n');
    
    // Check users
    const users = await User.findAll({
      attributes: ['id', 'username'],
      limit: 5
    });
    
    console.log('👥 Available Users:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}`);
    });
    
    // Check recent sales with their userId
    const recentSales = await Sale.findAll({
      attributes: ['id', 'saleDate', 'totalAmount', 'userId'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['username'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    console.log('\n📊 Recent Sales (last 5):');
    recentSales.forEach(sale => {
      console.log(`  - Sale ID: ${sale.id}, Date: ${sale.saleDate.toISOString().split('T')[0]}, Amount: $${sale.totalAmount}, UserID: ${sale.userId || 'NULL'}, Creator: ${sale.creator?.username || 'NULL'}`);
    });
    
    // Count sales with and without userId
    const salesWithUser = await Sale.count({ where: { userId: { [sequelize.Sequelize.Op.ne]: null } } });
    const salesWithoutUser = await Sale.count({ where: { userId: null } });
    
    console.log('\n📈 Sales Summary:');
    console.log(`  - Sales with creator: ${salesWithUser}`);
    console.log(`  - Sales without creator: ${salesWithoutUser}`);
    console.log(`  - Total sales: ${salesWithUser + salesWithoutUser}`);
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await sequelize.close();
  }
}

checkSalesAndUsers();
