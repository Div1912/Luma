"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createGhostContract, deployGhostContract } from "./providers";
import { ledger } from '../../managed/ghost/contract/index.js';

export type WalletState = {
  address?: string;
  isConnected: boolean;
  error?: string;
};

export interface MidnightContextType {
  walletState: WalletState;
  connectLace: () => Promise<void>;
  disconnect: () => Promise<void>;
  api: any;
  deploy: (limit: bigint) => Promise<void>;
  disconnectLace: () => void;
  connect: (contractAddress: string) => Promise<void>;
  spend: (amount: bigint) => Promise<any>;
  ghost: any;
  publicState: { total_spent: bigint; spending_limit: bigint } | null;
}

export const MidnightContext = createContext<MidnightContextType | undefined>(undefined);

export function MidnightProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({ isConnected: false });
  const [api, setApi] = useState<any>(null);
  const [ghost, setGhost] = useState<any>(null);
  const [publicState, setPublicState] = useState<{ total_spent: bigint; spending_limit: bigint } | null>(null);

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
      
      // Request connection to preprod network
      const apiInstance = await provider.connect('preprod');
      setApi(apiInstance);
      
      const state = await apiInstance.getUnshieldedAddress();
      setWalletState({
        address: state.unshieldedAddress,
        isConnected: true,
        error: undefined
      });
      
    } catch (err: any) {
      setWalletState({
        isConnected: false,
        error: err.message || 'Failed to connect wallet'
      });
      throw err; // throw so caller can catch
    }
  };

  const disconnectLace = () => {
    setApi(null);
    setWalletState({ isConnected: false });
    setGhost(null);
    setPublicState(null);
    localStorage.removeItem('ghost_contract_address');
  };

  const deploy = async (limit: bigint) => {
    if (!api) throw new Error('Wallet not connected');
    try {
      setWalletState(prev => ({ ...prev, error: undefined }));
      const { ghost: g, address: deployedAddress, providers } = await deployGhostContract(api, limit);
      setGhost(g);
      setWalletState(prev => ({ ...prev, address: deployedAddress }));

      // Subscribe to public state
      providers.publicDataProvider.contractStateObservable(deployedAddress, { type: 'latest' }).subscribe((state: any) => {
        try {
          setPublicState(ledger(state.data));
        } catch (e) {
          console.error("Failed to parse ledger state", e);
        }
      });
      
    } catch (err: any) {
      // FiberFailure from Effect-TS: err.cause.failure is the real error
      const failure = err?.cause?.failure ?? err?.cause?.error ?? err?.cause ?? err;
      const msg = failure?.message || JSON.stringify(failure) || err?.message || String(err);
      console.error('Deploy error (failure):', failure);
      setWalletState(prev => ({ ...prev, error: msg }));
      throw new Error(msg);
    }
  };

  const connect = async (contractAddress: string) => {
    if (!api) throw new Error('Wallet not connected');
    try {
      setWalletState(prev => ({ ...prev, error: undefined }));
      const { ghost: g, providers } = await createGhostContract(api, contractAddress);
      setGhost(g);
      setWalletState(prev => ({ ...prev, address: contractAddress }));

      providers.publicDataProvider.contractStateObservable(contractAddress, { type: 'latest' }).subscribe((state: any) => {
        try {
          setPublicState(ledger(state.data));
        } catch (e) {
          console.error("Failed to parse ledger state", e);
        }
      });
    } catch (err: any) {
      const errMsg = err.message || String(err);
      console.error("Contract connect error:", err);
      
      // If the extension killed the channel, we must reconnect
      if (errMsg.includes('shutdown') || errMsg.includes('object can no longer be used')) {
        setWalletState({ isConnected: false, error: 'Wallet connection dropped. Please reconnect.' });
        setApi(null);
      } else {
        setWalletState(prev => ({ ...prev, error: errMsg }));
      }
      throw err;
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

  return (
    <MidnightContext.Provider value={{
      walletState,
      connectLace,
      disconnect,
      disconnectLace,
      api,
      deploy,
      connect,
      spend,
      ghost,
      publicState
    }}>
      {children}
    </MidnightContext.Provider>
  );
}
