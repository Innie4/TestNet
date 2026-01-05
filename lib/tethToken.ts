import { ethers } from 'ethers';
import { TETH_CONTRACT_ADDRESS, ERC20_MIN_ABI, BSC_NETWORK } from './constants';

export interface TETHData {
  balance: string;
  balanceFormatted: string;
  symbol: string;
  name: string;
  decimals: number;
}

/**
 * Get TETH token balance for a given address
 */
export async function getTETHBalance(
  provider: ethers.providers.Web3Provider,
  userAddress: string
): Promise<TETHData> {
  try {
    // Ensure provider is ready
    await provider.ready;
    
    // Verify we're on the correct network
    const network = await provider.getNetwork();
    console.log('Network check - Chain ID:', network.chainId);
    if (network.chainId !== 56) {
      throw new Error(`Wrong network. Expected BSC (56), got ${network.chainId}`);
    }

    // Normalize address (ensure checksum)
    const normalizedAddress = ethers.utils.getAddress(userAddress);
    console.log('Normalized user address:', normalizedAddress);
    console.log('Contract address:', TETH_CONTRACT_ADDRESS);

    // Create contract instance
    const contract = new ethers.Contract(
      TETH_CONTRACT_ADDRESS,
      ERC20_MIN_ABI,
      provider
    );

    console.log('Contract instance created, fetching data...');
    
    // Fetch token data with individual error handling
    let balance, decimals, symbol, name;
    
    try {
      balance = await contract.balanceOf(normalizedAddress);
      console.log('Balance fetched:', balance.toString());
    } catch (err: any) {
      console.error('Error fetching balance:', err);
      throw new Error(`Failed to fetch balance: ${err.message}`);
    }

    try {
      decimals = await contract.decimals();
      console.log('Decimals:', decimals);
    } catch (err: any) {
      console.error('Error fetching decimals:', err);
      // Default to 18 if decimals call fails
      decimals = 18;
      console.warn('Using default decimals: 18');
    }

    try {
      symbol = await contract.symbol();
      console.log('Symbol:', symbol);
    } catch (err: any) {
      console.error('Error fetching symbol:', err);
      symbol = 'TETH';
    }

    try {
      name = await contract.name();
      console.log('Name:', name);
    } catch (err: any) {
      console.error('Error fetching name:', err);
      name = 'Tethereum';
    }

    // Format balance
    const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
    console.log('Final formatted balance:', balanceFormatted);

    // Verify balance is not null/undefined
    if (!balance || balance.toString() === '0') {
      console.warn('Balance is 0 or null. Double-checking...');
      // Try one more time with a direct call
      try {
        const recheckBalance = await contract.balanceOf(normalizedAddress);
        console.log('Recheck balance:', recheckBalance.toString());
        if (recheckBalance.toString() !== balance.toString()) {
          balance = recheckBalance;
          const recheckFormatted = ethers.utils.formatUnits(balance, decimals);
          console.log('Recheck formatted:', recheckFormatted);
        }
      } catch (recheckErr) {
        console.error('Recheck failed:', recheckErr);
      }
    }

    return {
      balance: balance.toString(),
      balanceFormatted,
      symbol,
      name,
      decimals,
    };
  } catch (error: any) {
    console.error('=== Error in getTETHBalance ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error data:', error.data);
    console.error('User address:', userAddress);
    console.error('Contract address:', TETH_CONTRACT_ADDRESS);
    
    // Provide more detailed error information
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      throw new Error('Network error. Please check your connection and ensure you are on BNB Smart Chain.');
    }
    if (error.code === 'CALL_EXCEPTION' || error.code === -32000) {
      throw new Error(`Contract call failed: ${error.message || 'Please verify the contract address and network.'}`);
    }
    if (error.code === 'INVALID_ARGUMENT') {
      throw new Error(`Invalid address format: ${userAddress}`);
    }
    throw new Error(error.message || 'Failed to fetch token balance');
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

