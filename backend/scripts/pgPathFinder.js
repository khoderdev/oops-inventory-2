import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

/**
 * Advanced PostgreSQL Path Finder
 * 
 * This script helps find PostgreSQL installation paths across different operating systems
 * and provides detailed configuration for backup and restore operations.
 */

// Additional Windows PostgreSQL paths to check
const WINDOWS_ADDITIONAL_PATHS = [
  // Program Files paths for PostgreSQL 13-17
  "C:\\Program Files\\PostgreSQL\\17\\bin",
  "C:\\Program Files\\PostgreSQL\\16\\bin",
  "C:\\Program Files\\PostgreSQL\\15\\bin",
  "C:\\Program Files\\PostgreSQL\\14\\bin",
  "C:\\Program Files\\PostgreSQL\\13\\bin",
  
  // Program Files (x86) paths
  "C:\\Program Files (x86)\\PostgreSQL\\17\\bin",
  "C:\\Program Files (x86)\\PostgreSQL\\16\\bin",
  "C:\\Program Files (x86)\\PostgreSQL\\15\\bin",
  "C:\\Program Files (x86)\\PostgreSQL\\14\\bin",
  "C:\\Program Files (x86)\\PostgreSQL\\13\\bin",
  
  // EnterpriseDB paths
  "C:\\Program Files\\edb\\as17\\bin",
  "C:\\Program Files\\edb\\as16\\bin",
  "C:\\Program Files\\edb\\as15\\bin",
  
  // Cygwin/MSYS2 paths
  "C:\\cygwin64\\bin",
  "C:\\msys64\\usr\\bin",
  
  // Scoop paths
  `${os.homedir()}\\scoop\\apps\\postgresql\\current\\bin`,
  
  // Chocolatey paths
  "C:\\tools\\postgresql\\bin",
  
  // WSL paths (requires special handling)
  "C:\\Windows\\System32\\wsl.exe"
];

// Linux PostgreSQL paths to check
const LINUX_ADDITIONAL_PATHS = [
  "/usr/bin",
  "/usr/local/bin",
  "/usr/local/pgsql/bin",
  "/opt/postgresql/bin",
  "/usr/lib/postgresql/17/bin",
  "/usr/lib/postgresql/16/bin",
  "/usr/lib/postgresql/15/bin",
  "/usr/lib/postgresql/14/bin",
  "/usr/lib/postgresql/13/bin",
  "/opt/PostgreSQL/17/bin",
  "/opt/PostgreSQL/16/bin",
  "/opt/PostgreSQL/15/bin",
  "/opt/PostgreSQL/14/bin",
  "/opt/PostgreSQL/13/bin",
  "/opt/pgsql/bin",
  "/var/lib/postgresql/bin"
];

// macOS PostgreSQL paths to check
const MACOS_ADDITIONAL_PATHS = [
  "/usr/bin",
  "/usr/local/bin",
  "/usr/local/pgsql/bin",
  "/Applications/Postgres.app/Contents/Versions/latest/bin",
  "/Applications/Postgres.app/Contents/Versions/17/bin",
  "/Applications/Postgres.app/Contents/Versions/16/bin",
  "/Applications/Postgres.app/Contents/Versions/15/bin",
  "/Applications/Postgres.app/Contents/Versions/14/bin",
  "/Applications/Postgres.app/Contents/Versions/13/bin",
  "/opt/homebrew/bin",
  "/opt/homebrew/opt/postgresql/bin",
  "/usr/local/opt/postgresql/bin"
];

/**
 * Checks if a file exists
 */
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Tests if pg_dump is available at a specific path
 */
