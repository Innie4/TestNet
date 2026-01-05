'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getCoinbaseProvider } from '@/lib/coinbaseWallet';
import { getTETHBalance, switchToBSC, getCurrentChainId } from '@/lib/tethToken';
import { fetchTETHPrice, calculateUSDValue } from '@/lib/priceFetcher';
import { BSC_NETWORK } from '@/lib/constants';
import WalletAuthorization from '@/components/WalletAuthorization';
import WalletConnecting from '@/components/WalletConnecting';

type ConnectionStep = 'authorization' | 'connecting' | 'switching' | 'fetching' | 'connected';

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [balanceFormatted, setBalanceFormatted] = useState<string>('0');
  const [price, setPrice] = useState<string>('0.0001395');
  const [usdValue, setUsdValue] = useState<string>('0.00');
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

  // Update balance when account changes
  useEffect(() => {
    if (account && isBSC) {
      fetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, isBSC]);

  const checkConnection = async () => {
    try {
      if (typeof window === 'undefined') return;
      const ethereum = getCoinbaseProvider();
      if (ethereum && ethereum.selectedAddress) {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          setConnectionStep('connected');
          await checkNetwork();
        } else {
          setConnectionStep('authorization');
        }
      } else {
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
      
      if (!ethereum) {
        throw new Error('Coinbase Wallet not detected. Please install Coinbase Wallet extension.');
      }

      // Perform the Coinbase Handshake (eth_requestAccounts)
      // Note: This will still trigger browser popup, but we've explained it to the user
      setConnectionStep('connecting');
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
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
        // Small delay to ensure provider is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchBalance();
        setConnectionStep('connected');
      }

      // Listen for account changes
      if (ethereum.on) {
        ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnectWallet();
          } else {
            setAccount(accounts[0]);
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
    setUsdValue('0.00');
    setIsBSC(false);
    setError(null);
    setConnectionStep('authorization');
  };

  const fetchBalance = async () => {
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      const ethereum = getCoinbaseProvider();
      const provider = new ethers.providers.Web3Provider(ethereum);
      const tethData = await getTETHBalance(provider, account);

      setBalance(tethData.balance);
      setBalanceFormatted(parseFloat(tethData.balanceFormatted).toLocaleString('en-US', {
        maximumFractionDigits: 6,
      }));

      // Calculate USD value
      const priceNum = parseFloat(price);
      const usd = calculateUSDValue(tethData.balanceFormatted, priceNum);
      setUsdValue(usd);

    } catch (err: any) {
      console.error('Error fetching balance:', err);
      setError(err.message || 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrice = async () => {
    try {
      const priceData = await fetchTETHPrice();
      setPrice(priceData.priceUsd);
      
      // Update USD value if balance is already loaded
      if (balanceFormatted !== '0') {
        const usd = calculateUSDValue(balanceFormatted.replace(/,/g, ''), priceData.price);
        setUsdValue(usd);
      }
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
                  ) : balanceFormatted === '0' ? (
                    <span style={{ color: '#ef4444' }}>0 TETH (No balance found)</span>
                  ) : (
                    `${balanceFormatted} TETH`
                  )}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">USD Value:</span>
                <span className="info-value">${usdValue}</span>
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
              onClick={fetchBalance}
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
