"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhostStore, Fleet, Agent } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { Play, Pause, ShieldBan, Plus, X, ShieldAlert, Cpu, Activity, Network, Layers, Copy, Zap } from "lucide-react";
import { toast } from "sonner";

export default function AgentsPage() {
  const { agents, fleets, policies, createFleet, createBulkAgents, revokeAgent, pauseAgent, resumeAgent, updateAgent, addAuditEvent } = useGhostStore();
  const { spend, walletState } = useMidnight();
  
  const [activeTab, setActiveTab] = useState<"fleets" | "agents">("fleets");
  
  // Modal States
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [newFleetName, setNewFleetName] = useState("");
  const [newFleetDesc, setNewFleetDesc] = useState("");
  const [newFleetPolicy, setNewFleetPolicy] = useState("");
  const [newParentFleetId, setNewParentFleetId] = useState("");
  
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionFleetId, setProvisionFleetId] = useState("");
  const [provisionCount, setProvisionCount] = useState<number>(100);
  
  const [isSpending, setIsSpending] = useState<string | null>(null);

  const handleCreateFleet = () => {
    if (!newFleetName || !newFleetPolicy) {
      toast.error("Please provide a name and select a master policy.");
      return;
    }
    createFleet({
      name: newFleetName,
      description: newFleetDesc || "Autonomous Agent Fleet",
      policyId: newFleetPolicy,
      parentFleetId: newParentFleetId || null,
    });
    setIsFleetModalOpen(false);
    setNewFleetName("");
    setNewFleetDesc("");
    setNewFleetPolicy("");
    setNewParentFleetId("");
    toast.success("Fleet created successfully");
  };

  const handleProvisionAgents = () => {
    if (!provisionFleetId || provisionCount < 1) return;
    
    const targetFleet = fleets.find(f => f.id === provisionFleetId);
    if (!targetFleet) return;

    // Generate agents
    const newAgents: Omit<Agent, "id" | "createdAt" | "totalTransactions" | "totalSpent" | "blockedAttempts" | "lastActivity" | "connectedAt">[] = Array.from({ length: provisionCount }).map((_, i) => ({
      name: `${targetFleet.name.split(' ')[0]}-Node-${Math.floor(Math.random() * 9000) + 1000}`,
      type: "procurement",
      status: "connected",
      risk: "low",
      policyId: targetFleet.policyId, // inherit
      useFleetPolicy: true,
      fleetId: targetFleet.id,
      permissions: ["execute"],
      description: `Provisioned as part of ${targetFleet.name}`,
      version: "1.0.0"
    }));

    createBulkAgents(newAgents);
    setIsProvisionModalOpen(false);
    setProvisionCount(100);
    toast.success(`Provisioned ${provisionCount} autonomous agents to ${targetFleet.name}.`, {
      description: `They inherited the master policy: ${policies.find(p => p.id === targetFleet.policyId)?.name}`
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Multi-Agent Orchestration</h1>
          <p className="text-zinc-400 mt-1">Deploy fleets of autonomous agents and assign hierarchical ZK policies.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsFleetModalOpen(true)}
            className="btn-liquid btn-liquid-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fleet</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("fleets")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "fleets" 
              ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/15" 
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Fleet Management
        </button>
        <button
          onClick={() => setActiveTab("agents")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "agents" 
              ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/15" 
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Individual Agents ({agents.length})
        </button>
      </div>

      {activeTab === "fleets" && (
        <div className="space-y-6">
          {fleets.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-2xl glass-liquid">
              <Layers className="w-12 h-12 mb-4 opacity-50 text-[#b8d4f0]" />
              <h3 className="text-lg font-medium text-zinc-200 mb-2">No active fleets</h3>
              <p className="text-sm max-w-md text-center text-zinc-400">Create a fleet to orchestrate multiple agents under a single master policy.</p>
            </div>
          ) : (
            (() => {
              const orderedFleets: any[] = [];
              const topLevel = fleets.filter(f => !f.parentFleetId);
              topLevel.forEach(tl => {
                orderedFleets.push(tl);
                const children = fleets.filter(f => f.parentFleetId === tl.id);
                orderedFleets.push(...children);
              });
              const remaining = fleets.filter(f => !orderedFleets.includes(f));
              orderedFleets.push(...remaining);
              return orderedFleets;
            })().map(fleet => {
              const fleetAgents = agents.filter(a => a.fleetId === fleet.id);
              const masterPolicy = policies.find(p => p.id === fleet.policyId);
              
              return (
                <div key={fleet.id} className="glass-liquid p-6 space-y-6" style={{ marginLeft: fleet.parentFleetId ? '3rem' : '0', borderLeft: fleet.parentFleetId ? '4px solid #b8d4f0' : '' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[#b8d4f0]/10 border border-[#b8d4f0]/20">
                          <Network className="w-5 h-5 text-[#b8d4f0]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">{fleet.name}</h2>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-mono">Active</span>
                        {fleet.parentFleetId && (
                          <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            Child of: {fleets.find(f => f.id === fleet.parentFleetId)?.name || 'Unknown'}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-sm">{fleet.description}</p>
                    </div>
                    <button 
                      onClick={() => { setProvisionFleetId(fleet.id); setIsProvisionModalOpen(true); }}
                      className="btn-liquid btn-liquid-cyan flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> Provision Agents
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <h4 className="text-zinc-400 text-xs uppercase tracking-wider mb-2 font-mono">Master Policy</h4>
                      <div className="flex items-center gap-2 text-white">
                        <ShieldAlert className="w-4 h-4 text-[#b8d4f0]" />
                        <span className="font-medium">{masterPolicy?.name || "None Assigned"}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <h4 className="text-zinc-400 text-xs uppercase tracking-wider mb-2 font-mono">Deployed Agents</h4>
                      <div className="flex items-center gap-2 text-white">
                        <Cpu className="w-4 h-4 text-zinc-400" />
                        <span className="font-mono text-lg">{fleetAgents.length} Nodes</span>
                      </div>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <h4 className="text-zinc-400 text-xs uppercase tracking-wider mb-2 font-mono">Fleet Total Spend</h4>
                      <div className="flex items-center gap-2 text-white">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-lg">${fleetAgents.reduce((sum, a) => sum + (a.totalSpent||0), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {fleetAgents.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-white/10">
                      <h4 className="text-xs uppercase tracking-wider text-zinc-400 mb-4 font-mono">Sample Fleet Nodes (Showing 3 of {fleetAgents.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {fleetAgents.slice(0, 3).map(agent => (
                          <div key={agent.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium text-sm truncate">{agent.name}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                            </div>
                            <div className="text-xs text-zinc-400 flex justify-between font-mono">
                              <span>Policy: Inherited</span>
                              <span className="text-white">${agent.totalSpent} spent</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "agents" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-500 glass-liquid">No agents deployed.</div>
          ) : (
            agents.map(agent => {
              const policy = policies.find(p => p.id === agent.policyId);
              const parentFleet = fleets.find(f => f.id === agent.fleetId);
              
              return (
                <div key={agent.id} className="glass-liquid p-6 flex flex-col h-full group hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                      {parentFleet && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-[#b8d4f0]">
                          <Network className="w-3 h-3" /> {parentFleet.name}
                        </div>
                      )}
                    </div>
                    <span className={`badge-${agent.status.toLowerCase()}`}>{agent.status}</span>
                  </div>

                  <div className="space-y-4 flex-grow">
                    <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/10 shadow-inner">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-400">Total Spent</span>
                        <span className="text-white font-mono font-medium">${(agent.totalSpent || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Transactions</span>
                        <span className="text-zinc-300 font-mono">{agent.totalTransactions || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm bg-white/[0.03] p-2.5 rounded-xl border border-white/10">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-[#b8d4f0]" />
                        <span className="text-zinc-400">Policy:</span>
                      </div>
                      <select 
                        className="bg-black/50 text-white border border-white/10 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-[#b8d4f0] cursor-pointer max-w-[150px] truncate"
                        value={agent.policyId || ''}
                        onChange={(e) => updateAgent(agent.id, { policyId: e.target.value, useFleetPolicy: false })}
                      >
                        <option value="" disabled>Select Policy</option>
                        {policies.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    {agent.useFleetPolicy && <p className="text-[10px] text-zinc-500 text-right italic">Inherited from Fleet Master</p>}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
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
                            
                            toast.success(`Executed 25 tDUST spend!`);
                          } catch (e: any) {
                            toast.error(`Transaction failed`, { description: e.message || String(e) });
                          } finally {
                            setIsSpending(null);
                          }
                        }}
                        disabled={isSpending === agent.id}
                        className="btn-liquid btn-liquid-cyan w-full text-xs py-2 flex justify-center items-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>{isSpending === agent.id ? "Executing ZK Spend..." : "Execute ZK Spend"}</span>
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => pauseAgent(agent.id)} className="btn-liquid btn-liquid-secondary flex-1 py-1.5 text-xs">Pause</button>
                      <button onClick={() => revokeAgent(agent.id)} className="btn-liquid btn-liquid-danger flex-1 py-1.5 text-xs">Revoke</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Fleet Creation Modal */}
      <AnimatePresence>
        {isFleetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsFleetModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-liquid-panel p-6 max-w-md w-full relative z-10 space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#b8d4f0]" /> Create Fleet
                </h2>
                <button onClick={() => setIsFleetModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Fleet Name</label>
                  <input type="text" value={newFleetName} onChange={e => setNewFleetName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-white/30 text-sm" placeholder="e.g. AWS Procurement Swarm" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Description</label>
                  <textarea value={newFleetDesc} onChange={e => setNewFleetDesc(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-white/30 text-sm" placeholder="What does this fleet do?" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Parent Fleet (Optional Hierarchy)</label>
                  <select value={newParentFleetId} onChange={e => setNewParentFleetId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-white/30 text-sm cursor-pointer">
                    <option value="">None (Top Level Fleet)</option>
                    {fleets.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Assign Master Policy</label>
                  <select value={newFleetPolicy} onChange={e => setNewFleetPolicy(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-white/30 text-sm cursor-pointer">
                    <option value="">Select Master Policy...</option>
                    {policies.map(p => <option key={p.id} value={p.id}>{p.name} (Limit: ${p.perTransactionLimit})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button onClick={() => setIsFleetModalOpen(false)} className="btn-liquid btn-liquid-secondary flex-1 py-2.5">Cancel</button>
                <button onClick={handleCreateFleet} className="btn-liquid btn-liquid-primary flex-1 py-2.5">Create Fleet</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Provision Swarm Modal */}
      <AnimatePresence>
        {isProvisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsProvisionModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-liquid-panel p-6 max-w-md w-full relative z-10 space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#b8d4f0]" /> Bulk Provision Swarm
                </h2>
                <button onClick={() => setIsProvisionModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Target Fleet</label>
                  <input type="text" disabled value={fleets.find(f => f.id === provisionFleetId)?.name || ''} className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white/60 text-sm font-medium" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs uppercase tracking-wider font-mono text-zinc-400">Number of Autonomous Agents</label>
                    <span className="text-white font-mono font-bold text-sm bg-white/10 px-2 py-0.5 rounded-md">{provisionCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    step="10"
                    value={provisionCount} 
                    onChange={e => setProvisionCount(Number(e.target.value))} 
                    className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#b8d4f0]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
                    <span>10 Agents</span>
                    <span>100 Agents</span>
                    <span>500 Agents</span>
                  </div>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl">
                  <div className="text-xs text-zinc-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#b8d4f0]" />
                    <span>All {provisionCount} agents will inherit the fleet's ZK policy.</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button onClick={() => setIsProvisionModalOpen(false)} className="btn-liquid btn-liquid-secondary flex-1 py-2.5">Cancel</button>
                <button onClick={handleProvisionAgents} className="btn-liquid btn-liquid-primary flex-1 py-2.5">Provision Swarm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
