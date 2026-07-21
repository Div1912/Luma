import { useState, useEffect } from 'react';
import { createGhostContract, deployGhostContract } from './providers';

type WalletState = {
  address?: string;
  isConnected: boolean;
  error?: string;
};

export function useMidnight() {
  const [walletState, setWalletState] = useState<WalletState>({ isConnected: false });
  const [api, setApi] = useState<any>(null);
  const [ghost, setGhost] = useState<any>(null);
  const [publicState, setPublicState] = useState<{ total_spent: bigint, spending_limit: bigint } | null>(null);

  useEffect(() => {
    // Check if previously connected (mock state check since we don't persist yet, 
    // but standard Midnight dApp flow requires connecting first anyway)
  }, []);

  const connectLace = async () => {
    try {
      const midnight = (window as any).midnight;
      if (!midnight) {
        throw new Error('No Midnight wallet detected. Please install Lace.');
      }
      
      const wallets = Object.values(midnight) as any[];
      const provider = wallets.find(w => w && typeof w === 'object' && 'apiVersion' in w && typeof w.connect === 'function');
      
      if (!provider) {
        throw new Error('Lace wallet is installed but not enabled or compatible.');
      }
      
      // Request connection
      const api = await provider.connect('preprod');
      setApi(api);
      
      const state = await api.getUnshieldedAddress();
      setWalletState({
        address: state.unshieldedAddress,
        isConnected: true
      });
      
    } catch (err: any) {
      setWalletState({
        isConnected: false,
        error: err.message || 'Failed to connect wallet'
      });
    }
  };

  const deploy = async (limit: bigint) => {
    if (!api) throw new Error('Wallet not connected');
    try {
      setWalletState(prev => ({ ...prev, error: undefined }));
      const { ghost: g, address: deployedAddress, providers } = await deployGhostContract(api, limit);
      setGhost(g);
      setWalletState(prev => ({ ...prev, address: deployedAddress }));

      // Subscribe to public state
      providers.publicDataProvider.contractStateObservable(deployedAddress, {} as any).subscribe((state: any) => {
        setPublicState(state.data);
      });
      
    } catch (err: any) {
      setWalletState(prev => ({ ...prev, error: err.message || String(err) }));
    }
  };

  const connect = async (contractAddress: string) => {
    if (!api) throw new Error('Wallet not connected');
    try {
      setWalletState(prev => ({ ...prev, error: undefined }));
      const { ghost: g, providers } = await createGhostContract(api, contractAddress);
      setGhost(g);
      setWalletState(prev => ({ ...prev, address: contractAddress }));

      providers.publicDataProvider.contractStateObservable(contractAddress, {} as any).subscribe((state: any) => {
        setPublicState(state.data);
      });
    } catch (err: any) {
      setWalletState(prev => ({ ...prev, error: err.message || String(err) }));
    }
  };

  const spend = async (amount: bigint) => {
    if (!ghost) throw new Error('Ghost contract not initialized');
    try {
      setWalletState(prev => ({ ...prev, error: undefined }));
      const tx = await ghost.callTx.spend(amount);
      return tx;
    } catch (err: any) {
      setWalletState(prev => ({ ...prev, error: err.message || String(err) }));
      throw err;
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
    api,
    deploy,
    connect,
    spend,
    ghost,
    publicState
  };
}
