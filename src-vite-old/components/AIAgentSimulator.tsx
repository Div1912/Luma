import React, { useState } from 'react';

interface CartItem {
  name: string;
  price: number;
}

interface AIAgentSimulatorProps {
  onCheckout: (amount: bigint) => Promise<void>;
  isProcessing: boolean;
}

export const AIAgentSimulator: React.FC<AIAgentSimulatorProps> = ({ onCheckout, isProcessing }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const catalog = [
    { name: 'Organic Milk', price: 50 },
    { name: 'Avocado Toast', price: 150 },
    { name: 'Kobe Beef', price: 800 },
    { name: 'Premium Caviar', price: 3000 },
  ];

  const addToCart = (item: CartItem) => {
    setCart([...cart, item]);
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (total === 0) return;
    await onCheckout(BigInt(total));
    setCart([]);
  };

  return (
    <div className="glass-panel flex-col gap-lg">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>AI Grocery Assistant</h2>
        <div className="wallet-badge" style={{ borderColor: 'var(--accent-success)', color: 'var(--accent-success)', fontSize: '0.75rem' }}>
          <span className="status-dot active"></span> AUTONOMOUS
        </div>
      </div>

      <div className="flex-col gap-md">
        <p>Agent is scanning available items and adding them to cart based on user preferences.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {catalog.map(item => (
            <button 
              key={item.name} 
              className="btn btn-secondary"
              onClick={() => addToCart(item)}
              disabled={isProcessing}
            >
              + {item.name} (₹{item.price})
            </button>
          ))}
        </div>
      </div>

      <div className="divider"></div>

      <div className="flex-col gap-sm" style={{ flexGrow: 1 }}>
        <h3>Current Cart Intent</h3>
        
        {cart.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '1rem 0' }}>Cart is empty</div>
        ) : (
          <div className="simulation-items">
            {cart.map((item, idx) => (
              <div key={idx} className="sim-item">
                <span className="sim-item-name">{item.name}</span>
                <span className="sim-item-price">₹{item.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sim-item" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-focus)' }}>
        <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL INTENT</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{total}</span>
      </div>

      <button 
        className="btn btn-primary" 
        onClick={handleCheckout}
        disabled={isProcessing || total === 0}
        style={{ marginTop: '1rem' }}
      >
        {isProcessing ? 'Proving on-chain...' : 'Execute Purchase'}
      </button>
    </div>
  );
};
