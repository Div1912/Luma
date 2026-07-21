import { Contract, Witnesses, Circuits } from '../../managed/ghost/contract/index.js';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { inMemoryPrivateStateProvider } from './in-memory-private-state-provider.js';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FinalizedTransaction, Transaction, SignatureEnabled, Proof, Binding, TransactionId } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { toHex, fromHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

const compiledGhostContract = CompiledContract.make(
  'ghost', 
  Contract as any
);

export async function createGhostContract(api: any, contractAddress: string) {
  const config = await api.getConfiguration();
  const shieldedAddresses = await api.getShieldedAddresses();

  const privateStateProvider = inMemoryPrivateStateProvider();
  
  // We expect the prover and verifier keys to be served at the root (public directory)
  const zkConfigProvider = new FetchZkConfigProvider(window.location.origin, fetch.bind(window));
  
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
  
  const ghost = await findDeployedContract(providers, {
    contractAddress,
    compiledContract: compiledGhostContract,
    initialPrivateState: {} as any,
    privateStateId: 'ghost-join'
  });

  return { providers, contract, ghost };
}

export async function deployGhostContract(api: any, initialLimit: bigint) {
  const config = await api.getConfiguration();
  const shieldedAddresses = await api.getShieldedAddresses();
  const privateStateProvider = inMemoryPrivateStateProvider();
  const zkConfigProvider = new FetchZkConfigProvider(window.location.origin, fetch.bind(window));
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
  const ghost = await deployContract(providers, {
    privateStateId: 'ghost-deploy',
    compiledContract: compiledGhostContract,
    args: [initialLimit],
    initialPrivateState: {} as any
  });

  return { 
    ghost, 
    address: ghost.deployTxData.public.contractAddress, 
    providers 
  };
}
