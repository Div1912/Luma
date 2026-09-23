import fleetData from "./fleet-20-agents.json";

export interface FleetAgent {
  id: string;
  index: number;
  name: string;
  role: string;
  amount: number;
  address: string;
  publicKey: string;
  network: "preprod";
  status: "idle" | "proving" | "signing" | "submitting" | "confirmed" | "failed";
  policyId: string;
  dailyLimit: number;
  txHash?: string | null;
  explorerUrl?: string | null;
  error?: string | null;
}

export const PREPROD_FLEET_AGENTS: FleetAgent[] = fleetData as FleetAgent[];
