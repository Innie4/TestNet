/**
 * Fetch TETH token price from DEXScreener API
 * Alternative: You can use CoinGecko, PancakeSwap API, or other price sources
 */
export async function fetchTETHPrice(): Promise<{
  price: number;
  priceUsd: string;
  source: string;
}> {
  try {
    // Using DEXScreener API for BSC tokens
    const contractAddress = "0xc98cf0876b23fb1f574be5c59e4217c80b34d327";
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch price from DEXScreener');
    }

    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      // Get the pair with the highest liquidity
      const bestPair = data.pairs.sort(
        (a: any, b: any) => parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0)
      )[0];

      const priceUsd = bestPair.priceUsd || "0";
      const price = parseFloat(priceUsd);

      return {
        price,
        priceUsd: price.toFixed(8),
        source: "DEXScreener",
      };
    }

    // Fallback to default price if API doesn't return data
    return {
      price: 0.0001395,
      priceUsd: "0.0001395",
      source: "Default",
    };
  } catch (error) {
    console.error('Error fetching TETH price:', error);
    // Return default price on error
    return {
      price: 0.0001395,
      priceUsd: "0.0001395",
      source: "Default (Fallback)",
    };
  }
}

/**
 * Calculate USD value of TETH balance
 */
export function calculateUSDValue(
  balance: string,
  priceUsd: number
): string {
  const balanceNum = parseFloat(balance);
  const usdValue = balanceNum * priceUsd;
  return usdValue.toFixed(2);
}

