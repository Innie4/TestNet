/**
 * Regression Test Suite for Tethereum Coinbase Wallet Integration
 * Run with: node test-regression.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Regression Tests...\n');

const tests = [];
let passed = 0;
let failed = 0;

// Test 1: Check if required files exist
function testFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  tests.push({ name: description, passed: exists });
  if (exists) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    failed++;
  }
}

// Test 2: Check if package.json has required dependencies
function testDependencies() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@coinbase/wallet-sdk',
    'ethers',
    'next',
    'react',
    'react-dom'
  ];
  
  const missing = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missing.length === 0) {
    console.log('✅ All required dependencies are present');
    passed++;
  } else {
    console.log(`❌ Missing dependencies: ${missing.join(', ')}`);
    failed++;
  }
}

// Test 3: Check if TypeScript config is valid
function testTypeScriptConfig() {
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
      console.log('✅ TypeScript configuration is valid');
      passed++;
    } else {
      console.log('❌ TypeScript configuration is invalid');
      failed++;
    }
  } catch (error) {
    console.log(`❌ TypeScript configuration error: ${error.message}`);
    failed++;
  }
}

// Test 4: Check if lib files exist and export required functions
function testLibFiles() {
  const libFiles = [
    'lib/coinbaseWallet.ts',
    'lib/constants.ts',
    'lib/tethToken.ts',
    'lib/priceFetcher.ts'
  ];
  
  libFiles.forEach(file => {
    const exists = fs.existsSync(file);
    if (exists) {
      const content = fs.readFileSync(file, 'utf8');
      // Basic check - file should export something
      if (content.includes('export')) {
        console.log(`✅ ${file} exists and exports functions`);
        passed++;
      } else {
        console.log(`⚠️  ${file} exists but may not export functions`);
      }
    } else {
      console.log(`❌ ${file} not found`);
      failed++;
    }
  });
}

// Test 5: Check if app structure is correct
function testAppStructure() {
  const appFiles = [
    'app/layout.tsx',
    'app/page.tsx',
    'app/globals.css'
  ];
  
  appFiles.forEach(file => {
    testFileExists(file, `App file exists: ${file}`);
  });
}

// Test 6: Check if components exist
function testComponents() {
  const componentFiles = [
    'components/WalletAuthorization.tsx',
    'components/WalletConnecting.tsx'
  ];
  
  componentFiles.forEach(file => {
    testFileExists(file, `Component file exists: ${file}`);
  });
}

// Run all tests
console.log('📁 Testing file structure...\n');
testFileExists('package.json', 'package.json exists');
testFileExists('tsconfig.json', 'tsconfig.json exists');
testFileExists('next.config.js', 'next.config.js exists');
testFileExists('.gitignore', '.gitignore exists');
testFileExists('README.md', 'README.md exists');

console.log('\n📦 Testing dependencies...\n');
testDependencies();

console.log('\n⚙️  Testing configuration...\n');
testTypeScriptConfig();

console.log('\n📚 Testing library files...\n');
testLibFiles();

console.log('\n📱 Testing app structure...\n');
testAppStructure();

console.log('\n🧩 Testing components...\n');
testComponents();

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All regression tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the output above.');
  process.exit(1);
}

