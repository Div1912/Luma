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

const compiledGhostContract = CompiledContract.make(
  'ghost', 
  Contract as any
).pipe(
  CompiledContract.withWitnesses({} as never)
);

export async function createGhostContract(api: any, contractAddress: string, targetNetwork: string = 'preview') {
  setNetworkId(targetNetwork as any);
  const cleanAddress = contractAddress.replace(/^0x/, '').trim();
  const config = await api.getConfiguration();
  const shieldedAddresses = await api.getShieldedAddresses();

  const privateStateProvider = inMemoryPrivateStateProvider();
  
  // ZK keys are served statically from the public directory (/keys and /zkir)
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
      const submitted = await api.submitTransaction(toHex(tx.serialize()));
      const txIdentifiers = tx.identifiers();
      return (submitted && typeof submitted === 'string' && submitted.trim())
        ? submitted.trim()
        : txIdentifiers[0];
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
    contractAddress: cleanAddress,
    compiledContract: compiledGhostContract as any,
    initialPrivateState: {} as any,
    privateStateId: 'ghost-join'
  } as any);

  return { providers, contract, ghost, address: cleanAddress };
}

export async function deployGhostContract(
  api: any, 
  initialLimit: bigint, 
  targetNetwork: string = 'preview',
  onProgress?: (status: string) => void
) {
  setNetworkId(targetNetwork as any);
  onProgress?.('Fetching 1AM wallet network configuration...');
  const config = await api.getConfiguration();
  const shieldedAddresses = await api.getShieldedAddresses();
  const privateStateProvider = inMemoryPrivateStateProvider();
  // ZK keys are served statically from the public directory (/keys and /zkir)
  const zkConfigProvider = new FetchZkConfigProvider(window.location.origin, fetch.bind(window));
  const proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);
  const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri, window.WebSocket as any);

  const walletProvider = {
    getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
    balanceTx: async (tx: UnboundTransaction, ttl?: Date) => {
      onProgress?.('Please open & approve transaction in your 1AM wallet...');
      const serializedTx = toHex(tx.serialize());
      const received = await api.balanceUnsealedTransaction(serializedTx);
      onProgress?.('Transaction signed! Submitting on-chain...');
      return Transaction.deserialize<SignatureEnabled, Proof, Binding>('signature', 'proof', 'binding', fromHex(received.tx));
    },
  };

  let lastSubmittedTxId: string | null = null;
  const midnightProvider = {
    submitTx: async (tx: FinalizedTransaction) => {
      onProgress?.('Submitting transaction to Midnight blockchain...');
      const submitted = await api.submitTransaction(toHex(tx.serialize()));
      const txIdentifiers = tx.identifiers();
      lastSubmittedTxId = (submitted && typeof submitted === 'string' && submitted.trim())
        ? submitted.trim()
        : (txIdentifiers?.[0] ? String(txIdentifiers[0]) : null);
      onProgress?.('Transaction submitted! Awaiting on-chain finalization (~30-60s)...');
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

  onProgress?.('Initializing ZK circuit and contract parameters...');
  // Actually perform the deployment transaction
  // The compiled initialState(context, limit_0: bigint) accepts exactly 1 user argument.
  const ghost = await deployContract(providers as any, {
    privateStateId: 'ghost-deploy',
    compiledContract: compiledGhostContract as any,
    args: [initialLimit],
    initialPrivateState: {} as any
  } as any);

  const rawAddress = ghost.deployTxData.public.contractAddress;
  const deployedAddress = typeof rawAddress === 'string' ? rawAddress.replace(/^0x/, '').trim() : String(rawAddress);

  const rawTxHash = (ghost.deployTxData as any)?.public?.txHash 
    || (ghost.deployTxData as any)?.public?.txId 
    || (ghost.deployTxData as any)?.public?.identifiers?.[0]
    || lastSubmittedTxId
    || (ghost.deployTxData as any)?.txHash 
    || (ghost.deployTxData as any)?.txId 
    || (ghost.deployTxData as any)?.tx?.hash;
  const txHash = typeof rawTxHash === 'string' && rawTxHash.trim() 
    ? rawTxHash.trim() 
    : deployedAddress;

  onProgress?.(`Deployed successfully! Address: ${deployedAddress}`);

  return { 
    ghost, 
    address: deployedAddress, 
    txHash,
    providers 
  };
}
