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

// Get the Ethereum provider from Coinbase Wallet
// ALWAYS uses Coinbase Smart Wallet SDK (NEVER browser extension)
// This ensures connection goes through Coinbase Smart Wallet, not browser popups
export const getCoinbaseProvider = () => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  // CRITICAL: Block any browser extension from being used
  // Remove window.ethereum temporarily to force SDK-only connection
  const originalEthereum = (window as any).ethereum;
  const originalProviders = (window as any).ethereum?.providers;
  
  // Temporarily hide browser extension to force Smart Wallet SDK
  if ((window as any).ethereum) {
    delete (window as any).ethereum;
  }

  try {
    // ALWAYS use Coinbase Wallet SDK to target Smart Wallet
    // This bypasses browser extension and connects directly to Coinbase Smart Wallet
    console.log('=== FORCING Coinbase Smart Wallet SDK Connection ===');
    console.log('Blocking browser extension, using Smart Wallet only');
    
    const sdk = initializeSDK();
    
    // Create Web3 provider for BSC
    // The SDK will:
    // - Use Coinbase Smart Wallet ONLY (not browser extension)
    // - Mobile: Deep linking to Coinbase Wallet app
    // - Desktop: QR code for mobile wallet scanning or Smart Wallet connection
    const provider = sdk.makeWeb3Provider(
      "https://bsc-dataseed.binance.org/",
      56 // BSC chain ID
    );

    console.log('✅ Using Coinbase Smart Wallet SDK provider (NOT browser extension)');
    
    // Restore original ethereum (for other uses, but SDK provider is already created)
    if (originalEthereum) {
      (window as any).ethereum = originalEthereum;
    }
    
    return provider;
  } catch (error) {
    // Restore original ethereum on error
    if (originalEthereum) {
      (window as any).ethereum = originalEthereum;
    }
    throw error;
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

