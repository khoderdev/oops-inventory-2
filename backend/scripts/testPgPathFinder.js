import { findPostgreSQLPath } from './pgPathFinder.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test script for PostgreSQL path finder
 * This script tests the PostgreSQL path finder and verifies that pg_dump can be found and executed
 */

async function testPgDump(pgDumpPath, pgDumpExecutable) {
  const pgDumpFullPath = pgDumpPath ? path.join(pgDumpPath, pgDumpExecutable) : pgDumpExecutable;
  
  try {
    console.log(`🧪 Testing pg_dump at: ${pgDumpFullPath}`);
    const { stdout } = await execAsync(`"${pgDumpFullPath}" --version`);
    console.log(`✅ pg_dump test successful: ${stdout.trim()}`);
    return { success: true, version: stdout.trim() };
  } catch (error) {
    console.error(`❌ pg_dump test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testConfigFile() {
  const configPath = path.join(__dirname, '..', 'config', 'pgPath.json');
  
  try {
    if (fs.existsSync(configPath)) {
      console.log(`📋 Found configuration file: ${configPath}`);
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`📊 Configuration data:`, JSON.stringify(configData, null, 2));
      return { exists: true, data: configData };
    } else {
      console.log(`⚠️ Configuration file not found: ${configPath}`);
      return { exists: false };
    }
  } catch (error) {
    console.error(`❌ Error reading configuration file: ${error.message}`);
    return { exists: false, error: error.message };
  }
}

async function main() {
  console.log('🧪 PostgreSQL Path Finder Test');
  console.log('=============================');
  
  try {
    // Test 1: Check if configuration file exists
    console.log('\n📋 Test 1: Checking configuration file...');
    const configResult = await testConfigFile();
    
    // Test 2: Run path finder
    console.log('\n🔍 Test 2: Running path finder...');
    const pgInfo = await findPostgreSQLPath();
    console.log(`📊 Path finder result:`, JSON.stringify(pgInfo, null, 2));
    
    // Test 3: Test pg_dump with found path
    console.log('\n🧪 Test 3: Testing pg_dump with found path...');
    const pgDumpTest = await testPgDump(pgInfo.binPath, pgInfo.executable);
    
    // Summary
    console.log('\n📝 Test Summary:');
    console.log(`Configuration file: ${configResult.exists ? '✅ Found' : '❌ Not found'}`);
    console.log(`PostgreSQL path: ${pgInfo.binPath ? '✅ Found at ' + pgInfo.binPath : (pgInfo.inPath ? '✅ Found in PATH' : '❌ Not found')}`);
    console.log(`pg_dump test: ${pgDumpTest.success ? '✅ Success' : '❌ Failed'}`);
    
    if (pgDumpTest.success) {
      console.log('\n✅ All tests passed! The PostgreSQL path finder is working correctly.');
      console.log('You can now use the backup functionality.');
    } else {
      console.log('\n❌ Tests failed! Please check the error messages above.');
      console.log('Make sure PostgreSQL is installed and pg_dump is available.');
    }
  } catch (error) {
    console.error(`\n❌ Test failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`❌ Fatal error: ${error.message}`);
  process.exit(1);
});
