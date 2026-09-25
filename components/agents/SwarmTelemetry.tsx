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

  // Real telemetry feed from actual audit events and active agent status
  useEffect(() => {
    if (agents.length === 0 && auditEvents.length === 0) return;

    const realLogs: { id: string; text: string; type: string; time: string; agentId?: string }[] = [];

    // Map real audit events
    auditEvents.slice(0, 30).forEach((evt) => {
      const evtTime = new Date(evt.timestamp);
      const timeStr = !isNaN(evtTime.getTime()) 
        ? `${evtTime.getHours().toString().padStart(2, '0')}:${evtTime.getMinutes().toString().padStart(2, '0')}:${evtTime.getSeconds().toString().padStart(2, '0')}`
        : "LIVE";

      let color = "text-zinc-400";
      if (evt.status === "failed" || evt.type === "purchase_blocked") {
        color = "text-rose-400";
      } else if (evt.status === "success" || evt.type === "purchase_approved") {
        color = "text-emerald-400";
      } else if (evt.type === "proof_verified") {
        color = "text-[#b8d4f0]";
      } else if (evt.type === "policy_created") {
        color = "text-sky-400";
      }

      realLogs.push({
        id: evt.id,
        text: `[${evt.agentName || "SYSTEM"}] ${evt.description || evt.type.replace(/_/g, " ").toUpperCase()}${evt.proofHash ? ` (proof: ${evt.proofHash.slice(0, 10)}...)` : ""}`,
        type: color,
        time: timeStr,
        agentId: evt.agentId
      });
    });

    // Also include connected agent states if auditEvents are empty
    if (realLogs.length === 0) {
      agents.forEach((agent) => {
        realLogs.push({
          id: agent.id,
          text: `[${agent.name}] Status: ${agent.status.toUpperCase()} | Risk: ${agent.risk.toUpperCase()} | Policy: ${agent.policyId || "Default"}`,
          type: agent.status === "connected" ? "text-emerald-400" : agent.status === "paused" ? "text-amber-400" : "text-zinc-500",
          time: "LIVE",
          agentId: agent.id
        });
      });
    }

    setLogs(realLogs);

    // Active nodes flash based on recently active agents
    const activeIds = agents.filter(a => a.status === 'connected').map(a => a.id);
    setActiveNodes(activeIds);
  }, [agents, auditEvents]);

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
