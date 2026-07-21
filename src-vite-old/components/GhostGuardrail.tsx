import React from 'react';

interface GhostGuardrailProps {
  publicState: { total_spent: bigint, spending_limit: bigint } | null;
  logs: { time: string, msg: string, type: 'info' | 'success' | 'error' }[];
  address: string;
}

export const GhostGuardrail: React.FC<GhostGuardrailProps> = ({ publicState, logs, address }) => {
  const limit = publicState ? Number(publicState.spending_limit) : 0;
  const spent = publicState ? Number(publicState.total_spent) : 0;
  const remaining = Math.max(0, limit - spent);

  const formatAddr = (addr: string) => addr ? `${addr.slice(0, 8)}...${addr.slice(-8)}` : 'NOT DEPLOYED';

  return (
    <div className="glass-panel flex-col gap-lg" style={{ background: 'rgba(10, 15, 25, 0.6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Ghost Verifiable Layer</h2>
        <div className="wallet-badge" style={{ borderColor: 'var(--text-tertiary)', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
          <span className="status-dot"></span> PREPROD
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="sim-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="input-label">POLICY LIMIT</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>₹{limit}</div>
        </div>
        <div className="sim-item" style={{ flexDirection: 'column', alignItems: 'flex-start', borderColor: 'rgba(52, 211, 153, 0.3)', background: 'rgba(52, 211, 153, 0.05)' }}>
          <div className="input-label" style={{ color: 'var(--accent-success)' }}>AVAILABLE TO AGENT</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-success)' }}>₹{remaining}</div>
        </div>
      </div>

      <div className="sim-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <div className="input-label">TOTAL SPENT</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>₹{spent}</div>
      </div>

      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
        CONTRACT ID: {formatAddr(address)}
      </div>

      <div className="log-container" style={{ flexGrow: 1, height: '200px' }}>
        {logs.length === 0 ? (
          <span style={{ color: 'var(--text-tertiary)' }}>Ghost Core listening for ZK proofs...</span>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="log-entry">
              <span className="log-timestamp">[{log.time}]</span>
              <span className="log-prefix">[GHOST]</span>{' '}
              <span className={log.type === 'success' ? 'log-success' : log.type === 'error' ? 'log-error' : 'log-action'}>
                {log.msg}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
