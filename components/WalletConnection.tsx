'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  initializeCoinbaseWallet,
  checkNetwork,
  switchToBSC,
  getTETHBalance,
  getTETHPrice,
  TETH_CONTRACT_ADDRESS,
} from '@/lib/wallet';

interface WalletState {
  address: string | null;
  balance: string | null;
  price: number | null;
  usdValue: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export default function WalletConnection() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: null,
    price: null,
    usdValue: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  // Initialize provider on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ethereumProvider = initializeCoinbaseWallet();
      const web3Provider = new ethers.providers.Web3Provider(ethereumProvider);
      setProvider(web3Provider);
    }
  }, []);

  // Fetch price on mount
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getTETHPrice();
      setWalletState((prev) => ({ ...prev, price }));
    };
    fetchPrice();
    
    // Update price every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (provider.provider && typeof provider.provider.on === 'function') {
      provider.provider.on('accountsChanged', handleAccountsChanged);
      provider.provider.on('chainChanged', handleChainChanged);

      return () => {
        if (provider.provider && typeof provider.provider.removeListener === 'function') {
          provider.provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.provider.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [provider]);

  const connectWallet = async () => {
    if (!provider) {
      setWalletState((prev) => ({
        ...prev,
        error: 'Wallet provider not initialized',
      }));
      return;
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access (Coinbase Handshake)
      const accounts = await provider.provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];

      // Check and switch network if needed
      const isOnBSC = await checkNetwork(provider);
      if (!isOnBSC) {
        await switchToBSC(provider);
      }

      // Fetch balance
      const balance = await getTETHBalance(provider, address);
      const price = walletState.price || await getTETHPrice();
      const usdValue = parseFloat(balance) * price;

      setWalletState({
        address,
        balance,
        price,
        usdValue,
        isConnected: true,
        isConnecting: false,
        error: null,
      });
    } catch (error: any) {
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const disconnect = () => {
    setWalletState({
      address: null,
      balance: null,
      price: walletState.price,
      usdValue: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  };

  const refreshBalance = async () => {
    if (!provider || !walletState.address) return;

    try {
      const balance = await getTETHBalance(provider, walletState.address);
      const price = walletState.price || await getTETHPrice();
      const usdValue = parseFloat(balance) * price;

      setWalletState((prev) => ({
        ...prev,
        balance,
        usdValue,
      }));
    } catch (error: any) {
      setWalletState((prev) => ({
        ...prev,
        error: error.message || 'Failed to refresh balance',
      }));
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-card">
        <h1 className="title">Tethereum (T99) Wallet</h1>
        <p className="subtitle">BNB Smart Chain Integration</p>

        {walletState.error && (
          <div className="error-message">{walletState.error}</div>
        )}

        {!walletState.isConnected ? (
          <button
            onClick={connectWallet}
            disabled={walletState.isConnecting}
            className="connect-button"
          >
            {walletState.isConnecting ? 'Connecting...' : 'Connect Coinbase Wallet'}
          </button>
        ) : (
          <div className="wallet-info">
            <div className="info-section">
              <label>Wallet Address:</label>
              <div className="address">{walletState.address}</div>
            </div>

            <div className="info-section">
              <label>TETH Balance:</label>
              <div className="balance">
                {walletState.balance ? parseFloat(walletState.balance).toLocaleString() : '0'} TETH
              </div>
            </div>

            <div className="info-section">
              <label>Token Price:</label>
              <div className="price">
                ${walletState.price?.toFixed(8) || '0.00013950'}
              </div>
            </div>

            {walletState.usdValue !== null && (
              <div className="info-section">
                <label>USD Value:</label>
                <div className="usd-value">
                  ${walletState.usdValue.toFixed(2)}
                </div>
              </div>
            )}

            <div className="info-section">
              <label>Contract Address:</label>
              <div className="contract-address">
                <a
                  href={`https://bscscan.com/address/${TETH_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  {TETH_CONTRACT_ADDRESS}
                </a>
              </div>
            </div>

            <div className="button-group">
              <button onClick={refreshBalance} className="refresh-button">
                Refresh Balance
              </button>
              <button onClick={disconnect} className="disconnect-button">
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .wallet-container {
          width: 100%;
          max-width: 600px;
        }

        .wallet-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
          text-align: center;
        }

        .subtitle {
          font-size: 16px;
          color: #666;
          margin-bottom: 32px;
          text-align: center;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .connect-button {
          width: 100%;
          padding: 16px;
          font-size: 18px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .connect-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .connect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .wallet-info {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .info-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-section label {
          font-size: 14px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .address,
        .contract-address {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #333;
          word-break: break-all;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .balance {
          font-size: 28px;
          font-weight: 700;
          color: #667eea;
        }

        .price {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }

        .usd-value {
          font-size: 32px;
          font-weight: 700;
          color: #10b981;
        }

        .link {
          color: #667eea;
          text-decoration: none;
          transition: color 0.2s;
        }

        .link:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .refresh-button,
        .disconnect-button {
          flex: 1;
          padding: 12px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .refresh-button {
          background: #667eea;
          color: white;
        }

        .refresh-button:hover {
          transform: translateY(-2px);
          background: #5568d3;
        }

        .disconnect-button {
          background: #ef4444;
          color: white;
        }

        .disconnect-button:hover {
          transform: translateY(-2px);
          background: #dc2626;
        }
      `}</style>
    </div>
  );
}

