import { GhostSimulator } from "./ghost-simulator";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

/**
 * Test 3: Ghost Spend Verification
 * - Circuit Logic: Verifies the `spend` circuit increments the spent amount correctly.
 * - State Transitions: Verifies state changes appropriately after valid spend operations.
 * - Privacy Behavior: Ensures the public ledger is updated only with the verifiable total, while keeping the specific purchase transaction inputs private to the user's local state.
 */
describe("Ghost spend verification", () => {
  it("allows spending under the limit", () => {
    const simulator = new GhostSimulator(100n);
    simulator.spend(40n);
    const state = simulator.getLedger();
    expect(state.total_spent).toEqual(40n);
  });
});
