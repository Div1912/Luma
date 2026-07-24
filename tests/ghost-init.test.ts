import { GhostSimulator } from "./ghost-simulator";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

/**
 * Test 1: Ghost Initialization
 * - Circuit Logic: Verifies the constructor circuit correctly initializes state.
 * - State Transitions: Verifies state transitions from uninitialized -> initialized with 0 spent.
 * - Privacy Behavior: Ensures initial public state accurately reflects the zero-knowledge setup (0 spent).
 */
describe("Ghost initialization", () => {
  it("initializes with zero total_spent and correct limit", () => {
    const simulator = new GhostSimulator(100n);
    const state = simulator.getLedger();
    expect(state.total_spent).toEqual(0n);
    expect(state.spending_limit).toEqual(100n);
  });
});
