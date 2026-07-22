import { GhostSimulator } from "./ghost-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

describe("Ghost spending logic", () => {
  it("allows spending under the limit", () => {
    const simulator = new GhostSimulator(100n);
    simulator.spend(40n);
    const state = simulator.getLedger();
    expect(state.total_spent).toEqual(40n);
  });
});
