'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getCoinbaseProvider } from '@/lib/coinbaseWallet';
import { getTETHBalance, switchToBSC, getCurrentChainId } from '@/lib/tethToken';
import { fetchTETHPrice } from '@/lib/priceFetcher';
import { BSC_NETWORK } from '@/lib/constants';
import WalletAuthorization from '@/components/WalletAuthorization';
import WalletConnecting from '@/components/WalletConnecting';

type ConnectionStep = 'authorization' | 'connecting' | 'switching' | 'fetching' | 'connected';

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [balanceFormatted, setBalanceFormatted] = useState<string>('0');
  const [price, setPrice] = useState<string>('0.0001395');
  const [usePlaceholder, setUsePlaceholder] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isBSC, setIsBSC] = useState<boolean>(false);
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('authorization');

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
    fetchPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch price periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrice();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update balance when account changes or when connected
  useEffect(() => {
    if (account && isBSC && isConnected && connectionStep === 'connected') {
      console.log('Account or network changed, fetching balance...');
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        fetchBalance();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, isBSC, isConnected, connectionStep]);

  const checkConnection = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const ethereum = getCoinbaseProvider();
      if (!ethereum || !ethereum.request) {
        setConnectionStep('authorization');
        return;
      }

      // Check for existing connection using eth_accounts
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
        console.log('Existing accounts check:', accounts);
        
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          setConnectionStep('connected');
          await checkNetwork();
        } else {
          setConnectionStep('authorization');
        }
      } catch (err) {
        console.log('No existing connection found');
        setConnectionStep('authorization');
      }
    } catch (err) {
      console.error('Error checking connection:', err);
      setConnectionStep('authorization');
    }
  };

  const checkNetwork = async () => {
    try {
      if (typeof window === 'undefined') return;
      const ethereum = getCoinbaseProvider();
      const chainId = await getCurrentChainId(ethereum);
      const isBSCNetwork = chainId === 56; // BSC mainnet chain ID
      setIsBSC(isBSCNetwork);
      
      if (!isBSCNetwork) {
        setError('Please switch to BNB Smart Chain network');
      }
    } catch (err) {
      console.error('Error checking network:', err);
    }
  };

  const handleAuthorize = () => {
    setConnectionStep('connecting');
    connectWallet();
  };

  const handleCancel = () => {
    setConnectionStep('authorization');
    setError(null);
  };

  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    setConnectionStep('connecting');

    try {
      if (typeof window === 'undefined') {
        throw new Error('Window is not available');
      }
      
      const ethereum = getCoinbaseProvider();
      
      if (!ethereum || !ethereum.request) {
        throw new Error('Coinbase Smart Wallet not available. Please ensure Coinbase Wallet is installed.');
      }

      console.log('=== Initiating Coinbase Smart Wallet Connection ===');
      console.log('Provider type:', ethereum.constructor?.name);
      
      // Perform the Coinbase Handshake (eth_requestAccounts)
      // This connects to Coinbase Smart Wallet (NOT browser extension)
      setConnectionStep('connecting');
      
      console.log('Requesting accounts from Coinbase Smart Wallet...');
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];
      
      console.log('Accounts received:', accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please approve the connection.');
      }

      setAccount(accounts[0]);
      setIsConnected(true);

      // Check and switch to BSC network
      const chainId = await getCurrentChainId(ethereum);
      console.log('Current chain ID:', chainId);
      
      if (chainId !== 56) {
        console.log('Not on BSC, attempting to switch...');
        setConnectionStep('switching');
        const switched = await switchToBSC(ethereum);
        if (switched) {
          console.log('Successfully switched to BSC');
          setIsBSC(true);
          // Wait a bit for network switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          setConnectionStep('fetching');
          await fetchBalance();
          setConnectionStep('connected');
        } else {
          setError('Failed to switch to BNB Smart Chain. Please switch manually.');
          setConnectionStep('connected');
        }
      } else {
        console.log('Already on BSC network');
        setIsBSC(true);
        setConnectionStep('fetching');
        // Longer delay to ensure provider is fully ready
        await new Promise(resolve => setTimeout(resolve, 1500));
        await fetchBalance();
        setConnectionStep('connected');
      }

      // Listen for account changes
      if (ethereum.on) {
        ethereum.on('accountsChanged', (accounts: unknown) => {
          const accountArray = accounts as string[];
          if (!accountArray || accountArray.length === 0) {
            disconnectWallet();
          } else {
            setAccount(accountArray[0]);
            if (isBSC) {
              fetchBalance();
            }
          }
        });

        // Listen for chain changes
        ethereum.on('chainChanged', (chainId: string) => {
          const chainIdNum = parseInt(chainId, 16);
          setIsBSC(chainIdNum === 56);
          if (chainIdNum === 56) {
            fetchBalance();
          } else {
            setError('Please switch to BNB Smart Chain network');
          }
        });
      }

    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      const errorMessage = err.message || 'Failed to connect wallet';
      setError(errorMessage);
      setIsConnected(false);
      setConnectionStep('authorization');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setBalance('0');
    setBalanceFormatted('0');
    setUsePlaceholder(false);
    setIsBSC(false);
    setError(null);
    setConnectionStep('authorization');
  };

  const fetchBalance = async (retryCount = 0) => {
    if (!account) {
      console.log('No account set, skipping balance fetch');
      return;
    }

    if (!isBSC) {
      console.log('Not on BSC network, skipping balance fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('=== Starting Balance Fetch ===');
      console.log('Account:', account);
      console.log('Network: BSC (56)');
      console.log('Contract: 0xc98cf0876b23fb1f574be5c59e4217c80b34d327');
      
      const ethereum = getCoinbaseProvider();
      
      if (!ethereum) {
        throw new Error('Wallet provider not available');
      }

      // Ensure provider is ready and test connection
      console.log('Testing provider connection...');
      if (ethereum.request) {
        const testAccounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
        console.log('Provider accounts:', testAccounts);
        if (!testAccounts || testAccounts.length === 0) {
          throw new Error('No accounts available in provider');
        }
        if (testAccounts[0].toLowerCase() !== account.toLowerCase()) {
          console.warn('Account mismatch:', { 
            expected: account, 
            got: testAccounts[0] 
          });
        }
      }

      const provider = new ethers.providers.Web3Provider(ethereum as any);
      
      // Wait for network to be ready
      console.log('Waiting for provider to be ready...');
      await provider.ready;
      
      // Verify network
      const network = await provider.getNetwork();
      console.log('Provider network:', network);
      if (network.chainId !== 56) {
        throw new Error(`Wrong network. Expected BSC (56), got ${network.chainId}`);
      }

      // Verify account is correct - use the account from state
      // The account from eth_requestAccounts is the correct one
      const addressToCheck = ethers.utils.getAddress(account);
      console.log('Using account for balance check:', addressToCheck);
      
      // Verify signer matches
      try {
        const signer = provider.getSigner();
        const signerAddress = await signer.getAddress();
        console.log('Signer address from provider:', signerAddress);
        
        if (signerAddress.toLowerCase() !== account.toLowerCase()) {
          console.warn('Signer address differs, using account from connection:', {
            account,
            signer: signerAddress
          });
          // Use the account from connection, not signer
        }
      } catch (signerErr) {
        console.warn('Could not get signer address, using account directly:', signerErr);
      }
      
      // Fetch balance from connected wallet (Coinbase Smart Wallet)
      console.log('Fetching balance for address:', addressToCheck);
      const tethData = await getTETHBalance(provider, addressToCheck);
      console.log('=== Balance Data Received from Wallet ===');
      console.log('Raw balance:', tethData.balance);
      console.log('Formatted balance:', tethData.balanceFormatted);
      console.log('Symbol:', tethData.symbol);
      console.log('Name:', tethData.name);
      console.log('Decimals:', tethData.decimals);

      // Import and format balance correctly
      const rawBalance = tethData.balanceFormatted;
      const balanceNum = parseFloat(rawBalance);
      
      // Always use the actual balance from wallet (no placeholder)
      setUsePlaceholder(false);
      setBalance(tethData.balance);
      
      // Format balance with proper decimal handling
      let formatted: string;
      if (balanceNum > 0 && balanceNum < 0.000001) {
        // For very small balances, show up to 12 decimal places
        formatted = balanceNum.toFixed(12).replace(/\.?0+$/, '');
      } else if (balanceNum > 0 && balanceNum < 1) {
        // For balances less than 1, show up to 8 decimal places
        formatted = balanceNum.toFixed(8).replace(/\.?0+$/, '');
      } else {
        // For larger balances, use locale formatting with up to 6 decimals
        formatted = balanceNum.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6,
        });
      }
      
      setBalanceFormatted(formatted);

      console.log('=== Balance Update Complete ===');
      console.log('Raw balance string:', tethData.balance);
      console.log('Formatted balance string:', tethData.balanceFormatted);
      console.log('Balance number:', balanceNum);
      console.log('Final formatted display:', formatted);

    } catch (err: any) {
      console.error('=== Error Fetching Balance ===');
      console.error('Error details:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('Error data:', err.data);
      
      const errorMessage = err.message || 'Failed to fetch balance';
      setError(errorMessage);
      
      // Retry logic (max 3 retries)
      if (retryCount < 3) {
        console.log(`Retrying balance fetch (attempt ${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchBalance(retryCount + 1);
      }
      
      // After all retries failed, show error
      console.error('All retries failed');
      setBalance('0');
      setBalanceFormatted('0');
      setUsePlaceholder(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrice = async () => {
    try {
      const priceData = await fetchTETHPrice();
      setPrice(priceData.priceUsd);
    } catch (err) {
      console.error('Error fetching price:', err);
    }
  };

  const handleSwitchNetwork = async () => {
    setLoading(true);
    setError(null);

    try {
      const ethereum = getCoinbaseProvider();
      const switched = await switchToBSC(ethereum);
      
      if (switched) {
        setIsBSC(true);
        await fetchBalance();
      } else {
        setError('Failed to switch network. Please switch manually in your wallet.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>🪙 Tethereum (T99)</h1>
      <p className="subtitle">Coinbase Wallet Integration on BNB Smart Chain</p>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* Authorization Step */}
      {connectionStep === 'authorization' && !isConnected && (
        <WalletAuthorization
          onAuthorize={handleAuthorize}
          onCancel={handleCancel}
        />
      )}

      {/* Connecting Steps */}
      {(connectionStep === 'connecting' || connectionStep === 'switching' || connectionStep === 'fetching') && (
        <WalletConnecting
          step={connectionStep}
          error={error}
        />
      )}

      {/* Connected State */}
      {connectionStep === 'connected' && isConnected && (
        <>
          <div className="status connected">
            ✓ Connected to Coinbase Wallet
          </div>
        </>
      )}

      {connectionStep === 'connected' && isConnected && (
        <>
          {!isBSC && (
            <button
              className="button"
              onClick={handleSwitchNetwork}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Switching...
                </>
              ) : (
                '🔄 Switch to BNB Smart Chain'
              )}
            </button>
          )}

          {isBSC && (
            <div className="info-card">
              <div className="info-row">
                <span className="info-label">Wallet Address:</span>
                <span className="info-value" style={{ fontSize: '0.9rem' }}>
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Network:</span>
                <span className="info-value">BNB Smart Chain</span>
              </div>

              <div className="info-row">
                <span className="info-label">TETH Price:</span>
                <span className="info-value">${price}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Your TETH Balance:</span>
                <span className="info-value">
                  {loading ? (
                    <span className="loading-spinner"></span>
                  ) : (() => {
                    const balanceNum = parseFloat(balance.replace(/,/g, ''));
                    if (isNaN(balanceNum) || balanceNum === 0) {
                      return <span style={{ color: '#666' }}>0 TETH</span>;
                    }
                    return <span style={{ color: '#10b981', fontWeight: '700' }}>{balanceFormatted} TETH</span>;
                  })()}
                </span>
              </div>
            </div>
          )}

          <button
            className="button secondary"
            onClick={disconnectWallet}
            disabled={loading}
          >
            Disconnect Wallet
          </button>

          {isBSC && (
            <button
              className="button secondary"
              onClick={() => fetchBalance()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Refreshing...
                </>
              ) : (
                '🔄 Refresh Balance'
              )}
            </button>
          )}
        </>
      )}

      <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
        <h3 style={{ marginBottom: '10px', color: '#333' }}>Contract Information</h3>
        <p style={{ fontSize: '0.9rem', color: '#666', wordBreak: 'break-all' }}>
          <strong>TETH Contract:</strong> 0xc98cf0876b23fb1f574be5c59e4217c80b34d327
        </p>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
          <strong>Network:</strong> BNB Smart Chain (BSC)
        </p>
      </div>
    </main>
  );
}