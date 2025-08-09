#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'controllers/employeeSettlementController.js');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix all remaining User model includes that don't have required: false
  let fixCount = 0;
  
  // Split content into lines for easier processing
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find lines with User attributes that don't have required: false on the next line
    if (line.includes('attributes: ["firstName", "lastName", "username"]')) {
      // Check if the next few lines already have required: false
      let hasRequired = false;
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        if (lines[j].includes('required: false')) {
          hasRequired = true;
          break;
        }
        if (lines[j].includes('}')) {
          break; // End of this include block
        }
      }
      
      // If no required: false found, add it
      if (!hasRequired) {
        // Find the closing brace for this User include
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].match(/^\s+}/) && !lines[j].includes('required:')) {
            // Insert required: false before the closing brace
            const indent = lines[j].match(/^(\s+)/)[1]; // Get the indentation
            lines.splice(j, 0, `${indent}  required: false // LEFT JOIN - include employees without users`);
            fixCount++;
            console.log(`✅ Fixed User include at line ${i + 1}`);
            break;
          }
        }
      }
    }
  }
  
  content = lines.join('\n');

  if (fixCount > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Successfully updated employeeSettlementController.js`);
    console.log(`📝 Added required: false to ${fixCount} User model includes`);
  } else {
    console.log('ℹ️  No changes needed - all User includes already have required: false');
  }

} catch (error) {
  console.error('❌ Error fixing settlement controller:', error.message);
  process.exit(1);
}
