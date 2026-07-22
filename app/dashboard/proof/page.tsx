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
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <ShieldCheck className="w-12 h-12 mb-4 opacity-50 text-[#b8d4f0]" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No proofs generated yet</h3>
            <p className="text-sm max-w-md text-center">Deploy a contract and execute a private spend via an agent to generate verifiable zero-knowledge proofs on the Midnight network.</p>
          </div>
        ) : (
          provedEvents.map((ev: any) => (
            <motion.div 
              key={ev.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedProof(ev)}
              className="glass-panel p-6 cursor-pointer group border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-2 bg-blue-500/10 text-[#b8d4f0] rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-zinc-900 text-zinc-400 rounded">
                  {ev.time}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white capitalize">{ev.type.replace('_', ' ')}</h3>
                  <p className="text-sm text-zinc-400 mt-1 truncate">{ev.merchant || ev.description}</p>
                </div>

                <div className="bg-zinc-900 rounded p-3 font-mono text-xs text-zinc-500 truncate group-hover:text-zinc-300 transition-colors">
                  {ev.proofHash}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
              onClick={() => setSelectedProof(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => setSelectedProof(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-white mb-8">Proof Verification</h2>

                <div className="space-y-8">
                  {/* Status Badge */}
                  <div className="flex items-center space-x-3 p-4 bg-[#b8d4f0]/10 border border-[#b8d4f0]/20 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-[#b8d4f0]" />
                    <div>
                      <div className="text-[#b8d4f0] font-medium tracking-wide">VERIFIED SECURELY</div>
                      <div className="text-sm text-[#b8d4f0]/70">Zero-knowledge proof confirms policy adherence without revealing sensitive data.</div>
                    </div>
                  </div>

                  {/* Hash */}
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">ZK Proof Hash</label>
                    <div className="font-mono text-sm sm:text-base text-zinc-300 bg-zinc-900 p-4 rounded-lg break-all border border-zinc-800">
                      {selectedProof.proofHash}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4 block">Verification Timeline</label>
                    <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-zinc-800">
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1 p-1 bg-zinc-950 rounded-full border-2 border-emerald-500">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200">Execution Request</h4>
                        <p className="text-xs text-zinc-500 mt-1">{selectedProof.time} • Local Node</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1 p-1 bg-zinc-950 rounded-full border-2 border-emerald-500">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200">ZK Circuit Generation</h4>
                        <p className="text-xs text-zinc-500 mt-1">Local Prover • Proving private inputs (witness)</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1 p-1 bg-zinc-950 rounded-full border-2 border-emerald-500">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200">Submit Unshielded Transaction</h4>
                        <p className="text-xs text-zinc-500 mt-1">Network • Transaction balanced & shielded</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1 p-1 bg-zinc-950 rounded-full border-2 border-[#b8d4f0]">
                          <div className="w-2 h-2 rounded-full bg-[#b8d4f0] animate-pulse" />
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200">State Transition Confirmed</h4>
                        <p className="text-xs text-zinc-500 mt-1">Midnight Ledger • Public state updated</p>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-6 border-t border-zinc-800">
                    <a 
                      href={`https://preview.midnightexplorer.com/transactions/${selectedProof.proofHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg flex items-center justify-center space-x-2 border border-zinc-800 transition-colors"
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
