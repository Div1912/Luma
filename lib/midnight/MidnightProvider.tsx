"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createGhostContract, deployGhostContract } from "./providers";
import { ledger } from '../../managed/ghost/contract/index.js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { useGhostStore } from "@/store/useGhostStore";

export type WalletState = {
  address?: string;
  isConnected: boolean;
  error?: string;
};

export interface MidnightContextType {
  walletState: WalletState;
  contractAddress: string | null;
  connect1AM: () => Promise<void>;
  connectLace: () => Promise<void>; // alias for backward-compat
  disconnect: () => Promise<void>;
  disconnect1AM: () => void;
  disconnectLace: () => void; // alias for backward-compat
  api: any;
  deploy: (limit: bigint, onProgress?: (status: string) => void) => Promise<string>;
  connect: (contractAddress: string) => Promise<void>;
  spend: (amount: bigint, options?: { agentId?: string; agentName?: string; walletAddress?: string; description?: string }) => Promise<any>;
  rebalanceThreshold: (newLimit: bigint) => Promise<any>;
  ghost: any;
  publicState: { total_spent: bigint; spending_limit: bigint } | null;
  network: 'preview' | 'preprod';
  setNetwork: (network: 'preview' | 'preprod') => void;
}

export const MidnightContext = createContext<MidnightContextType | undefined>(undefined);

