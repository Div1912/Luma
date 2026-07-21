import React, { useState } from 'react';
import { useMidnight } from '../hooks/useMidnight';
import { AIAgentSimulator } from './AIAgentSimulator';
import { GhostGuardrail } from './GhostGuardrail';

export const GhostDashboard: React.FC = () => {
  const { walletState, connectLace, deploy, spend, address, publicState, isConnected } = useMidnight();
  const [deployBudget, setDeployBudget] = useState('5000');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isProving, setIsProving] = useState(false);
  const [logs, setLogs] = useState<{ time: string, msg: string, type: 'info'|'success'|'error' }[]>([]);

  const addLog = (msg: string, type: 'info'|'success'|'error' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const handleConnect = async () => {
    addLog('Connecting to Lace Wallet...', 'info');
    await connectLace();
    addLog('Lace wallet connected.', 'success');
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    addLog(`Deploying new Ghost contract with policy limit ₹${deployBudget}...`, 'info');
    try {
      await deploy(BigInt(deployBudget));
      addLog('Contract deployed successfully. Policy enforced.', 'success');
    } catch (err: any) {
      addLog(`Deployment failed: ${err.message}`, 'error');
    }
    setIsDeploying(false);
  };

  const handleAgentCheckout = async (amount: bigint) => {
    setIsProving(true);
    addLog(`Agent proposing purchase of ₹${amount.toString()}`, 'info');
    addLog(`Generating ZK proof for spend circuit...`, 'info');
    try {
      await spend(amount);
      addLog(`Proof verified on-chain. Purchase authorized.`, 'success');
    } catch (err: any) {
      addLog(`Transaction Blocked: ${err.message || String(err)}`, 'error');
    }
    setIsProving(false);
  };

  if (!walletState.isConnected) {
    return (
      <div className="flex-col" style={{ minHeight: '100vh' }}>
        <header className="app-header">
          <div className="logo">
            <span className="logo-dot"></span> GHOST CORE
          </div>
          <div className="wallet-badge">
            <span className="status-dot"></span> DISCONNECTED
          </div>
        </header>

        <div className="container flex-center" style={{ flexGrow: 1 }}>
          <div className="intro-container">
            <h1>Verifiable AI Autonomy</h1>
            <p>Connect your Midnight Lace wallet to initialize your on-chain guardrails and securely deploy your agent policies.</p>
            <button className="btn btn-primary" onClick={handleConnect}>
              Connect Lace Wallet
            </button>
            {walletState.error && <div className="error-text">{walletState.error}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="flex-col" style={{ minHeight: '100vh' }}>
        <header className="app-header">
          <div className="logo">
            <span className="logo-dot"></span> GHOST CORE
          </div>
          <div className="wallet-badge connected">
            <span className="status-dot active"></span> 
            {walletState.address?.slice(0,8)}...{walletState.address?.slice(-8)}
          </div>
        </header>

        <div className="container flex-center" style={{ flexGrow: 1 }}>
          <div className="glass-panel flex-col" style={{ maxWidth: '500px', width: '100%' }}>
            <h2>Initialize Guardrail</h2>
            <p style={{ marginBottom: '2rem' }}>
              Set your absolute spending limit. This will deploy a fresh Ghost contract to the Midnight network.
            </p>
            
            <div className="input-group">
              <label className="input-label">Maximum Agent Budget (₹)</label>
              <input 
                type="number" 
                className="input-field" 
                value={deployBudget}
                onChange={e => setDeployBudget(e.target.value)}
              />
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={handleDeploy}
              disabled={isDeploying}
              style={{ width: '100%', marginBottom: '2rem' }}
            >
              {isDeploying ? 'Deploying to Network...' : 'Deploy Policy'}
            </button>
            
            <div className="log-container">
               {logs.map((log, idx) => (
                  <div key={idx} className="log-entry">
                    <span className="log-timestamp">[{log.time}]</span>
                    <span className="log-prefix">[GHOST]</span>{' '}
                    <span className={log.type === 'success' ? 'log-success' : log.type === 'error' ? 'log-error' : 'log-action'}>
                      {log.msg}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col" style={{ minHeight: '100vh' }}>
      <header className="app-header">
        <div className="logo">
          <span className="logo-dot"></span> GHOST CORE
        </div>
        <div className="wallet-badge connected">
          <span className="status-dot active"></span> 
          {walletState.address?.slice(0,8)}...{walletState.address?.slice(-8)}
        </div>
      </header>

      <div className="container" style={{ paddingTop: '3rem' }}>
        <div className="dashboard-grid">
          <AIAgentSimulator 
            onCheckout={handleAgentCheckout}
            isProcessing={isProving}
          />
          <GhostGuardrail 
            publicState={publicState}
            logs={logs}
            address={address}
          />
        </div>
      </div>
    </div>
  );
};
