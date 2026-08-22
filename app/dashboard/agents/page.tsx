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
    });
    setIsFleetModalOpen(false);
    setNewFleetName("");
    setNewFleetDesc("");
    setNewFleetPolicy("");
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
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fleet</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab("fleets")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "fleets" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          Fleet Management
        </button>
        <button
          onClick={() => setActiveTab("agents")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "agents" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          Individual Agents ({agents.length})
        </button>
      </div>

      {activeTab === "fleets" && (
        <div className="space-y-6">
          {fleets.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
              <Layers className="w-12 h-12 mb-4 opacity-50 text-[#b8d4f0]" />
              <h3 className="text-lg font-medium text-zinc-300 mb-2">No active fleets</h3>
              <p className="text-sm max-w-md text-center">Create a fleet to orchestrate multiple agents under a single master policy.</p>
            </div>
          ) : (
            fleets.map(fleet => {
              const fleetAgents = agents.filter(a => a.fleetId === fleet.id);
              const masterPolicy = policies.find(p => p.id === fleet.policyId);
              
              return (
                <div key={fleet.id} className="glass-panel p-6 border border-zinc-800 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Network className="w-6 h-6 text-[#b8d4f0]" />
                        <h2 className="text-2xl font-bold text-white">{fleet.name}</h2>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs">Active</span>
                      </div>
                      <p className="text-zinc-400 text-sm">{fleet.description}</p>
                    </div>
                    <button 
                      onClick={() => { setProvisionFleetId(fleet.id); setIsProvisionModalOpen(true); }}
                      className="bg-[#b8d4f0] text-black hover:bg-white text-sm font-medium px-4 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                      <Zap className="w-4 h-4" /> Provision Agents
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-800">
                    <div>
                      <h4 className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Master Policy</h4>
                      <div className="flex items-center gap-2 text-white">
                        <ShieldAlert className="w-4 h-4 text-[#b8d4f0]" />
                        <span className="font-medium">{masterPolicy?.name || "None Assigned"}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Deployed Agents</h4>
                      <div className="flex items-center gap-2 text-white">
                        <Cpu className="w-4 h-4 text-zinc-400" />
                        <span className="font-mono text-lg">{fleetAgents.length}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Fleet Total Spend</h4>
                      <div className="flex items-center gap-2 text-white">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-lg">${fleetAgents.reduce((sum, a) => sum + (a.totalSpent||0), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {fleetAgents.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-zinc-800/50">
                      <h4 className="text-sm font-medium text-zinc-300 mb-4">Sample Agents in Fleet (Showing 3 of {fleetAgents.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {fleetAgents.slice(0, 3).map(agent => (
                          <div key={agent.id} className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium text-sm truncate">{agent.name}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            </div>
                            <div className="text-xs text-zinc-500 flex justify-between">
                              <span>Policy: Inherited</span>
                              <span className="font-mono text-zinc-400">${agent.totalSpent} spent</span>
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
            <div className="col-span-full py-12 text-center text-zinc-500">No agents deployed.</div>
          ) : (
            agents.map(agent => {
              const policy = policies.find(p => p.id === agent.policyId);
              const parentFleet = fleets.find(f => f.id === agent.fleetId);
              
              return (
                <div key={agent.id} className="glass-panel p-6 flex flex-col h-full group hover:border-zinc-700 transition-colors">
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

                  <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col gap-2">
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
                        className="w-full bg-[#b8d4f0]/20 text-[#b8d4f0] hover:bg-[#b8d4f0]/30 border border-[#b8d4f0]/30 font-medium text-xs py-2 rounded flex justify-center items-center space-x-1.5 transition-colors disabled:opacity-50"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>{isSpending === agent.id ? "Executing ZK Spend..." : "Execute ZK Spend"}</span>
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => pauseAgent(agent.id)} className="flex-1 btn-secondary py-1 text-xs">Pause</button>
                      <button onClick={() => revokeAgent(agent.id)} className="flex-1 btn-danger py-1 text-xs">Revoke</button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFleetModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-panel p-6 max-w-md w-full relative z-10">
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#b8d4f0]" /> Create Fleet
                </h2>
                <button onClick={() => setIsFleetModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Fleet Name</label>
                  <input type="text" value={newFleetName} onChange={e => setNewFleetName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:outline-none" placeholder="e.g. AWS Procurement Swarm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                  <textarea value={newFleetDesc} onChange={e => setNewFleetDesc(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:outline-none" placeholder="What does this fleet do?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Assign Master Policy (Inherited by all agents)</label>
                  <select value={newFleetPolicy} onChange={e => setNewFleetPolicy(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:outline-none">
                    <option value="" disabled>Select Master Policy</option>
                    {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setIsFleetModalOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleCreateFleet} className="btn-primary">Initialize Fleet</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Provision Agents Modal */}
      <AnimatePresence>
        {isProvisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProvisionModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-panel p-6 max-w-md w-full relative z-10 border border-[#b8d4f0]/20">
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" /> Provision Agents
                </h2>
                <button onClick={() => setIsProvisionModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">Specify how many autonomous agents to spin up and attach to <strong className="text-white">{fleets.find(f => f.id === provisionFleetId)?.name}</strong>.</p>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Agent Count</label>
                  <div className="flex gap-2">
                    {[10, 50, 100, 500].map(num => (
                      <button 
                        key={num} 
                        onClick={() => setProvisionCount(num)}
                        className={`flex-1 py-2 rounded text-sm transition-colors ${provisionCount === num ? 'bg-[#b8d4f0] text-black font-medium' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded border border-zinc-800 mt-4 text-xs text-zinc-400">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Agents will inherit the Fleet's Master Policy.</li>
                    <li>They can be individually overridden later.</li>
                    <li>This simulates connecting external AI agent instances.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setIsProvisionModalOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleProvisionAgents} className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium px-4 py-2 rounded flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Provision {provisionCount} Agents
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
