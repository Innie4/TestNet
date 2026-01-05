'use client';

import { useEffect, useState } from 'react';
import { getConnectionInfo } from '@/lib/coinbaseWallet';

interface WalletAuthorizationProps {
  onAuthorize: () => void;
  onCancel: () => void;
}

export default function WalletAuthorization({ onAuthorize, onCancel }: WalletAuthorizationProps) {
  const [connectionInfo, setConnectionInfo] = useState(getConnectionInfo());

  useEffect(() => {
    // Update connection info periodically in case extension is installed
    const interval = setInterval(() => {
      setConnectionInfo(getConnectionInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="authorization-card">
      <div className="authorization-header">
        <h2>🔐 Wallet Authorization Required</h2>
        <p className="authorization-subtitle">
          To view your Tethereum (T99) balance, we need permission to connect to your Coinbase Wallet
        </p>
        
        {connectionInfo.hasExtension ? (
          <div className="connection-method-badge extension">
            <span>🖥️</span> Coinbase Wallet Extension Detected
          </div>
        ) : (
          <div className="connection-method-badge mobile">
            <span>📱</span> Will connect via Coinbase Wallet Mobile App or Website
          </div>
        )}
      </div>

      <div className="authorization-content">
        <div className="permission-section">
          <h3>What we&apos;ll access:</h3>
          <ul className="permission-list">
            <li>
              <span className="permission-icon">✓</span>
              <div>
                <strong>Read your wallet address</strong>
                <p>To identify your account</p>
              </div>
            </li>
            <li>
              <span className="permission-icon">✓</span>
              <div>
                <strong>View your TETH token balance</strong>
                <p>To display your holdings</p>
              </div>
            </li>
            <li>
              <span className="permission-icon">✓</span>
              <div>
                <strong>Check network connection</strong>
                <p>To ensure you&apos;re on BNB Smart Chain</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="security-note">
          <h4>🔒 Security & Privacy</h4>
          <ul>
            <li>We will <strong>never</strong> request permission to send transactions</li>
            <li>We will <strong>never</strong> access your private keys</li>
            <li>We will <strong>never</strong> request access to other tokens or assets</li>
            <li>All data is read-only and processed locally in your browser</li>
          </ul>
        </div>

        <div className="network-info">
          <h4>🌐 Network Information</h4>
          <p><strong>Network:</strong> BNB Smart Chain (BSC)</p>
          <p><strong>Chain ID:</strong> 56</p>
          <p><strong>Token Contract:</strong> 0xc98cf0876b23fb1f574be5c59e4217c80b34d327</p>
        </div>

        <div className="connection-methods-info">
          <h4>💡 Connection Methods Supported</h4>
          <ul>
            <li>
              <strong>Desktop/Laptop:</strong> Coinbase Wallet browser extension
              {connectionInfo.hasExtension && <span className="status-indicator active">✓ Available</span>}
            </li>
            <li>
              <strong>Mobile:</strong> Coinbase Wallet mobile app (iOS/Android)
            </li>
            <li>
              <strong>Web:</strong> Coinbase Wallet website integration
            </li>
          </ul>
          <p className="connection-note">
            {connectionInfo.hasExtension 
              ? 'Your browser extension will be used for authentication.'
              : 'You&apos;ll be prompted to connect via Coinbase Wallet mobile app or scan a QR code.'}
          </p>
        </div>
      </div>

      <div className="authorization-actions">
        <button className="button cancel-button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button authorize-button" onClick={onAuthorize}>
          Grant Access & Connect
        </button>
      </div>
    </div>
  );
}

