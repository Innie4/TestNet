'use client';

interface WalletAuthorizationProps {
  onAuthorize: () => void;
  onCancel: () => void;
}

export default function WalletAuthorization({ onAuthorize, onCancel }: WalletAuthorizationProps) {
  return (
    <div className="authorization-card">
      <div className="authorization-header">
        <h2>🔐 Wallet Authorization Required</h2>
        <p className="authorization-subtitle">
          To view your Tethereum (T99) balance, we need permission to connect to your Coinbase Wallet
        </p>
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

