"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { Play, Pause, ShieldBan, Plus, X, ShieldAlert, Cpu, Activity, Info, Network, Settings } from "lucide-react";
import { toast } from "sonner";

export default function AgentsPage() {
  const { agents, policies, revokeAgent, pauseAgent, resumeAgent, createAgent, updateAgent, addAuditEvent } = useGhostStore();
  const { spend, walletState } = useMidnight();
  const [filter, setFilter] = useState("All");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentFleet, setNewAgentFleet] = useState("Alpha Fleet");
  const [newAgentType, setNewAgentType] = useState<"shopping" | "procurement" | "research" | "financial">("procurement");
  const [newAgentPolicy, setNewAgentPolicy] = useState<string>("");
  
  const [isSpending, setIsSpending] = useState<string | null>(null);

  // Group agents by fleet
  const fleets = Array.from(new Set(agents.map(a => (a as any).fleet || 'Unassigned')));
  
  const filteredAgents = agents.filter(agent => {
    if (filter === "All") return true;
    return agent.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Fleet & Agent Orchestration</h1>
          <p className="text-zinc-400 mt-1">Manage autonomous agent fleets and assign granular enterprise policies.</p>
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

      {filteredAgents.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
          <Network className="w-12 h-12 mb-4 opacity-50 text-[#b8d4f0]" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No active fleets</h3>
          <p className="text-sm max-w-md text-center">Click "Connect Agent" to deploy your first autonomous agent and assign it a zero-knowledge policy.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {fleets.map(fleetName => {
            const fleetAgents = filteredAgents.filter(a => ((a as any).fleet || 'Unassigned') === fleetName);
            if (fleetAgents.length === 0) return null;
            
            return (
              <div key={fleetName} className="space-y-4">
                <div className="flex items-center space-x-3 border-b border-zinc-800 pb-2">
                  <Network className="w-5 h-5 text-[#b8d4f0]" />
                  <h2 className="text-xl font-medium text-white">{fleetName}</h2>
                  <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">{fleetAgents.length} Agents</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fleetAgents.map(agent => {
                    const policy = policies.find(p => p.id === agent.policyId);
                    
                    return (
                      <motion.div key={agent.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="glass-panel p-6 flex flex-col h-full relative group hover:border-zinc-700 transition-colors">
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
                          <div className="p-2 bg-[#b8d4f0]/10 rounded-lg">
                            <Cpu className="w-5 h-5 text-[#b8d4f0]" />
                          </div>
                        </div>

                        <div className="space-y-4 flex-grow">
                          <div className="p-3 bg-zinc-900/50 rounded border border-zinc-800">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-zinc-400">Total Spent</span>
                              <span className="text-white font-mono">${(agent.totalSpent || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-400">Transactions</span>
                              <span className="text-zinc-300 font-mono">{agent.totalTransactions || 0}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm bg-zinc-900/80 p-2.5 rounded border border-zinc-800">
                            <div className="flex items-center space-x-2">
                              <ShieldAlert className="w-4 h-4 text-[#b8d4f0]" />
                              <span className="text-zinc-400">Policy:</span>
                            </div>
                            <select 
                              className="bg-transparent text-white border-none focus:ring-0 text-right cursor-pointer max-w-[150px] truncate"
                              value={agent.policyId || ''}
                              onChange={(e) => updateAgent(agent.id, { policyId: e.target.value })}
                            >
                              <option value="" disabled>Select Policy</option>
                              {policies.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
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
                                    description: `Agent ${agent.name} successfully executed a 25 tDUST on-chain spend under policy ${policy?.name || 'Unknown'}.`,
                                    proofHash: typeof txId === 'string' ? txId : '0xUnknown',
                                    metadata: { verified: true }
                                  });
                                  
                                  toast.success(`Successfully executed 25 tDUST on-chain spend!`, {
                                    description: "Transaction verified via zero-knowledge proof.",
                                    action: txId ? {
                                      label: "View Explorer",
                                      onClick: () => window.open(`https://preview.midnightexplorer.com/transactions/${txId}`, "_blank")
                                    } : undefined
                                  });
                                } catch (e: any) {
                                  toast.error(`Transaction failed`, { description: e.message || String(e) });
                                } finally {
                                  setIsSpending(null);
                                }
                              }}
                              disabled={isSpending === agent.id}
                              className="w-full bg-[#b8d4f0]/20 text-[#b8d4f0] hover:bg-[#b8d4f0]/30 border border-[#b8d4f0]/30 font-medium text-xs py-2 rounded flex justify-center items-center space-x-1.5 transition-colors disabled:opacity-50"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>{isSpending === agent.id ? "Executing ZK Spend..." : "Execute ZK Spend"}</span>
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
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-[#b8d4f0]" />
                  Deploy New Agent
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Agent Identifier</label>
                  <input 
                    type="text" 
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none" 
                    placeholder="e.g., ProcureBot-Alpha" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Target Fleet</label>
                    <input 
                      type="text" 
                      value={newAgentFleet}
                      onChange={(e) => setNewAgentFleet(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none" 
                      placeholder="Fleet Name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Agent Type</label>
                    <select 
                      value={newAgentType}
                      onChange={(e) => setNewAgentType(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none"
                    >
                      <option value="procurement">Procurement</option>
                      <option value="financial">Financial</option>
                      <option value="shopping">Shopping</option>
                      <option value="research">Research</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Assign Enterprise Policy</label>
                  <select 
                    value={newAgentPolicy}
                    onChange={(e) => setNewAgentPolicy(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="" disabled>Select a ZK Policy</option>
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button 
                  onClick={() => {
                    if (!newAgentName || !newAgentPolicy) {
                      toast.error("Please provide a name and select a policy");
                      return;
                    }
                    createAgent({
                      name: newAgentName,
                      type: newAgentType,
                      status: "connected",
                      risk: "medium",
                      policyId: newAgentPolicy,
                      permissions: ["execute", "sign"],
                      description: "Enterprise orchestrated agent",
                      version: "1.0.0",
                      ...( { fleet: newAgentFleet } as any )
                    });
                    setIsModalOpen(false);
                    setNewAgentName("");
                    setNewAgentPolicy("");
                  }} 
                  className="bg-[#b8d4f0] text-black hover:bg-white font-medium px-4 py-2 rounded transition-colors"
                >
                  Deploy to Fleet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
