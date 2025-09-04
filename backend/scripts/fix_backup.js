const fs = require('fs').promises;
const path = require('path');
const fsExtra = require('fs-extra');

async function fixBackupFile() {
  try {
    // Use the most recent backup directory
    const backupDirs = await fs.readdir(path.join(__dirname, '..', 'backups'));
    const latestBackupDir = backupDirs
      .filter(dir => dir.startsWith('pgdump_'))
      .sort()
      .pop();
      
    if (!latestBackupDir) {
      throw new Error('No backup directories found in the backups folder');
    }
    
    const backupDir = path.join(__dirname, '..', 'backups', latestBackupDir);
    const inputFile = path.join(backupDir, 'backup.sql');
    const outputFile = path.join(backupDir, 'fixed_backup.sql');
    
    console.log('🔍 Checking backup directory...');
    const dirExists = await fsExtra.pathExists(backupDir);
    if (!dirExists) {
      throw new Error(`Backup directory not found: ${backupDir}`);
    }
    
    console.log(`📂 Backup directory exists: ${backupDir}`);
    
    const fileExists = await fsExtra.pathExists(inputFile);
    if (!fileExists) {
      throw new Error(`Backup file not found: ${inputFile}`);
    }
    
    console.log(`📄 Found backup file: ${inputFile}`);
    console.log(`🔧 Reading backup file...`);
    
    // Read the file in chunks to handle large files
    const readStream = fs.createReadStream(inputFile, { encoding: 'utf8' });
    let content = '';
    
    for await (const chunk of readStream) {
      content += chunk;
    }
    
    console.log(`✅ Read ${content.length} characters from backup file`);
    
    // Fix 1: Remove problematic DO blocks that terminate connections
    console.log('🔧 Removing problematic DO blocks...');
    const doBlockPattern = /DO\s*\$[^$]*\$[^$]*\$\s*LANGUAGE\s+plpgsql\s*;/gs;
    content = content.replace(doBlockPattern, '');
    
    // Fix 2: Ensure proper transaction handling
    console.log('🔧 Adding transaction handling...');
    if (!content.startsWith('BEGIN;')) {
      content = 'BEGIN;\n' + content;
    }
    if (!content.trim().endsWith('COMMIT;')) {
      content = content.trim() + '\nCOMMIT;\n';
    }
    
    // Ensure output directory exists
    await fsExtra.ensureDir(path.dirname(outputFile));
    
    // Write the fixed content to a new file
    console.log(`💾 Writing fixed backup to: ${outputFile}`);
    await fs.writeFile(outputFile, content, 'utf8');
    
    // Verify the file was written
    const stats = await fs.stat(outputFile);
    console.log(`✅ Fixed backup saved successfully (${stats.size} bytes): ${outputFile}`);
    
    return outputFile;
  } catch (error) {
    console.error('❌ Error fixing backup file:');
    console.error(error.message);
    if (error.code) console.error(`Error code: ${error.code}`);
    if (error.path) console.error(`Path: ${error.path}`);
    throw error;
  }
}

// Install required dependencies if not already installed
async function ensureDependencies() {
  try {
    await fsExtra.access(path.join(__dirname, '..', 'node_modules', 'fs-extra'));
  } catch (error) {
    console.log('Installing required dependencies (fs-extra)...');
    const { execSync } = require('child_process');
    execSync('npm install fs-extra --save', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  }
}

// Run the fix
(async () => {
  try {
    await ensureDependencies();
    await fixBackupFile();
    console.log('✨ Backup fix completed successfully!');
  } catch (error) {
    console.error('❌ Backup fix failed');
    process.exit(1);
  }
})();
