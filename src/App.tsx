import React from 'react';
import WalletConnect from './components/WalletConnect';
import CircuitCall from './components/CircuitCall';
import { useMidnight } from './hooks/useMidnight';

export default function App() {
  const { walletState, connectLace, disconnect, api } = useMidnight();

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">
          <span style={{ color: 'var(--text-secondary)' }}>/</span> Ghost
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Verifiable Agent Autonomy
        </div>
      </nav>

      <main className="main-content">
        <div style={{ textAlign: 'center', maxWidth: '600px', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '600', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Zero-Knowledge Guardrails
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Execute autonomous agent transactions on the Midnight blockchain. 
            All constraints are enforced mathematically via local proof generation, 
            without ever exposing your private parameters to the network.
          </p>
        </div>

        <WalletConnect 
          walletState={walletState} 
          connectLace={connectLace} 
          disconnect={disconnect} 
        />

        <CircuitCall 
          api={api} 
          walletState={walletState} 
        />
      </main>
    </div>
  );
}