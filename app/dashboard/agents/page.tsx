"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { Play, Pause, ShieldBan, RotateCcw, Plus, X, ShieldAlert, Cpu, Activity, Info } from "lucide-react";
import { toast } from "sonner";

export default function AgentsPage() {
  const { agents, revokeAgent, pauseAgent, resumeAgent } = useGhostStore();
  const updateAgent = useGhostStore(s => s.updateAgent);
  const addAuditEvent = useGhostStore(s => s.addAuditEvent);
  const { spend, walletState } = useMidnight();
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentType, setNewAgentType] = useState<"shopping" | "procurement" | "research" | "financial">("shopping");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [isSpending, setIsSpending] = useState<string | null>(null);

  const filteredAgents = agents.filter(agent => {
    if (filter === "All") return true;
    return agent.status.toLowerCase() === filter.toLowerCase();
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Agent Management</h1>
          <p className="text-zinc-400 mt-1">Monitor and control your autonomous AI agents.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Agent</span>
        </button>
      </div>

      <div className="flex space-x-2 border-b border-zinc-800 pb-4">
        {["All", "Connected", "Paused", "Revoked"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredAgents.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <Cpu className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No agents connected</h3>
            <p className="text-sm max-w-md text-center">Click "Connect Agent" in the top right to register a new autonomous agent to your workspace.</p>
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <motion.div key={agent.id} variants={item} className="glass-panel p-6 flex flex-col h-full relative group hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300">
                      {agent.version || 'v1.0'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`badge-${agent.status.toLowerCase()}`}>{agent.status}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">{agent.type}</span>
                  </div>
                </div>
                <div className="p-2 bg-zinc-900 rounded-lg">
                  <Cpu className="w-5 h-5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-4 flex-grow">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500 block mb-1">Risk Level</span>
                    <span className={`inline-flex items-center space-x-1 ${
                      (agent as any).riskLevel === 'critical' ? 'text-red-400' :
                      (agent as any).riskLevel === 'high' ? 'text-orange-400' :
                      (agent as any).riskLevel === 'medium' ? 'text-yellow-400' :
                      'text-emerald-400'
                    }`}>
                      <ShieldAlert className="w-3 h-3" />
                      <span className="capitalize">{(agent as any).riskLevel || 'Low'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1">Last Activity</span>
                    <span className="text-zinc-300">{agent.lastActivity || 'Just now'}</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 rounded border border-zinc-800">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Total Spent</span>
                    <span className="text-white font-mono">${(agent.totalSpent || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Transactions</span>
                    <span className="text-zinc-300 font-mono">{agent.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Blocked Attempts</span>
                    <span className="text-red-400 font-mono">{agent.blockedAttempts || 0}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-zinc-400 bg-zinc-900/50 p-2 rounded">
                  <Info className="w-4 h-4" />
                  <span>Policy: <span className="text-zinc-200">{(agent as any).policyName || 'Standard Policy'}</span></span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col space-y-2">
                {walletState.isConnected && agent.status === 'connected' && (
                  <button 
                    onClick={async () => {
                      try {
                        setIsSpending(agent.id);
                        const tx = await spend(BigInt(25));
                        const txId = (tx as any)?.public?.txHash || (tx as any)?.txHash || (tx as any)?.txId || tx;
                        
                        // Update store to reflect spend
                        updateAgent(agent.id, {
                          totalSpent: (agent.totalSpent || 0) + 25,
                          totalTransactions: (agent.totalTransactions || 0) + 1,
                          lastActivity: new Date().toLocaleTimeString()
                        });
                        
                        addAuditEvent({
                          type: 'purchase_approved',
                          agentId: agent.id,
                          agentName: agent.name,
                          merchant: 'On-Chain Execution',
                          amount: 25,
                          currency: 'tDUST',
                          status: 'success',
                          description: `Agent ${agent.name} successfully executed a 25 tDUST on-chain spend.`,
                          proofHash: typeof txId === 'string' ? txId : '0xUnknown',
                          metadata: {
                            rule_evaluated: 'Transaction Limit',
                            limit: '1000',
                            verified: true
                          }
                        });
                        
                        toast.success(`Successfully executed 25 tDUST on-chain spend for ${agent.name}!`, {
                          description: "Transaction verified via zero-knowledge proof.",
                          action: txId ? {
                            label: "View Explorer",
                            onClick: () => window.open(`https://preview.midnightexplorer.com/transactions/${txId}`, "_blank")
                          } : undefined
                        });
                      } catch (e: any) {
                        toast.error(`Transaction failed`, {
                          description: e.message || String(e),
                        });
                      } finally {
                        setIsSpending(null);
                      }
                    }}
                    disabled={isSpending === agent.id}
                    className="w-full bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 font-medium text-xs py-2 rounded flex justify-center items-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{isSpending === agent.id ? "Executing ZK Spend..." : "Execute On-Chain Spend"}</span>
                  </button>
                )}
                <div className="flex space-x-2">
                  {agent.status === 'connected' ? (
                    <button onClick={() => pauseAgent?.(agent.id)} className="flex-1 btn-secondary flex justify-center items-center space-x-2">
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  ) : agent.status === 'paused' ? (
                    <button onClick={() => resumeAgent?.(agent.id)} className="flex-1 btn-secondary flex justify-center items-center space-x-2 hover:bg-zinc-800 text-white">
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button className="flex-1 btn-secondary flex justify-center items-center space-x-2 opacity-50 cursor-not-allowed">
                      <Play className="w-4 h-4" />
                      <span>Revoked</span>
                    </button>
                  )}
                  
                  <button onClick={() => revokeAgent?.(agent.id)} className="flex-1 btn-danger flex justify-center items-center space-x-2 hover:bg-red-950 hover:text-red-400 hover:border-red-900 transition-colors">
                    <ShieldBan className="w-4 h-4" />
                    <span>Revoke</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 max-w-md w-full relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Connect New Agent</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Agent Name</label>
                  <input 
                    type="text" 
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white focus:border-zinc-600 focus:outline-none" 
                    placeholder="e.g., ProcureBot-X" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Agent Type</label>
                  <select 
                    value={newAgentType}
                    onChange={(e) => setNewAgentType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="shopping">Shopping</option>
                    <option value="procurement">Procurement</option>
                    <option value="research">Research</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                  <textarea 
                    value={newAgentDesc}
                    onChange={(e) => setNewAgentDesc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white focus:border-zinc-600 focus:outline-none" 
                    rows={3} 
                    placeholder="What will this agent do?"
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button 
                  onClick={() => {
                    if (!newAgentName) return;
                    useGhostStore.setState((state) => ({
                      agents: [
                        {
                          id: `agt_${Date.now()}`,
                          name: newAgentName,
                          type: newAgentType,
                          status: "connected",
                          risk: "low",
                          policyId: "pol_01",
                          permissions: ["browse", "compare", "purchase"],
                          lastActivity: "Just now",
                          totalTransactions: 0,
                          totalSpent: 0,
                          blockedAttempts: 0,
                          connectedAt: new Date().toISOString(),
                          description: newAgentDesc || "Autonomous AI agent",
                          version: "1.0.0"
                        },
                        ...state.agents
                      ]
                    }));
                    setIsModalOpen(false);
                    setNewAgentName("");
                    setNewAgentDesc("");
                  }} 
                  className="btn-primary"
                >
                  Connect Agent
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
