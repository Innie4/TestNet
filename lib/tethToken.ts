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

  // Ensure provider is ready - wait with timeout
  try {
    await Promise.race([
      provider.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Provider ready timeout')), 10000)
      )
    ]);
  } catch (readyErr) {
    console.warn('Provider ready check failed, continuing anyway:', readyErr);
  }
  
  // Verify network (only check once to avoid redundant calls)
  const network = await provider.getNetwork();
  console.log('Network chain ID:', network.chainId);
  console.log('Provider network details:', {
    chainId: network.chainId,
    name: network.name
  });
  
  if (network.chainId !== 56) {
    throw new Error(`Wrong network. Expected BSC (56), got ${network.chainId}. Please switch to BNB Smart Chain.`);
  }
  
  // Double-check by making a direct RPC call to verify network
  try {
    const blockNumber = await Promise.race([
      provider.getBlockNumber(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Block number fetch timeout')), 5000)
      )
    ]);
    console.log('Current BSC block number:', blockNumber);
  } catch (blockErr) {
    console.warn('Could not fetch block number:', blockErr);
    // Don't throw - this is just a verification step
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
  
  // Verify contract address is correct format
  const contractAddressChecksum = ethers.utils.getAddress(TETH_CONTRACT_ADDRESS);
  console.log('Contract address (checksum):', contractAddressChecksum);

  // First, get decimals to ensure contract is accessible
  let decimals = 18;
  try {
    decimals = await contract.decimals();
    console.log('✅ Decimals fetched:', decimals);
  } catch (decErr: any) {
    console.warn('Decimals call failed, using default 18:', decErr.message);
  }

  // Fetch balance with timeout and retry
  // CRITICAL: Use callStatic for more reliable balance fetching
  let balance: ethers.BigNumber | null = null;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts && balance === null) {
    try {
      console.log(`Fetching balance (attempt ${attempts + 1}/${maxAttempts})...`);
      console.log('Using address:', normalizedAddress);
      console.log('Contract address:', contractAddressChecksum);
      
      // Try using callStatic first (more reliable for view functions)
      // Use a longer timeout for balance calls
      const fetchedBalance = await Promise.race([
        contract.callStatic.balanceOf(normalizedAddress).catch((callStaticErr) => {
          // Fallback to regular call if callStatic fails
          console.log('callStatic failed, trying regular call...', callStaticErr);
          return contract.balanceOf(normalizedAddress).catch((regularErr: any) => {
            console.log('Regular call also failed, trying direct RPC...', regularErr);
            // Last resort: direct RPC call
            const data = contract.interface.encodeFunctionData('balanceOf', [normalizedAddress]);
            return provider.call({
              to: contractAddressChecksum,
              data: data
            }).then((result) => {
              const decoded = contract.interface.decodeFunctionResult('balanceOf', result);
              return decoded[0];
            });
          });
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Balance fetch timeout')), 20000)
        )
      ]);
      
      balance = fetchedBalance;
      if (balance) {
        console.log('✅ Balance fetched successfully:', balance.toString());
        console.log('Balance in hex:', balance.toHexString());
        console.log('Balance is zero?', balance.isZero());
      }
    } catch (balanceErr: any) {
      attempts++;
      console.error(`Balance fetch attempt ${attempts} failed:`, balanceErr);
      console.error('Error code:', balanceErr.code);
      console.error('Error message:', balanceErr.message);
      console.error('Error data:', balanceErr.data);
      
      if (attempts >= maxAttempts) {
        // Last attempt: try direct RPC call
        try {
          console.log('Attempting direct RPC call as last resort...');
          const data = contract.interface.encodeFunctionData('balanceOf', [normalizedAddress]);
          const result = await provider.call({
            to: contractAddressChecksum,
            data: data
          });
          const decoded = contract.interface.decodeFunctionResult('balanceOf', result);
          const directBalance = decoded[0];
          balance = directBalance;
          if (balance) {
            console.log('✅ Direct RPC call succeeded:', balance.toString());
          }
          break;
        } catch (directErr) {
          console.error('Direct RPC call also failed:', directErr);
          throw new Error(`Failed to fetch balance after ${maxAttempts} attempts: ${balanceErr.message}`);
        }
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
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

