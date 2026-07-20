import { GhostSimulator } from "./ghost-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

describe("Ghost limit contract", () => {
  it("initializes with zero total_spent and correct limit", () => {
    const simulator = new GhostSimulator(100n);
    const state = simulator.getLedger();
    expect(state.total_spent).toEqual(0n);
    expect(state.spending_limit).toEqual(100n);
  });

  it("allows spending under the limit", () => {
    const simulator = new GhostSimulator(100n);
    simulator.spend(40n);
    const state = simulator.getLedger();
    expect(state.total_spent).toEqual(40n);
  });

  it("prevents spending over the limit", () => {
    const simulator = new GhostSimulator(100n);
    simulator.spend(60n);
    expect(() => simulator.spend(50n)).toThrow("failed assert: Spending limit exceeded");
  });
});
