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

  console.log('=== getTETHBalance START ===');
  console.log('User address:', userAddress);
  console.log('Normalized address:', normalizedAddress);
  console.log('Contract address:', TETH_CONTRACT_ADDRESS);

  let balance: ethers.BigNumber;
  let decimals: number = 18;
  let symbol: string = 'TETH';
  let name: string = 'Tethereum';

  try {
    // Ensure provider is ready
    await provider.ready;
    
    // Verify network
    const network = await provider.getNetwork();
    console.log('Network chain ID:', network.chainId);
    
    if (network.chainId !== 56) {
      console.warn('Wrong network, trying public RPC...');
      const publicData = await getBalanceFromPublicRPC(normalizedAddress);
      balance = publicData.balance;
      decimals = publicData.decimals;
    } else {
      // Create contract instance
      const contract = new ethers.Contract(
        TETH_CONTRACT_ADDRESS,
        ERC20_MIN_ABI,
        provider
      );

      // Fetch all data in parallel
      try {
        [balance, decimals, symbol, name] = await Promise.all([
          contract.balanceOf(normalizedAddress),
          contract.decimals().catch(() => 18),
          contract.symbol().catch(() => 'TETH'),
          contract.name().catch(() => 'Tethereum')
        ]);
        
        console.log('Balance from wallet provider:', balance.toString());
        console.log('Decimals:', decimals);
        console.log('Symbol:', symbol);
        console.log('Name:', name);
      } catch (contractErr: any) {
        console.warn('Contract call failed, trying public RPC:', contractErr);
        const publicData = await getBalanceFromPublicRPC(normalizedAddress);
        balance = publicData.balance;
        decimals = publicData.decimals;
      }
    }

    // Format balance
    const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
    console.log('Final balance (formatted):', balanceFormatted);
    console.log('Balance is zero?', balance.isZero());

    return {
      balance: balance.toString(),
      balanceFormatted,
      symbol,
      name,
      decimals,
    };
  } catch (error: any) {
    console.error('=== CRITICAL ERROR in getTETHBalance ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Last resort: try public RPC
    try {
      console.log('Attempting fallback to public RPC...');
      const publicData = await getBalanceFromPublicRPC(normalizedAddress);
      const balanceFormatted = ethers.utils.formatUnits(publicData.balance, publicData.decimals);
      
      return {
        balance: publicData.balance.toString(),
        balanceFormatted,
        symbol,
        name,
        decimals: publicData.decimals,
      };
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr);
      throw error; // Throw original error
    }
  }
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

