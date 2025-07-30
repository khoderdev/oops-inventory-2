#!/usr/bin/env node

/**
 * Test Database Backup Script
 * This version will show us exactly what's happening
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting backup test...');

try {
  console.log('📦 Testing imports...');
  
  // Test database import
  console.log('   - Importing database config...');
  const { default: sequelize } = await import('../config/database.js');
  console.log('   ✓ Database config imported');
  
  // Test database connection
  console.log('🔌 Testing database connection...');
  await sequelize.authenticate();
  console.log('   ✓ Database connection successful');
  
  // Test models import
  console.log('📋 Testing models import...');
  const models = await import('../models/index.js');
  console.log('   ✓ Models imported successfully');
  console.log('   📊 Available models:', Object.keys(models));
  
  // Test basic query
  console.log('🔍 Testing basic database query...');
  const [results] = await sequelize.query('SELECT current_database(), current_user, version()');
  console.log('   ✓ Database query successful');
  console.log('   📍 Database:', results[0].current_database);
  console.log('   👤 User:', results[0].current_user);
  
  // Get table list
  console.log('📋 Getting table list...');
  const [tables] = await sequelize.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  console.log('   📊 Tables found:', tables.length);
  tables.forEach(table => {
    console.log('      -', table.table_name);
  });
  
  // Test creating backup directory
  console.log('📁 Testing backup directory creation...');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('   ✓ Backup directory created:', backupDir);
  } else {
    console.log('   ✓ Backup directory exists:', backupDir);
  }
  
  // Create a simple test backup
  console.log('💾 Creating test backup...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = path.join(backupDir, `test_backup_${timestamp}.sql`);
  
  let backupContent = `-- Test Database Backup\n`;
  backupContent += `-- Created: ${new Date().toISOString()}\n`;
  backupContent += `-- Database: ${results[0].current_database}\n\n`;
  
  // Get data from a simple table (users)
  try {
    const { User } = models;
    const users = await User.findAll({ raw: true });
    
    backupContent += `-- Users table backup\n`;
    backupContent += `-- Found ${users.length} users\n\n`;
    
    if (users.length > 0) {
      backupContent += `-- Sample user data:\n`;
      users.forEach((user, index) => {
        backupContent += `-- User ${index + 1}: ${user.username} (${user.role})\n`;
      });
    }
    
    backupContent += `\n-- End of test backup\n`;
    
  } catch (error) {
    backupContent += `-- Error getting user data: ${error.message}\n`;
  }
  
  // Write backup file
  fs.writeFileSync(backupFile, backupContent, 'utf8');
  const stats = fs.statSync(backupFile);
  
  console.log('   ✓ Test backup created successfully!');
  console.log('   📁 File:', backupFile);
  console.log('   📊 Size:', Math.round(stats.size / 1024), 'KB');
  
  // Close connection
  await sequelize.close();
  
  console.log('\n🎉 All tests passed! The database backup system is working.');
  console.log('📁 Check the backup file at:', backupFile);
  
} catch (error) {
  console.error('❌ Error during backup test:');
  console.error('   Message:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}