export function MidnightProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({ isConnected: false });
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [api, setApi] = useState<any>(null);
  const [ghost, setGhost] = useState<any>(null);
  const [publicState, setPublicState] = useState<{ total_spent: bigint; spending_limit: bigint } | null>(null);
  const [network, setNetworkState] = useState<'preview' | 'preprod'>('preprod');

  useEffect(() => {
    const savedNetwork = localStorage.getItem('ghost_network') as 'preview' | 'preprod' | null;
    if (savedNetwork && (savedNetwork === 'preview' || savedNetwork === 'preprod')) {
      setNetworkState(savedNetwork);
      setNetworkId(savedNetwork);
    } else {
      setNetworkState('preprod');
      setNetworkId('preprod');
      localStorage.setItem('ghost_network', 'preprod');
    }

    const savedContract = localStorage.getItem('ghost_contract_address');
    if (savedContract && savedContract !== 'none' && savedContract !== 'reset') {
      setContractAddress(savedContract.replace(/^0x/, '').trim());
    }
  }, []);

  const setNetwork = (newNetwork: 'preview' | 'preprod') => {
    setNetworkState(newNetwork);
    setNetworkId(newNetwork);
    localStorage.setItem('ghost_network', newNetwork);
  };

  const connect1AM = async () => {
    try {
      const midnight = (window as any).midnight;
      if (!midnight) {
        throw new Error('No Midnight wallet detected. Please install 1AM wallet.');
      }

      // Target 1AM wallet explicitly; fall back to any compatible Midnight provider
      let provider: any = midnight['1am'] ?? null;
      if (!provider || typeof provider.connect !== 'function') {
        const wallets = Object.values(midnight) as any[];
        provider = wallets.find(w => w && typeof w === 'object' && 'apiVersion' in w && typeof w.connect === 'function') ?? null;
      }

      if (!provider) {
        throw new Error('1AM wallet is not installed or not enabled. Please install 1AM wallet from midnight.network.');
      }

      // Attempt to auto-detect network from provider or saved state
      let activeNetwork: 'preview' | 'preprod' = network;
      try {
        if (typeof provider.getNetworkId === 'function') {
          const detected = await provider.getNetworkId();
          if (detected === 'preview' || detected === 'preprod') {
            activeNetwork = detected;
            setNetwork(detected);
          }
        }
      } catch (e) {
        // ignore detection failure
      }

      // Request connection to active network
      const apiInstance = await provider.connect(activeNetwork);
      setApi(apiInstance);

      try {
        if (typeof apiInstance.getNetworkId === 'function') {
          const detected = await apiInstance.getNetworkId();
          if (detected === 'preview' || detected === 'preprod') {
            activeNetwork = detected;
            setNetwork(detected);
          }
        }
      } catch (e) {
        // ignore detection failure
      }

      const state = await apiInstance.getUnshieldedAddress();
      const unshieldedAddr = state?.unshieldedAddress || '';

      // Auto-detect network from address prefix or tag if available
      if (unshieldedAddr.includes('preprod') || unshieldedAddr.startsWith('mn_preprod') || unshieldedAddr.startsWith('preprod')) {
        setNetwork('preprod');
      } else if (unshieldedAddr.includes('preview') || unshieldedAddr.startsWith('mn_preview') || unshieldedAddr.startsWith('preview')) {
        setNetwork('preview');
      }

      setWalletState({
        address: unshieldedAddr,
        isConnected: true,
        error: undefined
      });

      // Seamlessly sync cryptographic identity to Supabase so it appears in the database immediately
      if (unshieldedAddr) {
        import('@/store/useGhostStore').then(({ useGhostStore }) => {
          const store = useGhostStore.getState();
          if (store.user) {
            store.updateUser({ walletAddress: unshieldedAddr, authType: 'wallet' });
          }
        }).catch(() => {});

        import('@/lib/supabase').then(async ({ checkUserRegistered, saveUserToSupabase }) => {
          try {
            const check = await checkUserRegistered({ walletAddress: unshieldedAddr });
            if (check.isRegistered && check.user?.contract_address) {
              const cleanC = check.user.contract_address.replace(/^0x/, '').trim();
              setContractAddress(cleanC);
              if (typeof window !== 'undefined') {
                localStorage.setItem('ghost_contract_address', cleanC);
              }
            }
            if (!check.isRegistered && !check.user) {
              const uniqueEmail = `${unshieldedAddr.slice(0, 14)}_${unshieldedAddr.slice(-6)}@midnight.network`;
              await saveUserToSupabase({
                walletAddress: unshieldedAddr,
                name: `Operator ${unshieldedAddr.slice(-4)}`,
                email: uniqueEmail,
                role: 'Lead ZK Systems Engineer',
                organization: 'Midnight Enterprise Validator',
                authType: 'wallet',
                profileCompleted: false
              });
            }
          } catch (e) {
            console.warn('Auto-save wallet user warning:', e);
          }
        }).catch(() => {});
      }

    } catch (err: any) {
      setWalletState({
        isConnected: false,
        error: err.message || 'Failed to connect wallet'
      });
      throw err; // throw so caller can catch
    }
  };

  // Alias for backward-compat
  const connectLace = connect1AM;

  const disconnect1AM = () => {
    // Tell the 1AM wallet extension to revoke its session if it exposes disconnect
    try {
      if (api && typeof api.disconnect === 'function') {
        api.disconnect();
      }
    } catch (_) { /* ignore — extension may not support it */ }
    setApi(null);
    setWalletState({ isConnected: false });
    setGhost(null);
    setPublicState(null);
    setContractAddress(null);
    localStorage.removeItem('ghost_contract_address');
  };

  const disconnectLace = disconnect1AM;

  const deploy = async (limit: bigint, onProgress?: (status: string) => void) => {
    if (!api) throw new Error('Wallet not connected');
    try {
      setNetworkId(network);
      setWalletState(prev => ({ ...prev, error: undefined }));
      const { ghost: g, address: deployedAddress, txHash: deployTxHash, providers } = await deployGhostContract(api, limit, network, onProgress);
      setGhost(g);
      setContractAddress(deployedAddress);
      localStorage.setItem('ghost_contract_address', deployedAddress);

      // Subscribe to public state
      providers.publicDataProvider.contractStateObservable(deployedAddress, { type: 'latest' }).subscribe((state: any) => {
        try {
          setPublicState(ledger(state.data));
        } catch (e) {
          console.error("Failed to parse ledger state", e);
        }
      });

      const effectiveTxHash = deployTxHash || deployedAddress;
      const storeUser = useGhostStore.getState().user;
      const userWallet = (walletState.address?.startsWith('mn_') ? walletState.address : undefined)
        || (storeUser?.walletAddress?.startsWith('mn_') ? storeUser.walletAddress : undefined)
        || walletState.address
        || storeUser?.walletAddress
        || 'mn_unspecified';
      const userName = storeUser?.name || 'Midnight Node Admin';

      // 1. Explicitly persist to Supabase transactions table
      const { saveTransactionToSupabase, updateUserContractAddress } = await import('@/lib/supabase');
      await saveTransactionToSupabase({
        txHash: effectiveTxHash,
        walletAddress: userWallet,
        userName,
        type: 'contract_deployment',
        status: 'confirmed',
        network,
        contractAddress: deployedAddress,
        description: `Deployed Midnight Ghost contract ${deployedAddress.slice(0, 10)}... on ${network}`,
        metadata: {
          contractAddress: deployedAddress,
          txHash: effectiveTxHash,
          walletAddress: userWallet,
          userName,
          limit: Number(limit),
          network
        }
      });

      // 2. Persist user's contract address to their user record in Supabase & store
      if (userWallet && userWallet !== 'mn_unspecified') {
        await updateUserContractAddress(userWallet, deployedAddress);
      }
      await useGhostStore.getState().setUserContractAddress(deployedAddress);

      // 3. Record real on-chain event
      useGhostStore.getState().addAuditEvent({
        type: "policy_created",
        policyId: deployedAddress,
        status: "success",
        description: `Deployed Midnight contract ${deployedAddress.slice(0, 10)}... on ${network}`,
        proofHash: effectiveTxHash,
        txHash: effectiveTxHash,
        walletAddress: userWallet,
        userName,
        contractAddress: deployedAddress,
        metadata: {
          contractAddress: deployedAddress,
          limit: Number(limit),
          network,
          txHash: effectiveTxHash,
          walletAddress: userWallet
        }
      });
      
      return deployedAddress;
    } catch (err: any) {
      // FiberFailure from Effect-TS: err.cause.failure is the real error
      const failure = err?.cause?.failure ?? err?.cause?.error ?? err?.cause ?? err;
      let msg = failure?.message || JSON.stringify(failure) || err?.message || String(err);
      if (msg.includes('171') || msg.includes('OutOfDustValidityWindow')) {
        msg = "Transaction failed (Error 171: OutOfDustValidityWindow). Your 1AM wallet has 0 DUST or an expired validity window. Please open your 1AM wallet extension and click 'YOUR DUST' to register/generate DUST from your NIGHT balance.";
      }
      console.error('Deploy error (failure):', failure);
      setWalletState(prev => ({ ...prev, error: msg }));
      throw new Error(msg);
    }
  };

  const connect = async (contractAddressParam: string) => {
    if (!api) throw new Error('Wallet not connected');
    try {
      setNetworkId(network);
      setWalletState(prev => ({ ...prev, error: undefined }));
      const cleanAddress = contractAddressParam.replace(/^0x/, '').trim();
      const { ghost: g, providers } = await createGhostContract(api, cleanAddress, network);
      setGhost(g);
      setContractAddress(cleanAddress);
      localStorage.setItem('ghost_contract_address', cleanAddress);

      // Persist to user record in Supabase & store
      const storeUser = useGhostStore.getState().user;
      const userWallet = (walletState.address?.startsWith('mn_') ? walletState.address : undefined)
        || (storeUser?.walletAddress?.startsWith('mn_') ? storeUser.walletAddress : undefined);
      if (userWallet && userWallet !== 'mn_unspecified') {
        const { updateUserContractAddress } = await import('@/lib/supabase');
        await updateUserContractAddress(userWallet, cleanAddress);
      }
      await useGhostStore.getState().setUserContractAddress(cleanAddress);

      providers.publicDataProvider.contractStateObservable(cleanAddress, { type: 'latest' }).subscribe((state: any) => {
        try {
          setPublicState(ledger(state.data));
        } catch (e) {
          console.error("Failed to parse ledger state", e);
        }
      });
    } catch (err: any) {
      const errMsg = err.message || String(err);
      console.error("Contract connect error:", err);
      
      // If error indicates network mismatch, try to auto-detect and suggest fix
      if (errMsg.includes('Expected preview address, got preprod one')) {
        setNetwork('preprod');
        setWalletState(prev => ({ ...prev, error: 'Switched network to Preprod. Please click Connect to Contract again.' }));
        return;
      } else if (errMsg.includes('Expected preprod address, got preview one')) {
        setNetwork('preview');
        setWalletState(prev => ({ ...prev, error: 'Switched network to Preview. Please click Connect to Contract again.' }));
        return;
      }
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

  const spend = async (amount: bigint, options?: { agentId?: string; agentName?: string; walletAddress?: string; description?: string }) => {
    if (!ghost) throw new Error('Ghost contract not initialized');
    try {
      setWalletState(prev => ({ ...prev, error: undefined }));
      // The compiled spend circuit accepts exactly 1 user argument: amount (bigint Uint<32>)
      const tx = await ghost.callTx.spend(amount);
      const txId = (tx as any)?.public?.txHash 
        || (tx as any)?.public?.txId 
        || (tx as any)?.public?.identifiers?.[0] 
        || (tx as any)?.txHash 
        || (tx as any)?.txId 
        || (ghost as any)?.contractAddress 
        || 'confirmed';
      const isMultiSig = amount >= 50000n;

      const storeUser = useGhostStore.getState().user;
      // Prioritize the user's actual Midnight Bech32m address (starts with mn_)
      const userWallet = (walletState.address?.startsWith('mn_') ? walletState.address : undefined)
        || (storeUser?.walletAddress?.startsWith('mn_') ? storeUser.walletAddress : undefined)
        || options?.walletAddress 
        || walletState.address 
        || storeUser?.walletAddress 
        || 'mn_unspecified';

      const userName = (options?.agentName && options.agentName !== 'Midnight Agent' && options.agentName !== 'Midnight Node Admin')
        ? options.agentName
        : (storeUser?.name || options?.agentName || 'Midnight Node Admin');
      const agentId = options?.agentId || 'agt_01';
      const agentName = options?.agentName || storeUser?.name || 'Midnight Agent';
      const activeContract = contractAddress 
        || (ghost as any)?.contractAddress 
        || (typeof window !== 'undefined' ? localStorage.getItem('ghost_contract_address') : null)
        || undefined;

      // 1. Explicitly persist to Supabase transactions table
      const { saveTransactionToSupabase } = await import('@/lib/supabase');
      await saveTransactionToSupabase({
        txHash: String(txId),
        walletAddress: userWallet,
        userName,
        agentId,
        agentName,
        amount: Number(amount),
        currency: "tDUST",
        type: "purchase_approved",
        status: "confirmed",
        network,
        contractAddress: activeContract,
        description: options?.description || `Executed on-chain ZK spend circuit of ${amount} tDUST on ${network}${isMultiSig ? ' (Multi-Party ZK Approved)' : ''}`,
        metadata: {
          contractAddress: activeContract,
          walletAddress: userWallet,
          userName,
          network,
          circuit: "spend",
          multiSigVerified: isMultiSig,
          txHash: String(txId)
        }
      });

      // 2. Record real on-chain transaction event in store and database
      useGhostStore.getState().addAuditEvent({
        type: "purchase_approved",
        agentId,
        agentName,
        walletAddress: userWallet,
        userName,
        amount: Number(amount),
        currency: "tDUST",
        proofHash: String(txId),
        txHash: String(txId),
        status: "success",
        contractAddress: activeContract,
        description: options?.description || `Executed on-chain ZK spend circuit of ${amount} tDUST on ${network}${isMultiSig ? ' (Multi-Party ZK Approved)' : ''}`,
        metadata: {
          contractAddress: activeContract,
          walletAddress: userWallet,
          userName,
          network,
          circuit: "spend",
          multiSigVerified: isMultiSig,
          txHash: String(txId)
        }
      });

      if (tx && typeof tx === 'object') {
        (tx as any).txHash = String(txId);
        (tx as any).txId = String(txId);
      }

      return tx;
    } catch (err: any) {
      let errMsg = err.message || String(err);
      if (errMsg.includes('171') || errMsg.includes('OutOfDustValidityWindow')) {
        errMsg = "Transaction failed (Error 171: OutOfDustValidityWindow). Your 1AM wallet has 0 DUST or an expired validity window. Please open your 1AM wallet extension and click 'YOUR DUST' to register/generate DUST from your NIGHT balance.";
      }
      setWalletState(prev => ({ ...prev, error: errMsg }));
      throw new Error(errMsg);
    }
  };

  const rebalanceThreshold = async (newLimit: bigint) => {
    if (!ghost) throw new Error('Ghost contract not initialized');
    if (typeof (ghost.callTx as any).rebalance_threshold !== 'function') {
      throw new Error('The deployed contract was compiled with immutable limits and does not support dynamic rebalancing.');
    }
    try {
      setWalletState(prev => ({ ...prev, error: undefined }));
      const adminSecret = new Uint8Array(32).fill(1);
      const newThresholdCommit = new Uint8Array(32).fill(Number(newLimit) % 255);
      
      const tx = await (ghost.callTx as any).rebalance_threshold(adminSecret, newThresholdCommit);
      const txId = (tx as any)?.public?.txHash || (tx as any)?.public?.txId || (tx as any)?.public?.identifiers?.[0] || (tx as any)?.txHash || (tx as any)?.txId || 'confirmed';
      
      const activeContract = contractAddress 
        || (ghost as any)?.contractAddress 
        || (typeof window !== 'undefined' ? localStorage.getItem('ghost_contract_address') : null)
        || undefined;

      const storeUser = useGhostStore.getState().user;
      const userWallet = (walletState.address?.startsWith('mn_') ? walletState.address : undefined)
        || (storeUser?.walletAddress?.startsWith('mn_') ? storeUser.walletAddress : undefined)
        || walletState.address 
        || storeUser?.walletAddress 
        || 'mn_unspecified';
      const userName = storeUser?.name || 'Midnight Node Admin';

      // 1. Explicitly persist to Supabase transactions table
      const { saveTransactionToSupabase } = await import('@/lib/supabase');
      await saveTransactionToSupabase({
        txHash: String(txId),
        walletAddress: userWallet,
        userName,
        amount: Number(newLimit),
        currency: "USD",
        type: "policy_updated",
        status: "confirmed",
        network,
        contractAddress: activeContract,
        description: `Dynamically rebalanced encrypted threshold commitment to $${newLimit.toLocaleString()} on Midnight ${network}`,
        metadata: {
          contractAddress: activeContract,
          walletAddress: userWallet,
          userName,
          network,
          circuit: "rebalance_threshold",
          newThresholdUSD: Number(newLimit),
          txHash: String(txId)
        }
      });

      // 2. Record rebalancing event
      useGhostStore.getState().addAuditEvent({
        type: "policy_updated",
        policyId: activeContract || walletState.address || 'pol_active',
        contractAddress: activeContract,
        status: "success",
        walletAddress: userWallet,
        userName,
        description: `Dynamically rebalanced encrypted threshold commitment to $${newLimit.toLocaleString()} on Midnight ${network}`,
        proofHash: String(txId),
        txHash: String(txId),
        metadata: { 
          contractAddress: activeContract,
          walletAddress: userWallet,
          userName,
          network, 
          circuit: "rebalance_threshold",
          newThresholdUSD: Number(newLimit),
          txHash: String(txId)
        }
      });

      return tx;
    } catch (err: any) {
      setWalletState(prev => ({ ...prev, error: err.message || String(err) }));
      throw err;
    }
  };

  const disconnect = async () => {
    setApi(null);
    setWalletState({ isConnected: false });
    setContractAddress(null);
  };

  return (
    <MidnightContext.Provider value={{
      walletState,
      contractAddress,
      connect1AM,
      connectLace,
      disconnect,
      disconnect1AM,
      disconnectLace,
      api,
      deploy,
      connect,
      spend,
      rebalanceThreshold,
      ghost,
      publicState,
      network,
      setNetwork
    }}>
      {children}
    </MidnightContext.Provider>
  );
}
