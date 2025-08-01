import sequelize from '../config/database.js';

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const [results] = await sequelize.query('SELECT NOW() as current_time');
    console.log('✅ Database query successful:', results[0].current_time);
    
    // Test if main tables exist
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Test Sessions table specifically (from your memories)
    const [sessionCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      ) as sessions_exists
    `);
    
    console.log('🔍 Sessions table exists:', sessionCheck[0].sessions_exists);
    
    await sequelize.close();
    console.log('✅ Database connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.original?.message || 'No additional details');
    
    // Specific handling for common PostgreSQL errors
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestions:');
      console.log('  - Make sure PostgreSQL service is running');
      console.log('  - Check if PostgreSQL is listening on port 5432');
      console.log('  - Verify database "inventory_db3" exists');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database "inventory_db3" does not exist');
      console.log('  - Create the database first');
      console.log('  - Or check if you meant a different database name');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed');
      console.log('  - Check username and password');
      console.log('  - Verify PostgreSQL user permissions');
    }
    
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection();
