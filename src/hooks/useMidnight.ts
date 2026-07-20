import { useState, useEffect } from 'react';

type WalletState = {
  address?: string;
  isConnected: boolean;
  error?: string;
};

export function useMidnight() {
  const [walletState, setWalletState] = useState<WalletState>({ isConnected: false });
  const [api, setApi] = useState<any>(null);

  useEffect(() => {
    // Check if previously connected (mock state check since we don't persist yet, 
    // but standard Midnight dApp flow requires connecting first anyway)
  }, []);

  const connectLace = async () => {
    try {
      const midnight = (window as any).midnight;
      if (!midnight || !midnight.mnLace) {
        throw new Error('Lace wallet is not installed or not available on Midnight network.');
      }

      // The Lace provider object
      const provider = midnight.mnLace;
      
      // Request enablement
      const api = await provider.enable();
      setApi(api);
      
      // Get state
      const state = await api.state();
      setWalletState({
        address: state.address,
        isConnected: true
      });
      
    } catch (err: any) {
      setWalletState({
        isConnected: false,
        error: err.message || 'Failed to connect wallet'
      });
    }
  };

  const disconnect = async () => {
    setApi(null);
    setWalletState({ isConnected: false });
  };

  return {
    walletState,
    connectLace,
    disconnect,
    api
  };
}
