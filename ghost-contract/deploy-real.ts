import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { HttpClient, fetch } from '@midnight-ntwrk/midnight-js-http-client';
import { NodePublicDataProvider } from '@midnight-ntwrk/midnight-js-node-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { Contract } from './src/managed/ghost/contract/index.js';
import pino from 'pino';
import { MidnightWalletProvider } from '../bboard/bboard-cli/src/midnight-wallet-provider.js';
import { waitForUnshieldedFunds, syncWallet } from '../bboard/bboard-cli/src/wallet-utils.js';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { generateDust } from '../bboard/bboard-cli/src/generate-dust.js';

// Seed phrase we generated earlier
const WALLET_SEED = "c1ad04960f70d2984000c144f9dae243041c6f3a6acc644268cc922ea1722aba";

async function deployReal() {
  const logger = pino({ level: 'info' });
  setNetworkId('preprod');

  console.log("Setting up deployment environment...");

  const env = {
    walletNetworkId: 'preprod',
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    nodeWS: 'wss://rpc.preprod.midnight.network',
    faucet: 'https://midnight-tmnight-preprod.nethermind.dev/',
    proofServer: 'http://127.0.0.1:6300', 
  };

  const walletProvider = await MidnightWalletProvider.build(logger, env as any, WALLET_SEED);
  await walletProvider.start();
  const walletFacade = walletProvider.wallet;

  console.log("Waiting to sync funds from faucet...");
  const unshieldedState = await waitForUnshieldedFunds(logger, walletFacade, env as any, unshieldedToken());
  console.log("Funds synced!");

  const dustGeneration = await generateDust(logger, WALLET_SEED, unshieldedState, walletFacade);
  if (dustGeneration) {
    logger.info(`Submitted dust generation registration transaction: ${dustGeneration}`);
    await syncWallet(logger, walletFacade);
  }

  console.log("Deploying Ghost contract to the Preprod network...");

  const privateStateProvider = levelPrivateStateProvider({
    privateStateStoreName: 'ghost-private-state'
  });

  const providers = {
    privateStateProvider,
    publicDataProvider: new NodePublicDataProvider(env.node, env.nodeWS),
    zkConfigProvider: new HttpClient(env.proofServer, fetch),
    proofProvider: new HttpClient(env.proofServer, fetch),
    walletProvider: walletProvider,
    midnightProvider: walletProvider,
  };

  const initialLimit = 1000n;
  const ghostContract = new Contract(initialLimit);

  // Deploy
  const deployTx = await deployContract(providers, {
    privateStateKey: 'ghost-deploy',
    contract: ghostContract,
    initialPrivateState: { secret_limit: initialLimit }
  });

  console.log("\n=============================================");
  console.log("GHOST CONTRACT DEPLOYED SUCCESSFULLY!");
  console.log("=============================================");
  console.log(`\nREAL CONTRACT ADDRESS:\n${deployTx.deployTxData.public.contractAddress}\n`);
  console.log("=============================================\n");

  await walletProvider.stop();
}

deployReal().catch((err) => {
  console.error("\nDeployment failed!");
  console.error("Make sure Docker Desktop is running, and you started the proof server!");
  console.error(err);
});
