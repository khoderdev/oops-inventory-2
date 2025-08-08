#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'controllers/employeeSettlementController.js');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('🔧 Fixing syntax errors in employeeSettlementController.js...');
  
  // Fix missing commas before required: false
  content = content.replace(
    /attributes: \["firstName", "lastName", "username"\]\s*\n(\s+)required: false/g,
    'attributes: ["firstName", "lastName", "username"],\n$1required: false'
  );
  
  // Fix duplicate required: false lines
  content = content.replace(
    /required: false[^\n]*\n\s*},?\s*\n\s*required: false[^\n]*\n\s*}/g,
    'required: false // LEFT JOIN - include employees without users\n        }'
  );
  
  // Fix any remaining syntax issues with User includes
  content = content.replace(
    /(\s+attributes: \["firstName", "lastName", "username"\])\s*\n(\s+required: false[^\n]*)\s*\n(\s+})/g,
    '$1,\n$2\n$3'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed syntax errors in employeeSettlementController.js');
  
  // Verify syntax
  const { execSync } = await import('child_process');
  try {
    execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
    console.log('✅ Syntax validation passed');
  } catch (error) {
    console.error('❌ Syntax errors still exist:', error.stdout?.toString() || error.message);
  }
  
} catch (error) {
  console.error('❌ Error fixing syntax:', error.message);
  process.exit(1);
}
