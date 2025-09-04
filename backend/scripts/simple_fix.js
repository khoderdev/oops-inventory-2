const fs = require('fs').promises;
const path = require('path');

async function main() {
  try {
    console.log('Starting script...');
    
    // List all backup directories
    const backupPath = path.join(__dirname, '..', 'backups');
    console.log(`Looking for backups in: ${backupPath}`);
    
    const files = await fs.readdir(backupPath);
    console.log('Found directories:', files);
    
    // Find the most recent backup directory
    const backupDirs = files.filter(dir => dir.startsWith('pgdump_'));
    console.log('Backup directories:', backupDirs);
    
    if (backupDirs.length === 0) {
      console.error('No backup directories found!');
      return;
    }
    
    const latestBackupDir = backupDirs.sort().pop();
    console.log(`Using backup directory: ${latestBackupDir}`);
    
    const backupDir = path.join(backupPath, latestBackupDir);
    const inputFile = path.join(backupDir, 'backup.sql');
    const outputFile = path.join(backupDir, 'fixed_backup.sql');
    
    console.log(`Input file: ${inputFile}`);
    console.log(`Output file: ${outputFile}`);
    
    // Verify the input file exists
    try {
      await fs.access(inputFile);
      console.log('Backup file exists!');
      
      // Read the first 100 characters of the file
      const fileContent = await fs.readFile(inputFile, 'utf8');
      console.log('File size:', fileContent.length, 'characters');
      console.log('First 100 chars:', fileContent.substring(0, 100));
      
      // Create a simple fixed version
      let fixedContent = fileContent;
      
      // Remove problematic DO blocks
      fixedContent = fixedContent.replace(
        /DO\s*\$[^$]*\$[^$]*\$\s*LANGUAGE\s+plpgsql\s*;/gs, 
        ''
      );
      
      // Add transaction handling
      if (!fixedContent.startsWith('BEGIN;')) {
        fixedContent = 'BEGIN;\n' + fixedContent;
      }
      if (!fixedContent.trim().endsWith('COMMIT;')) {
        fixedContent = fixedContent.trim() + '\nCOMMIT;\n';
      }
      
      // Write the fixed file
      await fs.writeFile(outputFile, fixedContent, 'utf8');
      console.log(`✅ Fixed backup created at: ${outputFile}`);
      
    } catch (fileError) {
      console.error('Error accessing file:', fileError.message);
    }
    
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
main().then(() => console.log('Done!'));
