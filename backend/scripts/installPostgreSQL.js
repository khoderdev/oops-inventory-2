import { exec } from "child_process";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from 'path';
import { promisify } from "util";
import os from "os";
import open from 'open';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🐘 PostgreSQL Installation Helper");
console.log("================================");

// Check if PostgreSQL is already installed
async function checkPostgreSQL() {
  const platform = os.platform();
  const pgDumpCmd = platform === 'win32' ? 'pg_dump.exe' : 'pg_dump';
  
  try {
    const { stdout } = await execAsync(`${pgDumpCmd} --version`);
    console.log(`✅ PostgreSQL is already installed: ${stdout.trim()}`);
    return true;
  } catch (error) {
    console.log("❌ PostgreSQL not found in PATH");
    
    // Check common installation directories
    const commonPaths = platform === 'win32' ? [
      "C:\\Program Files\\PostgreSQL\\17\\bin",
      "C:\\Program Files\\PostgreSQL\\16\\bin",
      "C:\\Program Files\\PostgreSQL\\15\\bin",
      "C:\\Program Files\\PostgreSQL\\14\\bin",
      "C:\\Program Files\\PostgreSQL\\13\\bin"
    ] : [
      "/usr/bin",
      "/usr/local/bin",
      "/usr/local/pgsql/bin",
      "/opt/postgresql/bin"
    ];
    
    for (const binPath of commonPaths) {
      const pgDumpPath = path.join(binPath, pgDumpCmd);
      if (fs.existsSync(pgDumpPath)) {
        console.log(`✅ PostgreSQL found at: ${binPath}`);
        console.log(`⚠️ But it's not in your PATH environment variable`);
        return { installed: true, binPath };
      }
    }
    
    return false;
  }
}

// Download PostgreSQL installer
async function downloadInstaller() {
  const platform = os.platform();
  let downloadUrl;
  let installerPath;
  
  if (platform === 'win32') {
    downloadUrl = "https://www.enterprisedb.com/postgresql-download-windows-installer";
    console.log(`🌐 Opening PostgreSQL download page in your browser...`);
    await open(downloadUrl);
    
    console.log("\n📋 Installation Instructions:");
    console.log("1. Download the PostgreSQL installer for Windows");
    console.log("2. Run the installer and follow the prompts");
    console.log("3. ⚠️ IMPORTANT: Make sure to check 'Command Line Tools' during installation");
    console.log("4. Add PostgreSQL bin directory to your PATH environment variable:");
    console.log("   - Right-click on 'This PC' > Properties > Advanced system settings > Environment Variables");
    console.log("   - Edit the PATH variable and add: C:\\Program Files\\PostgreSQL\\[VERSION]\\bin");
    console.log("5. Restart your terminal/command prompt");
    console.log("6. Test by running: pg_dump --version");
  } else if (platform === 'darwin') {
    console.log("\n📋 macOS Installation Instructions:");
    console.log("1. Install PostgreSQL using Homebrew:");
    console.log("   brew install postgresql");
    console.log("2. Start PostgreSQL service:");
    console.log("   brew services start postgresql");
    console.log("3. Test by running: pg_dump --version");
  } else {
    console.log("\n📋 Linux Installation Instructions:");
    console.log("Ubuntu/Debian:");
    console.log("   sudo apt update");
    console.log("   sudo apt install postgresql postgresql-client");
    console.log("CentOS/RHEL:");
    console.log("   sudo yum install postgresql postgresql-server");
    console.log("   sudo postgresql-setup initdb");
    console.log("   sudo systemctl enable postgresql");
    console.log("   sudo systemctl start postgresql");
    console.log("Fedora:");
    console.log("   sudo dnf install postgresql postgresql-server");
    console.log("   sudo postgresql-setup initdb");
    console.log("   sudo systemctl enable postgresql");
    console.log("   sudo systemctl start postgresql");
  }
  
  console.log("\n🔄 After installation, run the backup script again");
}

// Main function
async function main() {
  const pgInstalled = await checkPostgreSQL();
  
  if (pgInstalled === true) {
    console.log("✅ PostgreSQL is properly installed and in your PATH");
    console.log("🎉 You can now run database backups");
  } else if (pgInstalled && pgInstalled.installed) {
    console.log(`\n⚠️ PostgreSQL is installed at ${pgInstalled.binPath} but not in your PATH`);
    console.log("\n📋 To add PostgreSQL to your PATH:");
    
    if (os.platform() === 'win32') {
      console.log("1. Right-click on 'This PC' > Properties > Advanced system settings > Environment Variables");
      console.log(`2. Edit the PATH variable and add: ${pgInstalled.binPath}`);
      console.log("3. Restart your terminal/command prompt");
    } else {
      console.log(`1. Add this line to your ~/.bashrc or ~/.zshrc file:`);
      console.log(`   export PATH="${pgInstalled.binPath}:$PATH"`);
      console.log("2. Restart your terminal or run: source ~/.bashrc");
    }
    
    console.log("\n🔄 After updating your PATH, run the backup script again");
  } else {
    console.log("❌ PostgreSQL is not installed on this system");
    await downloadInstaller();
  }
}

// Run the main function
main().catch(error => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});
