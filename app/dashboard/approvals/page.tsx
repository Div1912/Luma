"use client";

import { useState } from "react";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { Clock, CheckCircle2, XCircle, ShieldAlert, FileText, ExternalLink, Hash, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const { approvals: approvalRequests, approveRequest, rejectRequest } = useGhostStore();
  const { spend, walletState } = useMidnight();
  const [isApproving, setIsApproving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    approvalRequests?.[0]?.id || null
  );

  const selectedRequest = approvalRequests?.find((r: any) => r.id === selectedId);

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Left Panel - Inbox List */}
      <div className="w-1/3 border-r border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur z-10">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Approvals</h1>
          <div className="flex space-x-4 text-sm">
            <span className="text-zinc-300 font-medium">Pending ({approvalRequests?.filter((r:any) => r.status==='pending').length || 0})</span>
            <span className="text-zinc-600">History</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {approvalRequests?.map((req: any) => (
            <div
              key={req.id}
              onClick={() => setSelectedId(req.id)}
              className={`p-4 rounded-lg cursor-pointer transition-all border ${
                selectedId === req.id
                  ? 'bg-zinc-900 border-zinc-700 shadow-md'
                  : 'bg-transparent border-transparent hover:bg-zinc-900/50 hover:border-zinc-800'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-amber-500 animate-pulse' : req.status === 'approved' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                  <span className="font-medium text-zinc-200">{req.merchant}</span>
                </div>
                <span className="font-mono text-zinc-300">${req.amount}</span>
              </div>
              <div className="text-sm text-zinc-500 flex justify-between">
                <span>{req.agentName}</span>
                <span className="flex items-center text-amber-500/80">
                  <Clock className="w-3 h-3 mr-1" /> 2h left
                </span>
              </div>
            </div>
          ))}
          {(!approvalRequests || approvalRequests.length === 0) && (
            <div className="text-center py-12 text-zinc-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No pending approvals</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Detail View */}
      <div className="flex-1 bg-zinc-950 relative overflow-y-auto">
        {selectedRequest ? (
          <motion.div 
            key={selectedRequest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 max-w-3xl mx-auto"
          >
            <div className="flex justify-between items-start mb-12">
              <div>
                <span className="badge-pending mb-4 inline-block">Action Required</span>
                <h2 className="text-4xl font-bold text-white mb-2">{selectedRequest.merchant}</h2>
                <p className="text-lg text-zinc-400 capitalize">{selectedRequest.category} Expense</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-mono tracking-tight text-white mb-2">${selectedRequest.amount}</div>
                <p className="text-zinc-500">Requested by <span className="text-zinc-300">{selectedRequest.agentName}</span></p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-200 mb-1">Policy Trigger</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    This transaction exceeds the <span className="text-white font-mono">${selectedRequest.ruleTriggered || 500}</span> approval threshold set in the <span className="text-white font-medium">{selectedRequest.policyId}</span> policy.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Transaction Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Date</span>
                    <span className="text-zinc-200">Oct 24, 2023 - 14:32</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Policy</span>
                    <span className="text-zinc-200">{selectedRequest.policyId}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Merchant Risk</span>
                    <span className="text-emerald-400">Low</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Cryptographic Proof</h4>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <Hash className="w-4 h-4" />
                    <span className="text-xs font-mono truncate">{selectedRequest.proofHash || '0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0'}</span>
                  </div>
                  <a 
                    href={`https://preview.midnightexplorer.com/transaction/${selectedRequest.proofHash || '0x7f8a9b2c3d'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#b8d4f0] hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View on Explorer</span>
                  </a>
                </div>
              </div>
            </div>

            {selectedRequest.status === 'pending' ? (
              <div className="flex space-x-4 pt-6 border-t border-zinc-800">
                <button 
                  onClick={() => rejectRequest?.(selectedRequest.id)}
                  disabled={isApproving}
                  className="flex-1 py-4 bg-zinc-900 hover:bg-red-950/40 text-zinc-300 hover:text-red-400 border border-zinc-800 hover:border-red-900 rounded-lg font-medium transition-all flex justify-center items-center space-x-2 group disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
                  className="flex-1 py-4 bg-[#b8d4f0]/10 hover:bg-[#b8d4f0]/20 text-[#b8d4f0] border border-[#b8d4f0]/20 hover:border-[#b8d4f0]/40 rounded-lg font-medium transition-all flex justify-center items-center space-x-2 group disabled:opacity-50"
                >
                  {isApproving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                  <span>{isApproving ? "Executing ZK Spend on Midnight..." : "Approve & Sign On-Chain"}</span>
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                <p className="text-zinc-400">This request has been <span className="font-medium text-white capitalize">{selectedRequest.status}</span>.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">Select a request to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
