"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhostStore } from "@/store/useGhostStore";
import { Search, Filter, Download, ChevronRight, X, Terminal, Hash, Activity, ShieldCheck, Copy } from "lucide-react";

export default function AuditPage() {
  const { auditEvents } = useGhostStore();
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = (auditEvents || []).filter((ev: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (ev.description && ev.description.toLowerCase().includes(q)) ||
      (ev.proofHash && ev.proofHash.toLowerCase().includes(q)) ||
      (ev.agentName && ev.agentName.toLowerCase().includes(q)) ||
      (ev.merchant && ev.merchant.toLowerCase().includes(q)) ||
      (ev.type && ev.type.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    if (!auditEvents || auditEvents.length === 0) return;
    const headers = ["ID", "Type", "Agent", "Merchant", "Amount", "Status", "Timestamp", "ProofHash", "Description"];
    const rows = auditEvents.map((e: any) => [
      e.id,
      e.type,
      e.agentName || e.agent || "",
      e.merchant || "",
      e.amount || 0,
      e.status,
      e.timestamp || e.time || "",
      e.proofHash || "",
      `"${(e.description || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ghost_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'transaction': return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'policy_update': return <ShieldCheck className="w-4 h-4 text-blue-400" />;
      case 'agent_action': return <Terminal className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Audit Log</h1>
          <p className="text-zinc-400 mt-1">Immutable record of all agent activities and system events.</p>
        </div>
        <button onClick={handleExportCSV} className="btn-secondary flex items-center space-x-2 hover:bg-zinc-800 text-white">
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, hashes, or agents..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 pl-10 pr-4 text-white focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <button className="p-2 border border-zinc-800 rounded-md text-zinc-400 hover:bg-zinc-800 transition-colors flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
              <th className="py-4 px-6 font-medium w-48">Time</th>
              <th className="py-4 px-6 font-medium w-32">Type</th>
              <th className="py-4 px-6 font-medium">Agent</th>
              <th className="py-4 px-6 font-medium">Detail</th>
              <th className="py-4 px-6 font-medium text-right">Amount</th>
              <th className="py-4 px-6 font-medium text-center">Status</th>
              <th className="py-4 px-6 font-medium text-center">Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {(filteredEvents || []).map((ev: any) => (
              <tr 
                key={ev.id} 
                onClick={() => setSelectedEvent(ev)}
                className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
              >
                <td className="py-4 px-6 text-sm text-zinc-400 font-mono">{ev.time}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    {getEventIcon(ev.type)}
                    <span className="text-sm text-zinc-300 capitalize">{ev.type.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-zinc-200">{ev.agent}</td>
                <td className="py-4 px-6 text-sm text-zinc-400 truncate max-w-[200px]">{ev.merchant || ev.description}</td>
                <td className="py-4 px-6 text-sm text-right font-mono text-zinc-300">
                  {ev.amount ? `$${ev.amount}` : '-'}
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    ev.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    ev.status === 'blocked' ? 'bg-red-500/10 text-red-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {ev.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center text-zinc-500 group-hover:text-zinc-300" onClick={(e) => { if(ev.proofHash) e.stopPropagation(); }}>
                  {ev.proofHash ? (
                    <a 
                      href={`https://preview.midnightexplorer.com/transaction/${ev.proofHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-[#b8d4f0] transition-colors inline-block"
                      title="View on Explorer"
                    >
                      <Hash className="w-4 h-4 mx-auto" />
                    </a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-lg bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-zinc-400" />
                  <span>Event Details</span>
                </h2>
                <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider ${
                      selectedEvent.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                      selectedEvent.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                      'bg-zinc-800 text-zinc-300'
                    }`}>
                      {selectedEvent.type.replace('_', ' ')}
                    </span>
                    <span className="text-zinc-500 text-sm font-mono">{selectedEvent.time}</span>
                  </div>
                  <p className="text-lg text-white leading-relaxed mt-4">
                    {selectedEvent.description || `Agent ${selectedEvent.agent} processed a transaction at ${selectedEvent.merchant} for $${selectedEvent.amount}.`}
                  </p>
                </div>

                {selectedEvent.proofHash && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Cryptographic Proof</h4>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-center group">
                      <a 
                        href={`https://preview.midnightexplorer.com/transaction/${selectedEvent.proofHash}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-[#b8d4f0] hover:text-white hover:underline break-all mr-4 transition-colors"
                      >
                        {selectedEvent.proofHash}
                      </a>
                      <button className="text-zinc-500 group-hover:text-white transition-colors flex-shrink-0">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Metadata</h4>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-zinc-800">
                        <tr className="hover:bg-zinc-900">
                          <td className="py-2 px-4 text-zinc-500 font-medium w-1/3">Event ID</td>
                          <td className="py-2 px-4 text-zinc-300 font-mono">{selectedEvent.id}</td>
                        </tr>
                        <tr className="hover:bg-zinc-900">
                          <td className="py-2 px-4 text-zinc-500 font-medium">Agent</td>
                          <td className="py-2 px-4 text-zinc-300">{selectedEvent.agent}</td>
                        </tr>
                        {selectedEvent.merchant && (
                          <tr className="hover:bg-zinc-900">
                            <td className="py-2 px-4 text-zinc-500 font-medium">Target</td>
                            <td className="py-2 px-4 text-zinc-300">{selectedEvent.merchant}</td>
                          </tr>
                        )}
                        <tr className="hover:bg-zinc-900">
                          <td className="py-2 px-4 text-zinc-500 font-medium">Status Code</td>
                          <td className="py-2 px-4 text-zinc-300 font-mono">{selectedEvent.status === 'success' ? '200 OK' : '403 FORBIDDEN'}</td>
                        </tr>
                        {Object.entries(selectedEvent.metadata || {}).map(([key, val]) => (
                          <tr key={key} className="hover:bg-zinc-900">
                            <td className="py-2 px-4 text-zinc-500 font-medium capitalize">{key.replace('_', ' ')}</td>
                            <td className="py-2 px-4 text-zinc-300 font-mono">{String(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
