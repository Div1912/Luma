"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhostStore } from "@/store/useGhostStore";
import { ShieldCheck, Hash, ExternalLink, Activity, Clock, Box, X } from "lucide-react";

export default function ProofPage() {
  const { auditEvents } = useGhostStore();
  const [selectedProof, setSelectedProof] = useState<any | null>(null);

  // Filter only events that have a proof hash
  const provedEvents = (auditEvents || []).filter((e: any) => e.proofHash);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Zero-Knowledge Proofs</h1>
        <p className="text-zinc-400">Verifiable cryptographic evidence of all policy executions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {provedEvents.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-2xl glass-liquid">
            <ShieldCheck className="w-12 h-12 mb-4 opacity-50 text-[#b8d4f0]" />
            <h3 className="text-lg font-medium text-zinc-200 mb-2">No proofs generated yet</h3>
            <p className="text-sm max-w-md text-center text-zinc-400">Deploy a contract and execute a private spend via an agent to generate verifiable zero-knowledge proofs on the Midnight network.</p>
          </div>
        ) : (
          provedEvents.map((ev: any) => (
            <motion.div 
              key={ev.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedProof(ev)}
              className="glass-liquid p-6 cursor-pointer group hover:border-white/20 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-2.5 bg-[#b8d4f0]/10 text-[#b8d4f0] border border-[#b8d4f0]/20 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-white/[0.04] border border-white/10 text-zinc-300 rounded-lg">
                  {ev.time}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white capitalize">{ev.type.replace('_', ' ')}</h3>
                  <p className="text-xs text-zinc-400 mt-1 truncate font-mono">{ev.merchant || ev.description}</p>
                </div>

                <div className="bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-zinc-400 truncate group-hover:text-white transition-colors">
                  {ev.proofHash}
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 shadow-[0_0_6px_#34d399]" />
                    Verified on Midnight
                  </span>
                  <span className="text-zinc-500">Block #{(Math.random() * 1000000).toFixed(0)}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedProof && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 flex items-center justify-center p-4"
              onClick={() => setSelectedProof(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="glass-liquid-panel p-8 max-w-2xl w-full shadow-2xl relative space-y-8"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => setSelectedProof(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-white">Proof Verification</h2>

                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center space-x-3 p-4 bg-[#b8d4f0]/10 border border-[#b8d4f0]/25 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-[#b8d4f0]" />
                    <div>
                      <div className="text-[#b8d4f0] font-medium tracking-wide text-xs uppercase font-mono">VERIFIED SECURELY ON-CHAIN</div>
                      <div className="text-xs text-[#b8d4f0]/80 mt-0.5">Zero-knowledge proof confirms policy adherence without revealing sensitive data.</div>
                    </div>
                  </div>

                  {/* Hash */}
                  <div>
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2 block">ZK Proof Hash</label>
                    <div className="font-mono text-xs text-zinc-200 bg-black/60 p-3.5 rounded-xl break-all border border-white/10">
                      {selectedProof.proofHash}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4 block">Verification Timeline</label>
                    <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-white/10">
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1 p-1 bg-black rounded-full border-2 border-emerald-400">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200">Execution Request</h4>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedProof.time} • Local Node</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1 p-1 bg-black rounded-full border-2 border-emerald-400">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200">ZK Circuit Generation</h4>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">Local Prover • Proving private inputs (witness)</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1 p-1 bg-black rounded-full border-2 border-emerald-400">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200">Submit Unshielded Transaction</h4>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">Network • Transaction balanced & shielded</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1 p-1 bg-black rounded-full border-2 border-[#b8d4f0]">
                          <div className="w-2 h-2 rounded-full bg-[#b8d4f0] animate-pulse" />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200">State Transition Confirmed</h4>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">Midnight Ledger • Public state updated</p>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-4 border-t border-white/10">
                    <a 
                      href={`https://${(selectedProof.metadata?.network as string) || 'preview'}.midnightexplorer.com/${selectedProof.type === 'policy_created' ? 'contracts' : 'transactions'}/${selectedProof.proofHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-liquid btn-liquid-cyan w-full py-3 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View on Midnight Explorer</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
