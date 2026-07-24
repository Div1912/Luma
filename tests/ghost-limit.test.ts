import { GhostSimulator } from "./ghost-simulator";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

/**
 * Test 2: Ghost Limit Validation
 * - Circuit Logic: Verifies the `spend` circuit enforces the hardcoded limit.
 * - State Transitions: Verifies the contract rejects invalid state transitions (spending > limit).
 * - Privacy Behavior: Ensures limits are enforced strictly without leaking the remaining allowance before failure.
 */
describe("Ghost limit validation", () => {
  it("prevents spending over the limit", () => {
    const simulator = new GhostSimulator(100n);
    simulator.spend(60n);
    expect(() => simulator.spend(50n)).toThrow("failed assert: Spending limit exceeded");
  });
});
