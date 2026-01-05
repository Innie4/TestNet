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
    const contract = new ethers.Contract(
      TETH_CONTRACT_ADDRESS,
      ERC20_MIN_ABI,
      provider
    );

    const [balance, decimals, symbol, name] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.decimals(),
      contract.symbol(),
      contract.name(),
    ]);

    const balanceFormatted = ethers.utils.formatUnits(balance, decimals);

    return {
      balance: balance.toString(),
      balanceFormatted,
      symbol,
      name,
      decimals,
    };
  } catch (error) {
    console.error('Error fetching TETH balance:', error);
    throw error;
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

