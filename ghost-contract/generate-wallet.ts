import { FluentWalletBuilder } from '@midnight-ntwrk/testkit-js';
import { LedgerParameters } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import pino from 'pino';
import { firstValueFrom } from 'rxjs';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { getNetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

async function generateWallet() {
  setNetworkId('preview');
  const logger = pino({ level: 'info' });
  console.log("Generating a new Midnight wallet...");
  
  try {
    const env = {
      walletNetworkId: 'preview',
      networkId: 'preview',
      indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
      indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
      node: 'https://rpc.preview.midnight.network',
      nodeWS: 'wss://rpc.preview.midnight.network',
      faucet: 'https://faucet.preview.midnight.network',
      proofServer: 'http://127.0.0.1:6300', // Mock proof server url
    };
    
    // We use builder to generate the keys
    const builder = FluentWalletBuilder.forEnvironment(env as any);
    const buildResult = await builder.withRandomSeed().buildWithoutStarting();
    
    const seeds = (buildResult as any).seeds;
    console.log("\n=============================================");
    console.log("WALLET GENERATED SUCCESSFULLY!");
    console.log("=============================================");
    console.log(`\nYOUR 24-WORD SEED PHRASE (HEX):\n${seeds.masterSeed}\n`);
    
    // We need to get the public address for the faucet from the unshielded wallet
    const wallet = (buildResult as any).wallet;
    const unshieldedState = await firstValueFrom(wallet.unshielded.state);
    const unshieldedAddress = UnshieldedAddress.codec.encode(getNetworkId(), unshieldedState.address);
    console.log(`YOUR RECEIVING ADDRESS (FAUCET FORMAT):\n${unshieldedAddress.toString()}\n`);
    
    console.log("1. Copy your Receiving Address.");
    console.log("2. Paste it in the Midnight Faucet to get testnet tokens.");
    console.log("3. Once funded, you can deploy your contract using this seed phrase!");
    console.log("=============================================\n");
    
  } catch (err) {
    console.error("Failed to generate wallet:", err);
  }
}

generateWallet().catch(console.error);
