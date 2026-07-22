import { GhostSimulator } from "./ghost-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

describe("Ghost initialization", () => {
  it("initializes with zero total_spent and correct limit", () => {
    const simulator = new GhostSimulator(100n);
    const state = simulator.getLedger();
    expect(state.total_spent).toEqual(0n);
    expect(state.spending_limit).toEqual(100n);
  });
});
