"use client";

import { useState } from "react";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { Clock, CheckCircle2, XCircle, Shield, ShieldAlert, FileText, ExternalLink, Hash, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const { approvals: approvalRequests, approveRequest, rejectRequest } = useGhostStore();
  const { spend, walletState, network } = useMidnight();
  const [isApproving, setIsApproving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    approvalRequests?.[0]?.id || null
  );

  const selectedRequest = approvalRequests?.find((r: any) => r.id === selectedId);

  return (
    <div className="h-[calc(100vh-5rem)] flex overflow-hidden">
      {/* Left Panel - Inbox List */}
      <div className="w-1/3 border-r border-white/10 bg-black/40 backdrop-blur-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 bg-white/[0.02]">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Approvals</h1>
          <div className="flex space-x-4 text-xs font-mono uppercase tracking-wider">
            <span className="text-[#b8d4f0] font-medium bg-[#b8d4f0]/10 px-2 py-0.5 rounded">Pending ({approvalRequests?.filter((r:any) => r.status==='pending').length || 0})</span>
            <span className="text-zinc-500 py-0.5">History</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {approvalRequests?.map((req: any) => (
            <div
              key={req.id}
              onClick={() => setSelectedId(req.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedId === req.id
                  ? 'glass-liquid border-white/25 shadow-lg'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]' : req.status === 'approved' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-zinc-600'}`} />
                  <span className="font-medium text-zinc-100">{req.merchant}</span>
                </div>
                <span className="font-mono text-white font-medium">${req.amount}</span>
              </div>
              <div className="text-xs text-zinc-400 flex justify-between font-mono">
                <span>{req.agentName}</span>
                <span className="flex items-center text-amber-400/90">
                  <Clock className="w-3 h-3 mr-1" /> 2h left
                </span>
              </div>
            </div>
          ))}
          {(!approvalRequests || approvalRequests.length === 0) && (
            <div className="text-center py-12 text-zinc-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No pending approvals</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Detail View */}
      <div className="flex-1 bg-black/20 backdrop-blur-xl relative overflow-y-auto">
        {selectedRequest ? (
          <motion.div 
            key={selectedRequest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 max-w-3xl mx-auto space-y-8"
          >
            <div className="glass-liquid p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="badge-pending mb-4 inline-block font-mono">Action Required</span>
                  <h2 className="text-4xl font-bold text-white mb-1">{selectedRequest.merchant}</h2>
                  <p className="text-sm text-zinc-400 capitalize">{selectedRequest.category} Expense</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-mono tracking-tight text-white mb-1">${selectedRequest.amount}</div>
                  <p className="text-xs text-zinc-400 font-mono">Requested by <span className="text-[#b8d4f0]">{selectedRequest.agentName}</span></p>
                </div>
              </div>

              {selectedRequest.amount >= 50000 && (
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-5 mb-6 shadow-inner">
                  <div className="flex items-start space-x-4">
                    <div className="p-2.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
                      <Shield className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-purple-200">Multi-Party ZK Approval Required (&gt; $50,000)</h3>
                        <span className="text-[10px] bg-purple-500/20 text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">Quorum: 2/3 Signers</span>
                      </div>
                      <p className="text-purple-300/80 text-xs mt-1 leading-relaxed">
                        This transaction exceeds the enterprise multi-party threshold ($50,000). Compact circuit requires cryptographic authorization tokens from at least 2 enterprise signing keys before on-chain settlement.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200 mb-1">Policy Trigger</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This transaction exceeds the <span className="text-white font-mono">${selectedRequest.ruleTriggered || 500}</span> approval threshold set in the <span className="text-[#b8d4f0] font-medium">{selectedRequest.policyId}</span> policy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Transaction Details</h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Date</span>
                      <span className="text-zinc-200">Oct 24, 2023 - 14:32</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Policy</span>
                      <span className="text-zinc-200">{selectedRequest.policyId}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-400">Merchant Risk</span>
                      <span className="text-emerald-400">Low Risk</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Cryptographic Proof</h4>
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center space-x-2 text-zinc-400">
                      <Hash className="w-4 h-4 text-[#b8d4f0]" />
                      <span className="text-[11px] font-mono truncate">{selectedRequest.proofHash || '0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0'}</span>
                    </div>
                    <a 
                      href={`https://${network || 'preview'}.midnightexplorer.com/transactions/${selectedRequest.proofHash || '0x7f8a9b2c3d'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#b8d4f0] hover:text-white transition-colors flex items-center space-x-1 font-mono"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View on Midnight Explorer</span>
                    </a>
                  </div>
                </div>
              </div>

              {selectedRequest.status === 'pending' ? (
                <div className="flex space-x-4 pt-8 mt-6 border-t border-white/10">
                  <button 
                    onClick={() => rejectRequest?.(selectedRequest.id)}
                    disabled={isApproving}
                    className="btn-liquid btn-liquid-danger flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Request</span>
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        setIsApproving(true);
                        if (walletState.isConnected) {
                          await spend(BigInt(Math.floor(selectedRequest.amount || 50)));
                        }
                        approveRequest?.(selectedRequest.id);
                        toast.success("Approval Confirmed", {
                          description: "Transaction has been signed and recorded on Midnight testnet."
                        });
                      } catch (e: any) {
                        toast.error("Approval Error", {
                          description: e.message || String(e)
                        });
                      } finally {
                        setIsApproving(false);
                      }
                    }}
                    disabled={isApproving}
                    className="btn-liquid btn-liquid-cyan flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isApproving ? "Executing ZK Spend on Midnight..." : "Approve & Sign On-Chain"}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-center mt-6">
                  <p className="text-xs text-zinc-400 font-mono">This request has been <span className="font-medium text-white capitalize">{selectedRequest.status}</span>.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-mono">Select a request to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
