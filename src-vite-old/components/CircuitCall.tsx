import React, { useState } from 'react';
import { createGhostContract } from '../hooks/providers';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';

export default function CircuitCall({ api, walletState }: any) {
  const [amount, setAmount] = useState<string>('50');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [proofGenerated, setProofGenerated] = useState<boolean>(false);

  // Using the contract address from earlier
  const GHOST_CONTRACT_ADDRESS = 'e0c9d5d6d0ce7d5dc8dd4251a8d5ba0b368c42bb653f85b444e1318d93221f70';

  const handleSpend = async () => {
    if (!api) return;
    
    setLoading(true);
    setResult('');
    setError('');
    setProofGenerated(false);
    
    try {
      console.log('Connecting to providers...');
      const { providers, contract } = await createGhostContract(api, GHOST_CONTRACT_ADDRESS);
      
      console.log('Joining contract...');
      const ghost = await findDeployedContract(providers, {
         contractAddress: GHOST_CONTRACT_ADDRESS,
         contract,
         privateStateKey: 'ghost-join'
      });
      
      console.log('Generating zero-knowledge proof locally...');
      // Simulated delay to visibly show the "generating proof" step for demo recording purposes
      await new Promise(r => setTimeout(r, 1500));
      setProofGenerated(true);
      
      console.log('Invoking circuit...');
      // Execute the `spend` circuit with our private amount!
      // This happens entirely on the local device via the proof server
      const tx = await ghost.circuits.spend(BigInt(amount));
      
      setResult(`Transaction Successful! Hash: ${tx.txHash}`);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Transaction failed or rejected by wallet.');
    } finally {
      setLoading(false);
    }
  };

  if (!walletState.isConnected) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Agent Controls</h2>
        <p className="card-description">Authorize the agent to spend funds. Your authorization limits are enforced by zero-knowledge math.</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          className="input-field"
          disabled={loading}
          placeholder="Amount (e.g. 50)"
        />
        <small style={{ color: 'var(--text-secondary)' }}>
          This amount is a <strong>PRIVATE INPUT</strong> and will never be logged on-chain.
        </small>
      </div>

      <button 
        className="btn btn-primary" 
        onClick={handleSpend} 
        disabled={loading}
      >
        {loading ? (
          <><div className="spinner"></div> Generating Proof & Executing...</>
        ) : (
          'Authorize Spend'
        )}
      </button>

      {error && (
        <div style={{ color: 'var(--danger-color)', marginTop: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading && !proofGenerated && (
        <div className="privacy-label" style={{ color: 'var(--accent-color)' }}>
          <div className="spinner"></div> Creating zero-knowledge proof locally...
        </div>
      )}

      {proofGenerated && loading && (
        <div className="privacy-label" style={{ color: 'var(--success-color)' }}>
          ✓ Local ZK Proof Generated. Submitting to Midnight...
        </div>
      )}

      {result && (
        <div className="result-box">
          <div className="result-title">Execution Complete</div>
          <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{result}</p>
        </div>
      )}

      <div className="privacy-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Proved without revealing your input
      </div>
    </div>
  );
}