async function testPgDump(pgDumpPath) {
  try {
    const { stdout } = await execAsync(`"${pgDumpPath}" --version`);
    return { success: true, version: stdout.trim() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Tests if pg_dump is available in PATH
 */
async function testPgDumpInPath() {
  const platform = os.platform();
  const pgDumpCmd = platform === 'win32' ? 'pg_dump.exe' : 'pg_dump';
  
  try {
    const { stdout } = await execAsync(`${pgDumpCmd} --version`);
    return { success: true, version: stdout.trim(), inPath: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Main function to find PostgreSQL path
 * @param {boolean} writeConfig - Whether to write the config file (default: true)
 */
export async function findPostgreSQLPath(writeConfig = true) {
  const platform = os.platform();
  console.log(`🖥️  Detected OS: ${platform}`);
  
  // Paths to check based on platform
  let pathsToCheck = [];
  let pgDumpExecutable = '';
  
  if (platform === 'win32') {
    pathsToCheck = WINDOWS_ADDITIONAL_PATHS;
    pgDumpExecutable = 'pg_dump.exe';
  } else if (platform === 'darwin') {
    pathsToCheck = MACOS_ADDITIONAL_PATHS;
    pgDumpExecutable = 'pg_dump';
  } else {
    pathsToCheck = LINUX_ADDITIONAL_PATHS;
    pgDumpExecutable = 'pg_dump';
  }
  
  // First check if pg_dump is in PATH
  const pathResult = await testPgDumpInPath();
  if (pathResult.success) {
    console.log(`✅ Found pg_dump in PATH: ${pathResult.version}`);
    return { 
      binPath: '', 
      executable: platform === 'win32' ? 'pg_dump.exe' : 'pg_dump',
      version: pathResult.version,
      inPath: true
    };
  }
  
  // Check all possible paths
  for (const pgPath of pathsToCheck) {
    const pgDumpPath = path.join(pgPath, pgDumpExecutable);
    
    if (fileExists(pgDumpPath)) {
      console.log(`🔍 Found PostgreSQL at: ${pgPath}`);
      
      // Test if pg_dump works
      const testResult = await testPgDump(pgDumpPath);
      if (testResult.success) {
        console.log(`✅ pg_dump test successful: ${testResult.version}`);
        return { 
          binPath: pgPath, 
          executable: platform === 'win32' ? 'pg_dump.exe' : 'pg_dump',
          version: testResult.version,
          inPath: false
        };
      } else {
        console.log(`❌ pg_dump exists but test failed: ${testResult.error}`);
      }
    }
  }
  
  // If we get here, pg_dump was not found
  console.log('❌ pg_dump not found in any standard location');
  return { 
    binPath: '', 
    executable: platform === 'win32' ? 'pg_dump.exe' : 'pg_dump',
    version: null,
    inPath: false,
    notFound: true
  };
}

/**
 * Writes PostgreSQL path configuration to a file
 */
async function writePathConfig(pgInfo) {
  // Fix for Windows paths - use fileURLToPath to handle file:// URLs properly
  const __filename = new URL(import.meta.url).pathname;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const configPath = path.join(__dirname, '..', 'config', 'pgPath.json');
  
  const configData = {
    binPath: pgInfo.binPath,
    executable: pgInfo.executable,
    version: pgInfo.version,
    inPath: pgInfo.inPath,
    timestamp: new Date().toISOString(),
    platform: os.platform(),
    notFound: pgInfo.notFound || false
  };
  
  try {
    // Check if config file already exists and compare content
    if (fs.existsSync(configPath)) {
      try {
        const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Compare essential properties (ignore timestamp)
        if (existingConfig.binPath === configData.binPath && 
            existingConfig.executable === configData.executable &&
            existingConfig.version === configData.version &&
            existingConfig.platform === configData.platform) {
          // Config hasn't changed, no need to write
          console.log(`✅ PostgreSQL configuration unchanged, using existing file`);
          return true;
        }
      } catch (readError) {
        // If reading fails, proceed with writing new config
        console.log(`Could not read existing config: ${readError.message}`);
      }
    }
    
    // Ensure the directory exists
    const configDir = path.dirname(configPath);
    await fs.promises.mkdir(configDir, { recursive: true });
    
    // Only log when actually writing
    console.log(`Writing PostgreSQL configuration to: ${configPath}`);
    
    // Write the configuration file
    await fs.promises.writeFile(configPath, JSON.stringify(configData, null, 2));
    console.log(`✅ PostgreSQL path configuration written to: ${configPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to write configuration: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 PostgreSQL Path Finder');
  console.log('========================');
  
  try {
    const pgInfo = await findPostgreSQLPath();
    
    if (pgInfo.notFound) {
      console.log('\n❌ PostgreSQL not found!');
      console.log('\n📋 Installation Instructions:');
      
      const platform = os.platform();
      if (platform === 'win32') {
        console.log('1. Download PostgreSQL from: https://www.postgresql.org/download/windows/');
        console.log('2. During installation, make sure to select "Command Line Tools"');
        console.log('3. Add PostgreSQL bin directory to your PATH environment variable');
        console.log('   - Right-click on "This PC" > Properties > Advanced system settings > Environment Variables');
        console.log('   - Edit the PATH variable and add: C:\\Program Files\\PostgreSQL\\[VERSION]\\bin');
      } else if (platform === 'darwin') {
        console.log('1. Install PostgreSQL using Homebrew: brew install postgresql');
        console.log('2. Or download Postgres.app from: https://postgresapp.com/');
      } else {
        console.log('1. Install PostgreSQL using your package manager:');
        console.log('   - Ubuntu/Debian: sudo apt update && sudo apt install postgresql-client');
        console.log('   - CentOS/RHEL: sudo yum install postgresql');
        console.log('   - Fedora: sudo dnf install postgresql');
      }
      
      console.log('\n📋 After installation, run this script again to detect PostgreSQL.');
    } else {
      console.log('\n✅ PostgreSQL found!');
      console.log(`📍 Location: ${pgInfo.binPath || 'In PATH'}`);
      console.log(`📋 Version: ${pgInfo.version}`);
      
      // Write configuration for future use if requested
      if (writeConfig) {
        await writePathConfig(pgInfo);
      } else {
        console.log('⏭️ Skipping config write to prevent nodemon restart');
      }
      
      return pgInfo;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Only run the main function when this script is executed directly (not imported)
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(error => {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

// Export functions for use in other modules
export { testPgDump, testPgDumpInPath };
