import React from 'react';
import { useMidnight } from '../hooks/useMidnight';

export default function WalletConnect({ walletState, connectLace, disconnect }: any) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Wallet Connection</h2>
        <p className="card-description">Connect your Lace wallet to interact with the Ghost contract.</p>
      </div>
      
      {!walletState.isConnected ? (
        <div>
          <button className="btn btn-primary" onClick={connectLace}>
            Connect Lace Wallet
          </button>
          {walletState.error && (
            <p className="privacy-label" style={{ color: 'var(--danger-color)', marginTop: '0.5rem' }}>
              Error: {walletState.error}
            </p>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="status-badge status-connected">Connected</span>
          </div>
          <div className="wallet-address">
            {walletState.address}
          </div>
          <button className="btn btn-secondary" onClick={disconnect}>
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
