'use client';

interface WalletConnectingProps {
  step: 'connecting' | 'switching' | 'fetching';
  error?: string | null;
}

export default function WalletConnecting({ step, error }: WalletConnectingProps) {
  const getStepMessage = () => {
    switch (step) {
      case 'connecting':
        return 'Connecting to Coinbase Wallet...';
      case 'switching':
        return 'Switching to BNB Smart Chain...';
      case 'fetching':
        return 'Fetching your TETH balance...';
      default:
        return 'Processing...';
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
          {step === 'connecting' && 'Please approve the connection in your wallet'}
          {step === 'switching' && 'This may take a few seconds'}
          {step === 'fetching' && 'Retrieving your token balance from the blockchain'}
        </p>
        {error && (
          <div className="error-message-inline">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

