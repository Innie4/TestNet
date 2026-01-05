import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import { ethers } from 'ethers';

// TETH Token Contract Address on BSC
export const TETH_CONTRACT_ADDRESS = '0xc98cf0876b23fb1f574be5c59e4217c80b34d327';

// BSC Network Configuration
export const BSC_NETWORK = {
  chainId: '0x38', // 56 in hex
  chainName: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

// Minimal ABI for ERC-20 token functions
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

// Initialize Coinbase Wallet SDK
export function initializeCoinbaseWallet() {
  const coinbaseWallet = new CoinbaseWalletSDK({
    appName: 'Tethereum Project',
    appLogoUrl: 'https://tethereum.com/logo.png',
    darkMode: false,
  });

  return coinbaseWallet.makeWeb3Provider('https://bsc-dataseed.binance.org/', 56);
}

// Check if user is on BSC network
export async function checkNetwork(provider: ethers.providers.Web3Provider): Promise<boolean> {
  const network = await provider.getNetwork();
  return network.chainId === 56;
}

// Switch to BSC network
export async function switchToBSC(provider: ethers.providers.Web3Provider): Promise<void> {
  try {
    await provider.provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_NETWORK.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await provider.provider.request({
          method: 'wallet_addEthereumChain',
          params: [BSC_NETWORK],
        });
      } catch (addError) {
        throw new Error('Failed to add BSC network');
      }
    } else {
      throw switchError;
    }
  }
}

// Get TETH token balance
export async function getTETHBalance(
  provider: ethers.providers.Web3Provider,
  address: string
): Promise<string> {
  const contract = new ethers.Contract(TETH_CONTRACT_ADDRESS, ERC20_ABI, provider);
  const balance = await contract.balanceOf(address);
  const decimals = await contract.decimals();
  return ethers.utils.formatUnits(balance, decimals);
}

// Fetch TETH price from DEXScreener API
export async function getTETHPrice(): Promise<number> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${TETH_CONTRACT_ADDRESS}`
    );
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      // Get the price from the first pair (usually the most liquid)
      const price = parseFloat(data.pairs[0].priceUsd);
      return price || 0.0001395; // Fallback to provided price
    }
    
    return 0.0001395; // Fallback price
  } catch (error) {
    console.error('Error fetching price:', error);
    return 0.0001395; // Fallback price
  }
}

