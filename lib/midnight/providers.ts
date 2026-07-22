import { Contract, Witnesses, Circuits } from '../../managed/ghost/contract/index.js';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { inMemoryPrivateStateProvider } from './in-memory-private-state-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FinalizedTransaction, Transaction, SignatureEnabled, Proof, Binding, TransactionId } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { toHex, fromHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

// Initialize Midnight network
setNetworkId('preprod');

const compiledGhostContract = CompiledContract.make(
  'ghost', 
  Contract as any
).pipe(
  CompiledContract.withWitnesses({} as never)
);

export async function createGhostContract(api: any, contractAddress: string) {
  const config = await api.getConfiguration();
  const shieldedAddresses = await api.getShieldedAddresses();

  const privateStateProvider = inMemoryPrivateStateProvider();
  
  // ZK keys are served via our API routes at /api/keys/* and /api/zkir/*
  const zkConfigProvider = new FetchZkConfigProvider(`${window.location.origin}/api`, fetch.bind(window));
  
  const proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);
  const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri, window.WebSocket as any);

  const walletProvider = {
    getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
    balanceTx: async (tx: UnboundTransaction, ttl?: Date) => {
      const serializedTx = toHex(tx.serialize());
      const received = await api.balanceUnsealedTransaction(serializedTx);
      return Transaction.deserialize<SignatureEnabled, Proof, Binding>('signature', 'proof', 'binding', fromHex(received.tx));
    },
  };

  const midnightProvider = {
    submitTx: async (tx: FinalizedTransaction) => {
      await api.submitTransaction(toHex(tx.serialize()));
      const txIdentifiers = tx.identifiers();
      return txIdentifiers[0];
    }
  };

  const providers = {
    privateStateProvider,
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    walletProvider,
    midnightProvider
  };

  const contract = new Contract({} as any);
  
  const ghost = await findDeployedContract(providers as any, {
    contractAddress,
    compiledContract: compiledGhostContract as any,
    initialPrivateState: {} as any,
    privateStateId: 'ghost-join'
  } as any);

  return { providers, contract, ghost };
}

export async function deployGhostContract(api: any, initialLimit: bigint) {
  const config = await api.getConfiguration();
  const shieldedAddresses = await api.getShieldedAddresses();
  const privateStateProvider = inMemoryPrivateStateProvider();
  // ZK keys are served via our API routes at /api/keys/* and /api/zkir/*
  const zkConfigProvider = new FetchZkConfigProvider(`${window.location.origin}/api`, fetch.bind(window));
  const proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);
  const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri, window.WebSocket as any);

  const walletProvider = {
    getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
    balanceTx: async (tx: UnboundTransaction, ttl?: Date) => {
      const serializedTx = toHex(tx.serialize());
      const received = await api.balanceUnsealedTransaction(serializedTx);
      return Transaction.deserialize<SignatureEnabled, Proof, Binding>('signature', 'proof', 'binding', fromHex(received.tx));
    },
  };

  const midnightProvider = {
    submitTx: async (tx: FinalizedTransaction) => {
      await api.submitTransaction(toHex(tx.serialize()));
      const txIdentifiers = tx.identifiers();
      return txIdentifiers[0];
    }
  };

  const providers = {
    privateStateProvider,
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    walletProvider,
    midnightProvider
  };

  const contract = new Contract({} as any);
  
  // Actually perform the deployment transaction
  const ghost = await deployContract(providers as any, {
    privateStateId: 'ghost-deploy',
    compiledContract: compiledGhostContract as any,
    args: [initialLimit],
    initialPrivateState: {} as any
  } as any);

  return { 
    ghost, 
    address: ghost.deployTxData.public.contractAddress, 
    providers 
  };
}
