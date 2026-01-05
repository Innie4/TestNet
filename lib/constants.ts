// Tethereum (T99) Token Contract Address on BNB Smart Chain
export const TETH_CONTRACT_ADDRESS = "0xc98cf0876b23fb1f574be5c59e4217c80b34d327";

// BNB Smart Chain Network Configuration
export const BSC_NETWORK = {
  chainId: "0x38", // 56 in decimal
  chainName: "BNB Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com/"],
};

// Minimum ABI for ERC-20 token interactions
export const ERC20_MIN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

