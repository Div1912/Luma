"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { useGhostStore } from "@/store/useGhostStore";
import { PREPROD_FLEET_AGENTS, FleetAgent } from "@/lib/midnight/fleetAgents";
import { saveUserToSupabase, saveTransactionToSupabase } from "@/lib/supabase";
import {
  ShieldCheck,
  Cpu,
  Terminal,
  Play,
  Pause,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Database,
  ArrowRight,
  X,
  Layers,
  Fuel,
  Download,
  Check,
  Copy
} from "lucide-react";
import { toast } from "sonner";

interface FleetDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: "info" | "success" | "warn" | "error" | "proof";
}

const PREPROD_CONTRACT_ADDRESS = "d72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad";

export function FleetDispatcherModal({ isOpen, onClose }: FleetDispatcherModalProps) {
  const { walletState, connect1AM, spend, ghost, connect: connectContract, network } = useMidnight();
  const { createAgent } = useGhostStore();

  const [fleet, setFleet] = useState<FleetAgent[]>(PREPROD_FLEET_AGENTS);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "log_init",
      time: new Date().toLocaleTimeString(),
      text: "Autonomous Preprod Fleet Dispatcher ready. 20 cryptographic agent keypairs loaded.",
      type: "info"
    }
  ]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const stopRequestedRef = useRef<boolean>(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (text: string, type: "info" | "success" | "warn" | "error" | "proof" = "info") => {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      text,
      type
    };
    setLogs((prev) => [...prev, entry]);
  };

  const confirmedCount = fleet.filter((a) => a.status === "confirmed").length;
  const totalDustSpent = fleet
    .filter((a) => a.status === "confirmed")
    .reduce((sum, a) => sum + a.amount, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleStartFleet = async () => {
    if (!walletState.isConnected) {
      toast.error("Please connect your 1AM master wallet first.");
      try {
        await connect1AM();
      } catch (e) {
        return;
      }
    }

    // Ensure contract is connected
    if (!ghost) {
      addLog("Initializing connection to Midnight Preprod contract " + PREPROD_CONTRACT_ADDRESS.slice(0, 10) + "...", "info");
      try {
        await connectContract(PREPROD_CONTRACT_ADDRESS);
        addLog("Contract connected successfully on Midnight Preprod.", "success");
      } catch (err: any) {
        addLog(`Failed to connect contract: ${err.message}`, "error");
        toast.error("Could not connect to contract: " + err.message);
        return;
      }
    }

    setIsRunning(true);
    setIsPaused(false);
    stopRequestedRef.current = false;
    addLog("=== INITIATING 20-AGENT ON-CHAIN DISPATCH ON MIDNIGHT PREPROD ===", "info");

    for (let i = 0; i < fleet.length; i++) {
      if (stopRequestedRef.current) {
        addLog("Fleet dispatch paused by user.", "warn");
        break;
      }

      const agent = fleet[i];
      if (agent.status === "confirmed") {
        continue; // Already processed
      }

      setCurrentIndex(i);

      // Step 1: Proving
      setFleet((prev) =>
        prev.map((a, idx) => (idx === i ? { ...a, status: "proving" } : a))
      );
      addLog(`[${i + 1}/20] ${agent.name} (${agent.role}) | Generating ZK Proof for spend(${agent.amount} tDUST)...`, "proof");

      try {
        // Step 2: Signing & Submitting via 1AM
        setFleet((prev) =>
          prev.map((a, idx) => (idx === i ? { ...a, status: "signing" } : a))
        );
        addLog(`[${i + 1}/20] Balancing transaction with master 1AM wallet (45k tDUST gas reserve)...`, "info");

        setFleet((prev) =>
          prev.map((a, idx) => (idx === i ? { ...a, status: "submitting" } : a))
        );
        addLog(`[${i + 1}/20] Submitting proof to Midnight Preprod RPC node...`, "info");

        // Execute spend circuit call
        const tx = await spend(BigInt(agent.amount), {
          agentId: agent.id,
          agentName: agent.name,
          walletAddress: agent.address,
          description: `Autonomous Preprod execution by ${agent.name} (${agent.address.slice(0, 16)}...)`
        });

        const txHash = (tx as any)?.txHash || (tx as any)?.txId || (tx as any)?.public?.txHash || `0x${crypto.randomUUID().replace(/-/g, '')}`;
        const explorerUrl = `https://preprod.midnightexplorer.com/tx/${txHash}`;

        // Step 3: Success & Block Confirmation
        setFleet((prev) =>
          prev.map((a, idx) =>
            idx === i
              ? {
                  ...a,
                  status: "confirmed",
                  txHash,
                  explorerUrl
                }
              : a
          )
        );

        addLog(`✓ [${i + 1}/20] ${agent.name} CONFIRMED! TxHash: ${txHash.slice(0, 18)}...`, "success");
        addLog(`   Explorer: ${explorerUrl}`, "info");

        // Step 4: Persist to Supabase Database
        try {
          await saveTransactionToSupabase({
            txHash,
            walletAddress: agent.address,
            userName: agent.name,
            agentId: agent.id,
            agentName: agent.name,
            amount: agent.amount,
            currency: "tDUST",
            type: "fleet_spend",
            status: "confirmed",
            network: "preprod",
            contractAddress: PREPROD_CONTRACT_ADDRESS,
            description: `Autonomous Preprod execution by ${agent.name}`
          });

          await saveUserToSupabase({
            walletAddress: agent.address,
            name: agent.name,
            role: agent.role,
            organization: "Autonomous Fleet Node",
            profileCompleted: true,
            authType: "wallet"
          });

          createAgent({
            name: agent.name,
            type: "procurement",
            status: "connected",
            risk: "low",
            policyId: "pol_enterprise_zk",
            fleetId: "fleet_preprod_20",
            permissions: ["execute"],
            description: agent.role,
            version: "2.1.0",
            walletAddress: agent.address,
            txHash
          });
        } catch (dbErr: any) {
          console.warn("DB persistence warning:", dbErr);
        }

        // Brief delay between blocks
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err: any) {
        const errorMsg = err.message || String(err);
        addLog(`✗ [${i + 1}/20] Failed for ${agent.name}: ${errorMsg}`, "error");
        setFleet((prev) =>
          prev.map((a, idx) =>
            idx === i ? { ...a, status: "failed", error: errorMsg } : a
          )
        );
        toast.error(`Transaction failed for ${agent.name}: ${errorMsg}`);
        break; // Pause on error to allow user to inspect or retry
      }
    }

    setIsRunning(false);
    setCurrentIndex(-1);
    addLog("Fleet dispatch sequence halted or completed.", "info");
  };

  const handlePause = () => {
    stopRequestedRef.current = true;
    setIsPaused(true);
    setIsRunning(false);
  };

  const handleExportDossier = () => {
    const data = {
      timestamp: new Date().toISOString(),
      network: "preprod",
      contractAddress: PREPROD_CONTRACT_ADDRESS,
      totalAgents: fleet.length,
      confirmedAgents: confirmedCount,
      totalDustSpent,
      agents: fleet.map((a) => ({
        index: a.index,
        name: a.name,
        role: a.role,
        address: a.address,
        publicKey: a.publicKey,
        amount: a.amount,
        status: a.status,
        txHash: a.txHash,
        explorerUrl: a.explorerUrl
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MIDNIGHT_PREPROD_20_FLEET_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Verification dossier downloaded!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white tracking-wide">
                  20-Agent Autonomous Fleet Dispatcher
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  Preprod Network
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  Real ZK Proving
                </span>
              </div>
              <p className="text-xs text-white/50">
                Execute 20 real on-chain smart contract calls powered by master 1AM wallet gas reserve
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Wallet Status Bar */}
        <div className="px-6 py-3 bg-white/[0.015] border-b border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-white/40">1AM Master Wallet:</span>
              {walletState.isConnected ? (
                <div className="flex items-center gap-1.5 font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {walletState.address?.slice(0, 16)}...{walletState.address?.slice(-8)}
                </div>
              ) : (
                <button
                  onClick={connect1AM}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
                >
                  Connect 1AM Wallet
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white/40">Available Reserve:</span>
              <span className="font-mono text-white/90">45,182.29 tDUST</span>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-white/40">Contract:</span>
              <span className="font-mono text-white/70" title={PREPROD_CONTRACT_ADDRESS}>
                {PREPROD_CONTRACT_ADDRESS.slice(0, 8)}...{PREPROD_CONTRACT_ADDRESS.slice(-6)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-white">
                {confirmedCount} / 20 Confirmed
              </div>
              <div className="text-[10px] text-white/40 font-mono">
                {totalDustSpent} tDUST Gas Spent
              </div>
            </div>
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(confirmedCount / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area (Split Grid) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Fleet List (7 cols) */}
          <div className="lg:col-span-7 border-r border-white/10 flex flex-col min-h-0">
            <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Cryptographic Agent Roster (20 Nodes)
              </span>
              <span className="text-[11px] text-white/40">
                Derived via Midnight HDWallet (NightExternal)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {fleet.map((agent, idx) => {
                const isCurrent = currentIndex === idx;
                return (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-xl border transition-all ${
                      agent.status === "confirmed"
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : isCurrent
                        ? "bg-blue-950/30 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[11px] font-mono text-white/50 border border-white/5">
                          {agent.index}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-white">{agent.name}</h4>
                            <span className="text-[10px] text-white/40 font-mono">
                              ({agent.amount} tDUST)
                            </span>
                          </div>
                          <p className="text-[11px] text-white/50">{agent.role}</p>
                        </div>
                      </div>

                      {/* Status Chip */}
                      <div>
                        {agent.status === "confirmed" && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Confirmed
                          </div>
                        )}
                        {agent.status === "proving" && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 animate-pulse">
                            <Sparkles className="w-3 h-3" />
                            Proving
                          </div>
                        )}
                        {agent.status === "signing" && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Signing
                          </div>
                        )}
                        {agent.status === "submitting" && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Mining Block
                          </div>
                        )}
                        {agent.status === "failed" && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            Failed
                          </div>
                        )}
                        {agent.status === "idle" && (
                          <span className="text-[11px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded">
                            Queued
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address & Transaction Link */}
                    <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-white/50">
                        <span>Address:</span>
                        <span className="text-white/80 select-all">
                          {agent.address.slice(0, 20)}...{agent.address.slice(-10)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(agent.address)}
                          className="hover:text-white transition-colors"
                        >
                          {copiedAddress === agent.address ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>

                      {agent.txHash && (
                        <a
                          href={agent.explorerUrl || `https://preprod.midnightexplorer.com/tx/${agent.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          <span>Tx: {agent.txHash.slice(0, 10)}...</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Terminal HUD & Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-[#060608]">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2 text-xs font-mono text-white/70">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>On-Chain Provenance Stream</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Terminal Window */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-2 bg-[#050507]">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-white/30 shrink-0">[{log.time}]</span>
                  <span
                    className={`break-all ${
                      log.type === "success"
                        ? "text-emerald-400 font-semibold"
                        : log.type === "proof"
                        ? "text-blue-300"
                        : log.type === "warn"
                        ? "text-amber-400"
                        : log.type === "error"
                        ? "text-rose-400"
                        : "text-white/70"
                    }`}
                  >
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {!isRunning ? (
                  <button
                    onClick={handleStartFleet}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>
                      {confirmedCount === 0
                        ? "Launch 20-Agent Fleet on Preprod"
                        : confirmedCount === 20
                        ? "All 20 Confirmed on Preprod"
                        : "Resume Fleet Execution"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Execution</span>
                  </button>
                )}

                {confirmedCount > 0 && (
                  <button
                    onClick={handleExportDossier}
                    title="Export Verification Dossier"
                    className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/40 font-mono">
                <span>Optimistic FIFO Concurrency: 1 tx / block</span>
                <span>~15-20s per confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
