import { GhostSimulator } from "./src/test/ghost-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { randomBytes } from "crypto";

async function runSimulation() {
  console.log("Connecting to network (Simulated)...");
  setNetworkId("undeployed");
  
  console.log("Deploying Ghost contract with initial spending limit of 500...");
  const simulator = new GhostSimulator(500n);
  
  // Generating a fake address just for the local simulated run
  const mockAddress = randomBytes(32).toString('hex');
  
  console.log("\n=============================================");
  console.log("Ghost Contract Deployed Successfully!");
  console.log(`Contract Address: ${mockAddress}`);
  console.log("=============================================\n");
  
  console.log("Initial Public Ledger State:");
  console.log(simulator.getLedger());
}

runSimulation().catch(console.error);
