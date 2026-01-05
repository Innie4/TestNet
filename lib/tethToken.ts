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
    if (network.chainId !== 56) {
      throw new Error(`Wrong network. Expected BSC (56), got ${network.chainId}`);
    }

    console.log('Creating contract instance for:', TETH_CONTRACT_ADDRESS);
    const contract = new ethers.Contract(
      TETH_CONTRACT_ADDRESS,
      ERC20_MIN_ABI,
      provider
    );

    console.log('Fetching token data for address:', userAddress);
    
    // Fetch token data with timeout
    const balancePromise = contract.balanceOf(userAddress);
    const decimalsPromise = contract.decimals();
    const symbolPromise = contract.symbol();
    const namePromise = contract.name();

    const [balance, decimals, symbol, name] = await Promise.all([
      balancePromise,
      decimalsPromise,
      symbolPromise,
      namePromise,
    ]);

    console.log('Token data received:', { balance: balance.toString(), decimals, symbol, name });

    const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
    console.log('Formatted balance:', balanceFormatted);

    return {
      balance: balance.toString(),
      balanceFormatted,
      symbol,
      name,
      decimals,
    };
  } catch (error: any) {
    console.error('Error fetching TETH balance:', error);
    // Provide more detailed error information
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      throw new Error('Network error. Please check your connection and ensure you are on BNB Smart Chain.');
    }
    if (error.code === 'CALL_EXCEPTION') {
      throw new Error('Contract call failed. Please verify the contract address and network.');
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

