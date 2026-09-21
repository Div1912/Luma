"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhostStore } from "@/store/useGhostStore";
import { Activity, ShieldAlert, Cpu, Network, Terminal, CheckCircle2, AlertTriangle, Zap, Server } from "lucide-react";

export function SwarmTelemetry() {
  const { agents, fleets, auditEvents } = useGhostStore();
  const [logs, setLogs] = useState<{ id: string; text: string; type: string; time: string }[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);

  // Simulated Telemetry Feed
  useEffect(() => {
    if (agents.length === 0) return;

    const generateLog = () => {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const actions = [
        { type: "ZKP_VERIFY", text: `[${agent.name}] Synthesizing zero-knowledge proof for inference limits...`, color: "text-[#b8d4f0]" },
        { type: "POLICY_SYNC", text: `[${agent.name}] Local policy state synchronized with Quorum Consensus.`, color: "text-zinc-400" },
        { type: "SHIELD_EXEC", text: `[${agent.name}] Executing shielded contract state transition.`, color: "text-emerald-400" },
        { type: "NETWORK_PING", text: `[${agent.name}] Node heartbeat acknowledged. Latency: ${Math.floor(Math.random() * 25 + 5)}ms`, color: "text-zinc-500" },
        { type: "THREAT_SCAN", text: `[${agent.name}] Anomaly scan clear. 0 malicious sub-routines detected.`, color: "text-blue-400" }
      ];

      const action = actions[Math.floor(Math.random() * actions.length)];
      
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

      setLogs(prev => {
        const newLogs = [...prev, { id: Math.random().toString(36), text: action.text, type: action.color, time: timeStr }];
        return newLogs.slice(-25);
      });

      // Flash node in topology map
      setActiveNodes(prev => {
        const updated = [...prev, agent.id];
        setTimeout(() => {
          setActiveNodes(current => current.filter(id => id !== agent.id));
        }, 800);
        return updated;
      });
    };

    const interval = setInterval(generateLog, 1200);
    return () => clearInterval(interval);
  }, [agents]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
    }
  }, [logs]);

  // If no agents exist, show empty state
  if (agents.length === 0) return null;

  return (
    <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Topology Map */}
      <div className="lg:col-span-2 glass-liquid-panel p-6 flex flex-col relative overflow-hidden h-[340px]">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[#b8d4f0]" />
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">Live Swarm Topology</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-400 tracking-wider">SYSTEM OPTIMAL</span>
            </div>
            <div className="px-2 py-1 bg-white/5 border border-white/10 rounded font-mono text-[10px] text-white/70">
              {agents.length} ACTIVE NODES
            </div>
          </div>
        </div>

        {/* Dynamic Node Grid Map */}
        <div className="flex-1 relative bg-black/40 border border-white/5 rounded-xl overflow-hidden inset-shadow-sm p-4">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
          
          <div className="relative h-full flex flex-wrap content-start gap-4 p-2 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {agents.map((agent, i) => {
                const isActive = activeNodes.includes(agent.id);
                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <div className={`
                      w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-300 relative z-10
                      ${isActive ? 'bg-[#b8d4f0]/20 border-[#b8d4f0] shadow-[0_0_15px_rgba(184,212,240,0.5)]' : 'bg-black/60 border-white/10 hover:border-white/30'}
                    `}>
                      <Cpu className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    </div>
                    {/* Activity Ping Ring */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 rounded-lg border border-[#b8d4f0] pointer-events-none z-0"
                      />
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-white/20 rounded text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {agent.name}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Live Cryptographic Terminal */}
      <div className="glass-liquid-panel p-6 flex flex-col h-[340px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-semibold tracking-wider text-zinc-400 font-mono uppercase">Telemetry Stream</h3>
          </div>
        </div>

        <div 
          ref={logsEndRef}
          className="flex-1 bg-black/60 border border-white/5 rounded-xl p-3 overflow-y-auto font-mono text-[10px] space-y-1.5 custom-scrollbar"
        >
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 border-b border-white/[0.02] pb-1.5"
              >
                <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
                <span className={`${log.type} leading-relaxed`}>{log.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
