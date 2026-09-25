"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { Search, Filter, Download, ChevronRight, X, Terminal, Hash, Activity, ShieldCheck, Copy, ExternalLink } from "lucide-react";

export default function AuditPage() {
  const { auditEvents } = useGhostStore();
  const { network } = useMidnight();
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = (auditEvents || []).filter((ev: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const hash = ev.txHash || ev.proofHash || "";
    const agent = ev.agentName || ev.agent || "";
    const wallet = ev.walletAddress || ev.metadata?.wallet_address || "";
    const user = ev.userName || ev.metadata?.user_name || "";
    return (
      (ev.description && ev.description.toLowerCase().includes(q)) ||
      hash.toLowerCase().includes(q) ||
      agent.toLowerCase().includes(q) ||
      user.toLowerCase().includes(q) ||
      wallet.toLowerCase().includes(q) ||
      (ev.merchant && ev.merchant.toLowerCase().includes(q)) ||
      (ev.type && ev.type.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    if (!auditEvents || auditEvents.length === 0) return;
    const headers = ["ID", "Type", "Agent", "User", "Wallet Address", "Merchant", "Amount", "Status", "Timestamp", "ProofHash", "Description"];
    const rows = auditEvents.map((e: any) => [
      e.id,
      e.type,
      e.agentName || e.agent || "",
      e.userName || e.metadata?.user_name || "",
      e.walletAddress || e.metadata?.wallet_address || "",
      e.merchant || "",
      e.amount || 0,
      e.status,
      e.timestamp || e.time || "",
      e.txHash || e.proofHash || "",
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
        <button onClick={handleExportCSV} className="btn-liquid btn-liquid-secondary flex items-center gap-2">
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
            className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-white/30 focus:outline-none text-sm font-mono"
          />
        </div>
      </div>

      <div className="glass-liquid overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10 text-zinc-400 text-xs font-mono uppercase tracking-wider">
              <th className="py-4 px-6 font-medium">Type</th>
              <th className="py-4 px-6 font-medium">Agent</th>
              <th className="py-4 px-6 font-medium">Details</th>
              <th className="py-4 px-6 font-medium">Amount</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Proof Hash</th>
              <th className="py-4 px-6 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(!filteredEvents || filteredEvents.length === 0) ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center">
                    <Activity className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-base font-medium text-zinc-400">No events found</p>
                    <p className="text-sm mt-1 max-w-sm">Execute an agent transaction or deploy a contract to start generating immutable audit logs.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev: any) => {
                const txHash = ev.txHash || ev.proofHash;
                const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (ev.time || '-');
                const displayName = ev.agentName || ev.agent || ev.userName || 'Midnight Agent';
                const userOrWallet = ev.userName || (ev.walletAddress ? `${ev.walletAddress.slice(0, 6)}...${ev.walletAddress.slice(-4)}` : '');

                return (
                  <tr 
                    key={ev.id} 
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 text-sm text-zinc-400 font-mono">{timeStr}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {getEventIcon(ev.type)}
                        <span className="text-sm text-zinc-300 capitalize">{ev.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-200">
                      <div>{displayName}</div>
                      {userOrWallet && userOrWallet !== displayName && (
                        <div className="text-[11px] text-zinc-500 font-mono">{userOrWallet}</div>
                      )}
                    </td>
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
                    <td className="py-4 px-6 text-center text-zinc-500 group-hover:text-zinc-300" onClick={(e) => { if (txHash) e.stopPropagation(); }}>
                      {txHash ? (
                        <div className="flex items-center justify-center gap-2.5">
                          <a 
                            href={`https://explorer.1am.xyz/${ev.type === 'policy_created' ? 'contract' : 'tx'}/${txHash.replace(/^0x/, '')}?network=${(ev.metadata?.network as string) || network || 'preprod'}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-[#b8d4f0] transition-colors inline-block"
                            title="View on 1AM Explorer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a 
                            href={`https://${(ev.metadata?.network as string) || network || 'preprod'}.midnightexplorer.com/${ev.type === 'policy_created' ? 'contracts' : 'transactions'}/${txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors inline-block"
                            title={`View on Midnight ${((ev.metadata?.network as string) || network || 'preprod').toUpperCase()} Explorer`}
                          >
                            <Hash className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })
            )}
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
              className="fixed inset-y-0 right-0 w-full max-w-lg glass-liquid-panel border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-[#b8d4f0]" />
                  <span>Event Details</span>
                </h2>
                <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider ${
                      selectedEvent.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      selectedEvent.status === 'blocked' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-white/10 text-zinc-300'
                    }`}>
                      {selectedEvent.type.replace('_', ' ')}
                    </span>
                    <span className="text-zinc-400 text-xs font-mono">{selectedEvent.time}</span>
                  </div>
                  <p className="text-base text-white leading-relaxed mt-4">
                    {selectedEvent.description || `Agent ${selectedEvent.agent} processed a transaction at ${selectedEvent.merchant} for $${selectedEvent.amount}.`}
                  </p>
                </div>

                {selectedEvent.proofHash && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Cryptographic Proof / Tx Hash ({((selectedEvent.metadata?.network as string) || network || 'preprod').toUpperCase()})</h4>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex justify-between items-center group">
                      <span className="text-xs font-mono text-[#b8d4f0] break-all mr-4">
                        {selectedEvent.proofHash}
                      </span>
                      <button 
                        onClick={() => {
                          navigator.clipboard?.writeText(selectedEvent.proofHash || '');
                        }}
                        className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
                        title="Copy Hash"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a 
                        href={`https://explorer.1am.xyz/tx/${selectedEvent.proofHash.replace(/^0x/, '')}?network=${(selectedEvent.metadata?.network as string) || network || 'preprod'}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-[#b8d4f0]/10 hover:bg-[#b8d4f0]/20 border border-[#b8d4f0]/30 rounded-lg text-xs font-mono text-[#b8d4f0] hover:text-white transition-colors flex items-center justify-center gap-1.5 text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>1AM Explorer</span>
                      </a>
                      <a 
                        href={`https://${(selectedEvent.metadata?.network as string) || network || 'preprod'}.midnightexplorer.com/transactions/${selectedEvent.proofHash}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg text-xs font-mono text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Midnight Explorer</span>
                      </a>
                    </div>
                  </div>
                )}

                {((selectedEvent as any).contract_address || (selectedEvent as any).contractAddress || selectedEvent.metadata?.contractAddress) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Deployed Contract Address</h4>
                    <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-4 flex justify-between items-center group">
                      <span className="text-xs font-mono text-emerald-300 break-all mr-4">
                        {(selectedEvent as any).contract_address || (selectedEvent as any).contractAddress || selectedEvent.metadata?.contractAddress}
                      </span>
                      <button 
                        onClick={() => {
                          const addr = (selectedEvent as any).contract_address || (selectedEvent as any).contractAddress || selectedEvent.metadata?.contractAddress;
                          if (addr) navigator.clipboard?.writeText(addr);
                        }}
                        className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
                        title="Copy Contract Address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a 
                        href={`https://explorer.1am.xyz/contract/${((selectedEvent as any).contract_address || (selectedEvent as any).contractAddress || selectedEvent.metadata?.contractAddress || '').replace(/^0x/, '')}?network=${(selectedEvent.metadata?.network as string) || network || 'preprod'}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Contract on 1AM</span>
                      </a>
                      <a 
                        href={`https://${(selectedEvent.metadata?.network as string) || network || 'preprod'}.midnightexplorer.com/contracts/${(selectedEvent as any).contract_address || (selectedEvent as any).contractAddress || selectedEvent.metadata?.contractAddress}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg text-xs font-mono text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Contract on Midnight</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Metadata</h4>
                  <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-xs font-mono">
                      <tbody className="divide-y divide-white/5">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-4 text-zinc-400 font-medium w-1/3">Event ID</td>
                          <td className="py-2.5 px-4 text-zinc-200">{selectedEvent.id}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-4 text-zinc-400 font-medium">Agent</td>
                          <td className="py-2.5 px-4 text-zinc-200">{selectedEvent.agentName || selectedEvent.agent || 'Midnight Agent'}</td>
                        </tr>
                        {(selectedEvent.userName || selectedEvent.metadata?.user_name) && (
                          <tr className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 text-zinc-400 font-medium">User</td>
                            <td className="py-2.5 px-4 text-zinc-200">{selectedEvent.userName || selectedEvent.metadata?.user_name}</td>
                          </tr>
                        )}
                        {(selectedEvent.walletAddress || selectedEvent.metadata?.wallet_address) && (
                          <tr className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 text-zinc-400 font-medium">Wallet Address</td>
                            <td className="py-2.5 px-4 text-zinc-200 font-mono text-[11px] break-all">{selectedEvent.walletAddress || selectedEvent.metadata?.wallet_address}</td>
                          </tr>
                        )}
                        {((selectedEvent as any).contract_address || (selectedEvent as any).contractAddress || selectedEvent.metadata?.contractAddress) && (
                          <tr className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 text-zinc-400 font-medium">Contract Address</td>
                            <td className="py-2.5 px-4 text-emerald-400 font-mono text-[11px] break-all">{((selectedEvent as any).contract_address || (selectedEvent as any).contractAddress || selectedEvent.metadata?.contractAddress)}</td>
                          </tr>
                        )}
                        {selectedEvent.merchant && (
                          <tr className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 text-zinc-400 font-medium">Target</td>
                            <td className="py-2.5 px-4 text-zinc-200">{selectedEvent.merchant}</td>
                          </tr>
                        )}
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-4 text-zinc-400 font-medium">Status Code</td>
                          <td className="py-2.5 px-4 text-zinc-200">{selectedEvent.status === 'success' ? '200 OK' : '403 FORBIDDEN'}</td>
                        </tr>
                        {Object.entries(selectedEvent.metadata || {}).map(([key, val]) => (
                          <tr key={key} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 text-zinc-400 font-medium capitalize">{key.replace('_', ' ')}</td>
                            <td className="py-2.5 px-4 text-zinc-200">{String(val)}</td>
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
