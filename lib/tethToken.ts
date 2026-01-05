import { ethers } from 'ethers';
import { TETH_CONTRACT_ADDRESS, ERC20_MIN_ABI, BSC_NETWORK } from './constants';

// Public BSC RPC endpoints as fallback
const BSC_RPC_ENDPOINTS = [
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
];

export interface TETHData {
  balance: string;
  balanceFormatted: string;
  symbol: string;
  name: string;
  decimals: number;
}

/**
 * Get TETH token balance using public RPC as fallback
 */
async function getBalanceFromPublicRPC(userAddress: string): Promise<{ balance: ethers.BigNumber; decimals: number }> {
  for (const rpcUrl of BSC_RPC_ENDPOINTS) {
    try {
      const publicProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(TETH_CONTRACT_ADDRESS, ERC20_MIN_ABI, publicProvider);
      
      const normalizedAddress = ethers.utils.getAddress(userAddress);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(normalizedAddress),
        contract.decimals()
      ]);
      
      console.log(`Successfully fetched from public RPC (${rpcUrl}):`, balance.toString());
      return { balance, decimals };
    } catch (err) {
      console.warn(`Failed to fetch from ${rpcUrl}:`, err);
      continue;
    }
  }
  throw new Error('All public RPC endpoints failed');
}

/**
 * Get TETH token balance for a given address
 * Uses the connected wallet provider (Coinbase Smart Wallet) - NO public RPC fallback
 */
export async function getTETHBalance(
  provider: ethers.providers.Web3Provider,
  userAddress: string
): Promise<TETHData> {
  // Normalize address first
  let normalizedAddress: string;
  try {
    normalizedAddress = ethers.utils.getAddress(userAddress);
  } catch (e) {
    normalizedAddress = ethers.utils.getAddress(userAddress.toLowerCase());
  }

  console.log('=== getTETHBalance START (Wallet Provider Only) ===');
  console.log('User address:', userAddress);
  console.log('Normalized address:', normalizedAddress);
  console.log('Contract address:', TETH_CONTRACT_ADDRESS);

  // Ensure provider is ready
  await provider.ready;
  
  // Verify network
  const network = await provider.getNetwork();
  console.log('Network chain ID:', network.chainId);
  
  if (network.chainId !== 56) {
    throw new Error(`Wrong network. Expected BSC (56), got ${network.chainId}. Please switch to BNB Smart Chain.`);
  }

  // Create contract instance using the wallet provider
  const contract = new ethers.Contract(
    TETH_CONTRACT_ADDRESS,
    ERC20_MIN_ABI,
    provider
  );

  console.log('Contract instance created, fetching from wallet provider...');
  console.log('Contract address:', TETH_CONTRACT_ADDRESS);
  console.log('Querying address:', normalizedAddress);

  // First, get decimals to ensure contract is accessible
  let decimals = 18;
  try {
    decimals = await contract.decimals();
    console.log('✅ Decimals fetched:', decimals);
  } catch (decErr: any) {
    console.warn('Decimals call failed, using default 18:', decErr.message);
  }

  // Fetch balance with timeout and retry
  let balance: ethers.BigNumber | null = null;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts && balance === null) {
    try {
      console.log(`Fetching balance (attempt ${attempts + 1}/${maxAttempts})...`);
      const fetchedBalance = await Promise.race([
        contract.balanceOf(normalizedAddress),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Balance fetch timeout')), 10000)
        )
      ]);
      balance = fetchedBalance;
      if (balance) {
        console.log('✅ Balance fetched successfully:', balance.toString());
      }
    } catch (balanceErr: any) {
      attempts++;
      console.error(`Balance fetch attempt ${attempts} failed:`, balanceErr.message);
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to fetch balance after ${maxAttempts} attempts: ${balanceErr.message}`);
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!balance) {
    throw new Error('Failed to fetch balance: all attempts exhausted');
  }

  // Fetch symbol and name (non-critical)
  let symbol = 'TETH';
  let name = 'Tethereum';
  try {
    [symbol, name] = await Promise.all([
      contract.symbol().catch(() => 'TETH'),
      contract.name().catch(() => 'Tethereum')
    ]);
    console.log('Symbol:', symbol);
    console.log('Name:', name);
  } catch (err) {
    console.warn('Could not fetch symbol/name, using defaults');
  }
  
  console.log('✅ All data fetched successfully');
  console.log('Balance:', balance.toString());
  console.log('Decimals:', decimals);

  // Format balance
  const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
  console.log('✅ Final balance (formatted):', balanceFormatted);
  console.log('Balance is zero?', balance.isZero());

  return {
    balance: balance.toString(),
    balanceFormatted,
    symbol,
    name,
    decimals,
  };
}

/**
 * Switch network to BNB Smart Chain
 */
export async function switchToBSC(
  ethereum: any
): Promise<boolean> {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_NETWORK.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask/Coinbase Wallet
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BSC_NETWORK],
        });
        return true;
      } catch (addError) {
        console.error('Error adding BSC network:', addError);
        return false;
      }
    }
    console.error('Error switching to BSC:', switchError);
    return false;
  }
}

/**
 * Get current network chain ID
 */
export async function getCurrentChainId(
  ethereum: any
): Promise<number> {
  try {
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    throw error;
  }
}

