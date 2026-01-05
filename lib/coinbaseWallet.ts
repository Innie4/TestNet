import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

// Initialize Coinbase Wallet SDK instance (singleton)
let coinbaseWalletSDK: CoinbaseWalletSDK | null = null;

// Initialize Coinbase Wallet SDK
// Configured to ONLY use Smart Wallet, NEVER browser extension
const initializeSDK = (): CoinbaseWalletSDK => {
  if (!coinbaseWalletSDK) {
    coinbaseWalletSDK = new CoinbaseWalletSDK({
      appName: 'Tethereum Project',
      appLogoUrl: 'https://tethereum.com/logo.png',
      darkMode: false,
      // Force Smart Wallet connection, disable browser extension
      overrideIsMetaMask: false,
      overrideIsCoinbaseWallet: false,
    });
  }
  return coinbaseWalletSDK;
};

// Check if Coinbase Wallet extension is installed
export const isCoinbaseWalletInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Coinbase Wallet extension
  const ethereum = (window as any).ethereum;
  if (ethereum && ethereum.isCoinbaseWallet) {
    return true;
  }
  
  // Check for Coinbase Wallet in providers array
  if (ethereum && ethereum.providers) {
    return ethereum.providers.some((provider: any) => provider.isCoinbaseWallet);
  }
  
  return false;
};

// Detect wallet connection method
export const getWalletConnectionMethod = (): 'extension' | 'mobile' | 'unknown' => {
  if (typeof window === 'undefined') return 'unknown';
  
  const ethereum = (window as any).ethereum;
  
  // Check for extension
  if (ethereum?.isCoinbaseWallet) {
    return 'extension';
  }
  
  if (ethereum?.providers && Array.isArray(ethereum.providers)) {
    const hasCoinbase = ethereum.providers.some((provider: any) => provider.isCoinbaseWallet);
    if (hasCoinbase) {
      return 'extension';
    }
  }
  
  // Check if standard ethereum provider exists (could be extension)
  if (ethereum && ethereum.request) {
    // Try to detect Coinbase Wallet by checking for specific methods
    if (ethereum.isCoinbaseWallet === false) {
      // Explicitly not Coinbase, might be MetaMask or other
      return 'unknown';
    }
    // Could be Coinbase Wallet extension without the flag
    return 'extension';
  }
  
  // No extension detected, will use mobile SDK
  return 'mobile';
};

// Store the SDK provider instance
let sdkProviderInstance: any = null;

// Function to reset provider instance (for cleanup/disconnect)
export const resetProviderInstance = () => {
  console.log('Resetting SDK provider instance');
  sdkProviderInstance = null;
};

// Get the Ethereum provider from Coinbase Wallet
// ALWAYS uses Coinbase Smart Wallet SDK (NEVER browser extension)
// This ensures connection goes through Coinbase Smart Wallet, not browser popups
export const getCoinbaseProvider = () => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  // If we already have a provider instance, reuse it
  if (sdkProviderInstance) {
    console.log('Reusing existing Coinbase Smart Wallet SDK provider');
    return sdkProviderInstance;
  }

  // CRITICAL: Completely block browser extension
  // Store original ethereum to restore later if needed
  const originalEthereum = (window as any).ethereum;
  const hadEthereum = !!originalEthereum;
  
  // Remove window.ethereum completely to force SDK-only
  if (hadEthereum) {
    console.log('Blocking browser extension (window.ethereum)');
    delete (window as any).ethereum;
  }

  try {
    // ALWAYS use Coinbase Wallet SDK to target Smart Wallet
    console.log('=== INITIALIZING Coinbase Smart Wallet SDK ===');
    console.log('Browser extension blocked, using Smart Wallet SDK only');
    
    const sdk = initializeSDK();
    
    // Create Web3 provider for BSC
    // The SDK will connect through Coinbase Smart Wallet (not browser)
    const provider = sdk.makeWeb3Provider(
      "https://bsc-dataseed.binance.org/",
      56 // BSC chain ID
    );

    // Store the provider instance
    sdkProviderInstance = provider;
    
    console.log('✅ Coinbase Smart Wallet SDK provider created');
    console.log('Provider type:', provider.constructor.name);
    console.log('Provider has request method:', typeof provider.request === 'function');
    
    // Restore original ethereum after provider is created
    // The SDK provider is already initialized, so it won't use browser extension
    if (hadEthereum) {
      (window as any).ethereum = originalEthereum;
      console.log('Restored window.ethereum (SDK provider already created)');
    }
    
    return provider;
  } catch (error: any) {
    console.error('Error creating SDK provider:', error);
    // Restore original ethereum on error
    if (hadEthereum) {
      (window as any).ethereum = originalEthereum;
    }
    throw new Error(`Failed to initialize Coinbase Smart Wallet: ${error.message}`);
  }
};

// Get connection method info for UI display
export const getConnectionInfo = () => {
  const method = getWalletConnectionMethod();
  const hasExtension = isCoinbaseWalletInstalled();
  
  return {
    method,
    hasExtension,
    supportsExtension: true,
    supportsMobile: true,
    message: hasExtension 
      ? 'Coinbase Wallet extension detected. Click to connect.'
      : 'No extension detected. We\'ll connect via Coinbase Wallet mobile app or website.'
  };
};

