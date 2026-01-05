import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

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

// Get the Ethereum provider from Coinbase Wallet
export const getCoinbaseProvider = () => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  const ethereum = (window as any).ethereum;

  // If Coinbase Wallet extension is installed, use it directly
  if (ethereum?.isCoinbaseWallet) {
    console.log('Using Coinbase Wallet extension');
    return ethereum;
  }

  // If multiple providers exist, find Coinbase Wallet
  if (ethereum?.providers && Array.isArray(ethereum.providers)) {
    const coinbaseProvider = ethereum.providers.find(
      (provider: any) => provider.isCoinbaseWallet
    );
    if (coinbaseProvider) {
      console.log('Found Coinbase Wallet in providers array');
      return coinbaseProvider;
    }
  }

  // Check if ethereum provider exists (might be Coinbase Wallet without isCoinbaseWallet flag)
  if (ethereum && ethereum.request) {
    console.log('Using ethereum provider (may be Coinbase Wallet)');
    return ethereum;
  }

  // Fallback: Initialize Coinbase Wallet SDK for mobile app
  console.log('Initializing Coinbase Wallet SDK');
  const coinbaseWallet = new CoinbaseWalletSDK({
    appName: 'Tethereum Project',
    appLogoUrl: 'https://tethereum.com/logo.png',
    darkMode: false,
  });

  // Create Web3 provider for BSC
  const provider = coinbaseWallet.makeWeb3Provider(
    "https://bsc-dataseed.binance.org/",
    56 // BSC chain ID
  );

  return provider;
};

