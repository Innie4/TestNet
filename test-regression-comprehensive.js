/**
 * Comprehensive Regression Test Suite
 * Tests all critical functionality for wallet connection and balance fetching
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  contractAddress: '0xc98cf0876b23fb1f574be5c59e4217c80b34d327',
  bscChainId: 56,
  bscRpcUrl: 'https://bsc-dataseed.binance.org/',
};

// Test results
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
};

// Helper function to log test results
function logTest(name, passed, message = '') {
  const result = { name, passed, message, timestamp: new Date().toISOString() };
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ PASS: ${name}${message ? ` - ${message}` : ''}`);
  } else {
    testResults.failed.push(result);
    console.error(`❌ FAIL: ${name}${message ? ` - ${message}` : ''}`);
  }
}

function logWarning(name, message) {
  testResults.warnings.push({ name, message, timestamp: new Date().toISOString() });
  console.warn(`⚠️  WARN: ${name} - ${message}`);
}

// Test 1: Check critical files exist
function testFileExistence() {
  console.log('\n📁 Testing File Existence...');
  
  const criticalFiles = [
    'app/page.tsx',
    'lib/coinbaseWallet.ts',
    'lib/tethToken.ts',
    'lib/constants.ts',
    'lib/priceFetcher.ts',
    'components/WalletAuthorization.tsx',
    'components/WalletConnecting.tsx',
    'package.json',
    'next.config.js',
    'tsconfig.json',
  ];

  criticalFiles.forEach(file => {
    // Try multiple path resolutions
    const paths = [
      path.join(process.cwd(), file),
      path.join(__dirname, file),
      file,
    ];
    const exists = paths.some(p => fs.existsSync(p));
    logTest(`File exists: ${file}`, exists, exists ? '' : 'File not found');
  });
}

// Test 2: Check package.json dependencies
function testDependencies() {
  console.log('\n📦 Testing Dependencies...');
  
  try {
    const packageJsonPath = fs.existsSync('package.json') ? 'package.json' : path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = [
      '@coinbase/wallet-sdk',
      'ethers',
      'next',
      'react',
      'react-dom',
    ];
    
    requiredDeps.forEach(dep => {
      const hasDep = (packageJson.dependencies && packageJson.dependencies[dep]) || 
                     (packageJson.devDependencies && packageJson.devDependencies[dep]);
      logTest(`Dependency: ${dep}`, !!hasDep, hasDep ? `v${hasDep}` : 'Missing');
    });
  } catch (err) {
    logTest('package.json parsing', false, err.message);
  }
}

// Test 3: Check TypeScript configuration
function testTypeScriptConfig() {
  console.log('\n🔧 Testing TypeScript Configuration...');
  
  try {
    const tsconfigPath = fs.existsSync('tsconfig.json') ? 'tsconfig.json' : path.join(__dirname, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Check critical compiler options
    const checks = [
      { name: 'strict mode', value: tsconfig.compilerOptions?.strict === true },
      { name: 'ES module interop', value: tsconfig.compilerOptions?.esModuleInterop === true },
      { name: 'paths alias', value: !!tsconfig.compilerOptions?.paths?.['@/*'] },
    ];
    
    checks.forEach(check => {
      logTest(`TSConfig: ${check.name}`, check.value);
    });
  } catch (err) {
    logTest('tsconfig.json parsing', false, err.message);
  }
}

// Test 4: Check critical code patterns
function testCodePatterns() {
  console.log('\n🔍 Testing Code Patterns...');
  
  try {
    const getFilePath = (file) => {
      const paths = [file, path.join(__dirname, file), path.join(process.cwd(), file)];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return file; // Return original if none found, will throw error
    };
    const pageContent = fs.readFileSync(getFilePath('app/page.tsx'), 'utf8');
    const walletContent = fs.readFileSync(getFilePath('lib/coinbaseWallet.ts'), 'utf8');
    const tokenContent = fs.readFileSync(getFilePath('lib/tethToken.ts'), 'utf8');
    
    // Check for critical patterns
    const patterns = [
      {
        name: 'isMountedRef check in state updates',
        pattern: /isMountedRef\.current/,
        file: pageContent,
        critical: true,
      },
      {
        name: 'balanceFetchInProgressRef to prevent race conditions',
        pattern: /balanceFetchInProgressRef/,
        file: pageContent,
        critical: true,
      },
      {
        name: 'Provider ready check',
        pattern: /provider\.ready/,
        file: tokenContent,
        critical: true,
      },
      {
        name: 'Network verification (chainId === 56)',
        pattern: /chainId.*56|56.*chainId/,
        file: pageContent,
        critical: true,
      },
      {
        name: 'Error handling in balance fetch',
        pattern: /catch.*balance|balance.*catch/,
        file: tokenContent,
        critical: true,
      },
      {
        name: 'Retry logic in balance fetch',
        pattern: /retry|attempts|maxAttempts/,
        file: tokenContent,
        critical: true,
      },
      {
        name: 'Event listener cleanup',
        pattern: /cleanupEventListeners|removeListener/,
        file: pageContent,
        critical: true,
      },
      {
        name: 'Coinbase Smart Wallet SDK initialization',
        pattern: /CoinbaseWalletSDK|makeWeb3Provider/,
        file: walletContent,
        critical: true,
      },
      {
        name: 'Address normalization',
        pattern: /getAddress|normalizedAddress/,
        file: tokenContent,
        critical: true,
      },
      {
        name: 'BSC network configuration',
        pattern: /BSC_NETWORK|chainId.*0x38|56/,
        file: pageContent,
        critical: true,
      },
    ];
    
    patterns.forEach(({ name, pattern, file, critical }) => {
      const found = pattern.test(file);
      if (critical) {
        logTest(`Code pattern: ${name}`, found, found ? '' : 'Pattern not found');
      } else {
        if (!found) logWarning(`Code pattern: ${name}`, 'Pattern not found (non-critical)');
      }
    });
  } catch (err) {
    logTest('Code pattern analysis', false, err.message);
  }
}

// Test 5: Check constants
function testConstants() {
  console.log('\n📋 Testing Constants...');
  
  try {
    const getFilePath = (file) => {
      const paths = [file, path.join(__dirname, file), path.join(process.cwd(), file)];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return file;
    };
    const constantsContent = fs.readFileSync(getFilePath('lib/constants.ts'), 'utf8');
    
    const checks = [
      {
        name: 'TETH contract address',
        pattern: /0xc98cf0876b23fb1f574be5c59e4217c80b34d327/,
        found: constantsContent.includes('0xc98cf0876b23fb1f574be5c59e4217c80b34d327'),
      },
      {
        name: 'BSC chain ID (56)',
        pattern: /chainId.*56|56.*chainId/,
        found: constantsContent.includes('56') || constantsContent.includes('0x38'),
      },
      {
        name: 'ERC20 ABI functions',
        pattern: /balanceOf|decimals|symbol|name/,
        found: /balanceOf|decimals|symbol|name/.test(constantsContent),
      },
    ];
    
    checks.forEach(check => {
      logTest(`Constant: ${check.name}`, check.found);
    });
  } catch (err) {
    logTest('Constants file check', false, err.message);
  }
}

// Test 6: Check error handling
function testErrorHandling() {
  console.log('\n🛡️  Testing Error Handling...');
  
  try {
    const getFilePath = (file) => {
      const paths = [file, path.join(__dirname, file), path.join(process.cwd(), file)];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return file;
    };
    const pageContent = fs.readFileSync(getFilePath('app/page.tsx'), 'utf8');
    const tokenContent = fs.readFileSync(getFilePath('lib/tethToken.ts'), 'utf8');
    
    const errorChecks = [
      {
        name: 'Try-catch blocks in critical functions',
        pattern: /try\s*\{[\s\S]*catch/,
        file: pageContent,
      },
      {
        name: 'Error messages for users',
        pattern: /setError|errorMessage/,
        file: pageContent,
      },
      {
        name: 'Network error handling',
        pattern: /Wrong network|network.*error/i,
        file: tokenContent,
      },
      {
        name: 'Timeout handling',
        pattern: /timeout|Promise\.race/,
        file: tokenContent,
      },
    ];
    
    errorChecks.forEach(check => {
      const found = check.pattern.test(check.file);
      logTest(`Error handling: ${check.name}`, found);
    });
  } catch (err) {
    logTest('Error handling check', false, err.message);
  }
}

// Test 7: Check connection flow
function testConnectionFlow() {
  console.log('\n🔌 Testing Connection Flow...');
  
  try {
    const getFilePath = (file) => {
      const paths = [file, path.join(__dirname, file), path.join(process.cwd(), file)];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return file;
    };
    const pageContent = fs.readFileSync(getFilePath('app/page.tsx'), 'utf8');
    
    const flowChecks = [
      {
        name: 'Authorization step',
        pattern: /authorization|WalletAuthorization/,
      },
      {
        name: 'Connecting step',
        pattern: /connecting|WalletConnecting/,
      },
      {
        name: 'Network switching',
        pattern: /switching|switchToBSC/,
      },
      {
        name: 'Balance fetching step',
        pattern: /fetching|fetchBalance/,
      },
      {
        name: 'Connected state',
        pattern: /connected|isConnected/,
      },
      {
        name: 'eth_requestAccounts call',
        pattern: /eth_requestAccounts/,
      },
      {
        name: 'Network switch request',
        pattern: /wallet_switchEthereumChain|wallet_addEthereumChain|switchToBSC/,
      },
    ];
    
    flowChecks.forEach(check => {
      const found = check.pattern.test(pageContent);
      logTest(`Connection flow: ${check.name}`, found);
    });
  } catch (err) {
    logTest('Connection flow check', false, err.message);
  }
}

// Test 8: Check balance fetching logic
function testBalanceFetching() {
  console.log('\n💰 Testing Balance Fetching Logic...');
  
  try {
    const getFilePath = (file) => {
      const paths = [file, path.join(__dirname, file), path.join(process.cwd(), file)];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return file;
    };
    const tokenContent = fs.readFileSync(getFilePath('lib/tethToken.ts'), 'utf8');
    const pageContent = fs.readFileSync(getFilePath('app/page.tsx'), 'utf8');
    
    const balanceChecks = [
      {
        name: 'getTETHBalance function',
        pattern: /getTETHBalance/,
        file: tokenContent,
      },
      {
        name: 'callStatic.balanceOf usage',
        pattern: /callStatic\.balanceOf/,
        file: tokenContent,
      },
      {
        name: 'Balance formatting',
        pattern: /formatUnits|balanceFormatted/,
        file: tokenContent,
      },
      {
        name: 'Address normalization',
        pattern: /getAddress.*userAddress|normalizedAddress/,
        file: tokenContent,
      },
      {
        name: 'Balance display logic',
        pattern: /balanceFormatted|parseFloat.*balance/,
        file: pageContent,
      },
      {
        name: 'Zero balance handling',
        pattern: /balance.*0|0.*balance|isZero/,
        file: pageContent,
      },
    ];
    
    balanceChecks.forEach(check => {
      const found = check.pattern.test(check.file);
      logTest(`Balance fetching: ${check.name}`, found);
    });
  } catch (err) {
    logTest('Balance fetching check', false, err.message);
  }
}

// Test 9: Check state management
function testStateManagement() {
  console.log('\n📊 Testing State Management...');
  
  try {
    const getFilePath = (file) => {
      const paths = [file, path.join(__dirname, file), path.join(process.cwd(), file)];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return file;
    };
    const pageContent = fs.readFileSync(getFilePath('app/page.tsx'), 'utf8');
    
    const stateChecks = [
      {
        name: 'useState hooks for critical state',
        pattern: /useState.*\(.*account|useState.*\(.*balance|useState.*\(.*isConnected|useState.*\(.*isBSC/,
      },
      {
        name: 'useRef for mount tracking',
        pattern: /useRef.*isMounted|isMountedRef/,
      },
      {
        name: 'useRef for race condition prevention',
        pattern: /useRef.*balanceFetch|balanceFetchInProgressRef/,
      },
      {
        name: 'useEffect cleanup',
        pattern: /return.*\(\)|clearInterval|clearTimeout|removeListener/,
      },
      {
        name: 'State updates with mount check',
        pattern: /isMountedRef\.current.*\&\&.*set|if.*isMountedRef\.current/,
      },
    ];
    
    stateChecks.forEach(check => {
      const found = check.pattern.test(pageContent);
      logTest(`State management: ${check.name}`, found);
    });
  } catch (err) {
    logTest('State management check', false, err.message);
  }
}

// Test 10: Check Next.js configuration
function testNextConfig() {
  console.log('\n⚙️  Testing Next.js Configuration...');
  
  try {
    const getFilePath = (file) => {
      const paths = [file, path.join(__dirname, file), path.join(process.cwd(), file)];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return null;
    };
    const nextConfigPath = getFilePath('next.config.js');
    const nextConfigExists = !!nextConfigPath;
    logTest('next.config.js exists', nextConfigExists);
    
    if (nextConfigExists && nextConfigPath) {
      const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
      const hasWebpackConfig = /webpack/.test(nextConfigContent);
      logTest('Webpack fallback configuration', hasWebpackConfig);
    }
  } catch (err) {
    logTest('Next.js config check', false, err.message);
  }
}

// Run all tests
function runAllTests() {
  console.log('🧪 Starting Comprehensive Regression Test Suite\n');
  console.log('='.repeat(60));
  
  testFileExistence();
  testDependencies();
  testTypeScriptConfig();
  testCodePatterns();
  testConstants();
  testErrorHandling();
  testConnectionFlow();
  testBalanceFetching();
  testStateManagement();
  testNextConfig();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    testResults.warnings.forEach(warning => {
      console.log(`   - ${warning.name}: ${warning.message}`);
    });
  }
  
  // Exit with appropriate code
  const exitCode = testResults.failed.length > 0 ? 1 : 0;
  console.log(`\n${exitCode === 0 ? '✅' : '❌'} Test suite ${exitCode === 0 ? 'PASSED' : 'FAILED'}\n`);
  
  return exitCode;
}

// Run tests if executed directly
if (require.main === module) {
  const exitCode = runAllTests();
  process.exit(exitCode);
}

module.exports = { runAllTests, testResults };

