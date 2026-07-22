import { GhostSimulator } from "./ghost-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";

setNetworkId("undeployed");

describe("Ghost limit validation", () => {
  it("prevents spending over the limit", () => {
    const simulator = new GhostSimulator(100n);
    simulator.spend(60n);
    expect(() => simulator.spend(50n)).toThrow("failed assert: Spending limit exceeded");
  });
});
