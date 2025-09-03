#!/usr/bin/env node

// Simple test runner for the backend services
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Backend Service Tests...\n');

// Try to run vitest
const testProcess = spawn('npx', ['vitest', 'run', 'backend/tests', '--reporter=verbose'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log(`\n❌ Tests failed with exit code ${code}`);
  }
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('❌ Failed to run tests:', error.message);
  console.log('\n📝 Manual Test Instructions:');
  console.log('1. Install vitest: npm install --save-dev vitest');
  console.log('2. Run tests: npx vitest run backend/tests');
  console.log('3. Or run specific test: npx vitest run backend/tests/stockCalculationService.test.js');
  process.exit(1);
});
