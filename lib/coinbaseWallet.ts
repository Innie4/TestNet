import CoinbaseWalletSDK from '@coinbase/wallet-sdk';

// Initialize Coinbase Wallet SDK
export const initializeCoinbaseWallet = () => {
  const coinbaseWallet = new CoinbaseWalletSDK({
    appName: 'Tethereum Project',
    appLogoUrl: 'https://tethereum.com/logo.png', // Update with your logo URL
    darkMode: false,
  });

  return coinbaseWallet;
};

// Get the Ethereum provider from Coinbase Wallet
export const getCoinbaseProvider = () => {
  const coinbaseWallet = initializeCoinbaseWallet();
  // BSC RPC endpoint
  const ethereum = coinbaseWallet.makeWeb3Provider(
    "https://bsc-dataseed.binance.org/",
    56 // BSC chain ID
  );
  return ethereum;
};

