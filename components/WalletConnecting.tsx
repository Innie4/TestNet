'use client';

import { getConnectionInfo } from '@/lib/coinbaseWallet';
import { useEffect, useState } from 'react';

interface WalletConnectingProps {
  step: 'connecting' | 'switching' | 'fetching';
  error?: string | null;
}

export default function WalletConnecting({ step, error }: WalletConnectingProps) {
  const [connectionInfo, setConnectionInfo] = useState(getConnectionInfo());

  useEffect(() => {
    setConnectionInfo(getConnectionInfo());
  }, []);

  const getStepMessage = () => {
    switch (step) {
      case 'connecting':
        return connectionInfo.hasExtension
          ? 'Connecting to Coinbase Wallet Extension...'
          : 'Connecting to Coinbase Wallet...';
      case 'switching':
        return 'Switching to BNB Smart Chain...';
      case 'fetching':
        return 'Fetching your TETH balance...';
      default:
        return 'Processing...';
    }
  };

  const getSubtitleMessage = () => {
    switch (step) {
      case 'connecting':
        return connectionInfo.hasExtension
          ? 'Please approve the connection in your Coinbase Wallet extension'
          : 'Please approve the connection in your Coinbase Wallet app or scan the QR code';
      case 'switching':
        return 'This may take a few seconds';
      case 'fetching':
        return 'Retrieving your token balance from the blockchain';
      default:
        return 'Please wait...';
    }
  };

  return (
    <div className="connecting-card">
      <div className="connecting-content">
        <div className="connecting-spinner-large">
          <div className="spinner-ring"></div>
        </div>
        <h3>{getStepMessage()}</h3>
        <p className="connecting-subtitle">
          {getSubtitleMessage()}
        </p>
        {step === 'connecting' && !connectionInfo.hasExtension && (
          <div className="mobile-connection-hint">
            <p>💡 <strong>Tip:</strong> If you&apos;re on a laptop, you can install the Coinbase Wallet browser extension for faster connections.</p>
          </div>
        )}
        {error && (
          <div className="error-message-inline">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

