import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

// Initialize Coinbase Wallet SDK instance (singleton)
let coinbaseWalletSDK: CoinbaseWalletSDK | null = null;

// Initialize Coinbase Wallet SDK
const initializeSDK = (): CoinbaseWalletSDK => {
  if (!coinbaseWalletSDK) {
    coinbaseWalletSDK = new CoinbaseWalletSDK({
      appName: 'Tethereum Project',
      appLogoUrl: 'https://tethereum.com/logo.png',
      darkMode: false,
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
// Supports both browser extension and mobile app
export const getCoinbaseProvider = () => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  const ethereum = (window as any).ethereum;
  const connectionMethod = getWalletConnectionMethod();

  // Priority 1: Coinbase Wallet browser extension (for desktop/laptop)
  if (ethereum?.isCoinbaseWallet) {
    console.log('Using Coinbase Wallet browser extension');
    return ethereum;
  }

  // Priority 2: Coinbase Wallet in providers array (multiple wallets installed)
  if (ethereum?.providers && Array.isArray(ethereum.providers)) {
    const coinbaseProvider = ethereum.providers.find(
      (provider: any) => provider.isCoinbaseWallet
    );
    if (coinbaseProvider) {
      console.log('Found Coinbase Wallet extension in providers array');
      return coinbaseProvider;
    }
  }

  // Priority 3: Standard ethereum provider (might be Coinbase Wallet without flag)
  // This handles cases where Coinbase Wallet extension exists but doesn't set the flag
  if (ethereum && ethereum.request) {
    // Check if it's likely Coinbase Wallet by checking for specific properties
    const isLikelyCoinbase = 
      ethereum.selectedAddress !== undefined ||
      ethereum.isMetaMask === false; // MetaMask sets this to true
    
    if (isLikelyCoinbase || connectionMethod === 'extension') {
      console.log('Using ethereum provider (likely Coinbase Wallet extension)');
      return ethereum;
    }
  }

  // Priority 4: Initialize Coinbase Wallet SDK for mobile app and web
  // This will work for:
  // - Mobile devices (opens Coinbase Wallet app)
  // - Desktop browsers without extension (shows QR code or deep link)
  console.log('Initializing Coinbase Wallet SDK for mobile/web connection');
  const sdk = initializeSDK();
  
  // Create Web3 provider for BSC
  // The SDK will automatically handle:
  // - Mobile: Deep linking to Coinbase Wallet app
  // - Desktop: QR code for mobile wallet scanning
  // - Extension: Will use extension if available
  const provider = sdk.makeWeb3Provider(
    "https://bsc-dataseed.binance.org/",
    56 // BSC chain ID
  );

  return provider;
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

