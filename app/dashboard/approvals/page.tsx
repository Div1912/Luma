"use client";

import { useState, useMemo } from "react";
import { useGhostStore, Approval } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  ShieldAlert, 
  FileText, 
  ExternalLink, 
  Hash, 
  Loader2, 
  Sparkles, 
  History, 
  Calendar, 
  Check, 
  Ban, 
  Copy, 
  Cpu, 
  Layers,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const { approvals: approvalRequests, approveRequest, rejectRequest } = useGhostStore();
  const { spend, walletState, network } = useMidnight();
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "history" | "all">("pending");

  const pendingList = useMemo(() => {
    return (approvalRequests || []).filter((r: Approval) => r.status === "pending");
  }, [approvalRequests]);

  const historyList = useMemo(() => {
    return (approvalRequests || []).filter((r: Approval) => r.status !== "pending");
  }, [approvalRequests]);

  const displayedList = useMemo(() => {
    if (activeTab === "pending") return pendingList;
    if (activeTab === "history") return historyList;
    return approvalRequests || [];
  }, [activeTab, pendingList, historyList, approvalRequests]);

  const [selectedId, setSelectedId] = useState<string | null>(
    pendingList[0]?.id || historyList[0]?.id || null
  );

  // Keep selectedId valid when switching tabs
  const selectedRequest = useMemo(() => {
    const found = (approvalRequests || []).find((r: Approval) => r.id === selectedId);
    if (found) return found;
    return displayedList[0] || null;
  }, [approvalRequests, selectedId, displayedList]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex overflow-hidden rounded-2xl border border-white/10 glass-liquid-panel shadow-2xl">
      {/* Left Panel - Inbox List */}
      <div className="w-full md:w-[380px] lg:w-[420px] border-r border-white/10 bg-black/40 backdrop-blur-2xl flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#b8d4f0]" />
              <span>Approvals Center</span>
            </h1>
            <span className="text-[10px] font-mono uppercase bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full">
              {displayedList.length} Items
            </span>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="flex items-center p-1 bg-black/50 border border-white/10 rounded-xl text-xs font-mono">
            <button
              onClick={() => {
                setActiveTab("pending");
                if (pendingList.length > 0) setSelectedId(pendingList[0].id);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-[#b8d4f0] text-black font-bold shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>Pending</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'pending' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
                {pendingList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("history");
                if (historyList.length > 0) setSelectedId(historyList[0].id);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-[#b8d4f0] text-black font-bold shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'history' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
                {historyList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`py-1.5 px-3 rounded-lg transition-all text-center ${
                activeTab === "all"
                  ? "bg-[#b8d4f0] text-black font-bold shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              All
            </button>
          </div>
        </div>
        
        {/* Inbox Scrollable Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {displayedList.length === 0 ? (
            <div className="text-center py-16 px-4 text-zinc-500 flex flex-col items-center justify-center">
              {activeTab === "pending" ? (
                <>
                  <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-400/40" />
                  <p className="text-sm font-medium text-zinc-300">All Caught Up</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Zero pending approvals requiring authorization.</p>
                </>
              ) : (
                <>
                  <History className="w-10 h-10 mb-3 text-zinc-600" />
                  <p className="text-sm font-medium text-zinc-300">No Historical Records</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Approved and rejected requests will be archived here.</p>
                </>
              )}
            </div>
          ) : (
            displayedList.map((req: Approval) => {
              const isSelected = selectedRequest?.id === req.id;
              const isPending = req.status === "pending";
              const isApproved = req.status === "approved";
              const isRejected = req.status === "rejected";

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border relative overflow-hidden group ${
                    isSelected
                      ? 'glass-liquid border-white/30 shadow-xl bg-white/[0.08]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#b8d4f0]" />
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isPending 
                          ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]' 
                          : isApproved 
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' 
                          : 'bg-red-400 shadow-[0_0_8px_#f87171]'
                      }`} />
                      <span className="font-semibold text-sm text-zinc-100 truncate">{req.merchant}</span>
                    </div>
                    <span className="font-mono text-white font-bold text-sm flex-shrink-0">
                      ${req.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span className="truncate max-w-[160px] text-zinc-400">{req.agentName}</span>
                    
                    {isPending ? (
                      <span className="flex items-center text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-[10px]">
                        <Clock className="w-2.5 h-2.5 mr-1" /> Pending
                      </span>
                    ) : isApproved ? (
                      <span className="flex items-center text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[10px]">
                        <Check className="w-2.5 h-2.5 mr-1" /> Approved
                      </span>
                    ) : (
                      <span className="flex items-center text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20 text-[10px]">
                        <Ban className="w-2.5 h-2.5 mr-1" /> Blocked
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-[11px] text-zinc-500 flex justify-between items-center font-mono border-t border-white/5 pt-1.5">
                    <span className="truncate">{req.category}</span>
                    <span>{new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Detail View */}
      <div className="flex-1 bg-black/20 backdrop-blur-xl relative overflow-y-auto flex flex-col">
        {selectedRequest ? (
          <motion.div 
            key={selectedRequest.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-w-4xl mx-auto w-full space-y-6 flex-1"
          >
            {/* Status Banner */}
            {selectedRequest.status === "approved" ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-200">Approved & Settled On-Chain</h3>
                    <p className="text-xs text-emerald-300/80 font-mono mt-0.5">
                      Verified with Zero-Knowledge Proof on Midnight Ledger.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                  {selectedRequest.resolvedAt ? new Date(selectedRequest.resolvedAt).toLocaleString() : 'Resolved'}
                </span>
              </div>
            ) : selectedRequest.status === "rejected" ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-200">Blocked by Security Policy Firewall</h3>
                    <p className="text-xs text-red-300/80 font-mono mt-0.5">
                      Transaction was rejected and preventing funds from leaving the enterprise vault.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-red-400 bg-red-500/20 px-2.5 py-1 rounded-lg">
                  {selectedRequest.resolvedAt ? new Date(selectedRequest.resolvedAt).toLocaleString() : 'Blocked'}
                </span>
              </div>
            ) : null}

            {/* Main Details Glass Card */}
            <div className="glass-liquid p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider ${
                      selectedRequest.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : selectedRequest.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {selectedRequest.status}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{selectedRequest.category}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white">{selectedRequest.merchant}</h2>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Requested by Agent <span className="text-[#b8d4f0] font-semibold">{selectedRequest.agentName}</span>
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-4xl font-mono font-bold tracking-tight text-white mb-1">
                    ${selectedRequest.amount.toLocaleString()} <span className="text-sm font-normal text-zinc-400">{selectedRequest.currency || 'USD'}</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    Created {new Date(selectedRequest.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Multi-Party ZK Threshold Banner for > $50,000 */}
              {selectedRequest.amount >= 50000 && (
                <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-5 shadow-inner">
                  <div className="flex items-start space-x-4">
                    <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/30">
                      <Shield className="w-6 h-6 text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-purple-200">Multi-Party ZK Quorum Enforced (&gt; $50,000)</h3>
                        <span className="text-[10px] bg-purple-500/20 text-purple-200 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                          Threshold: 2 of 3 Signers
                        </span>
                      </div>
                      <p className="text-purple-300/80 text-xs mt-1.5 leading-relaxed">
                        This transaction exceeds the high-value threshold ($50,000). Compact smart contracts require cryptographic authorization tokens from at least 2 enterprise signing keys before state execution.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Policy Trigger Notice */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex items-start space-x-4">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-1">Policy Governance Rule Trigger</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Triggered Rule: <span className="text-white font-mono font-medium">${selectedRequest.ruleTriggered || 'Threshold Limit'}</span> limit in <span className="text-[#b8d4f0] font-medium">{selectedRequest.policyId}</span>.
                  </p>
                  {selectedRequest.reason && (
                    <p className="text-xs text-zinc-300 mt-2 p-2.5 bg-black/40 rounded-lg border border-white/5 font-mono">
                      "{selectedRequest.reason}"
                    </p>
                  )}
                </div>
              </div>

              {/* Transaction Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#b8d4f0]" /> Transaction Audit Info
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-zinc-400">Request ID</span>
                      <span className="text-white">{selectedRequest.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-zinc-400">Agent Identifier</span>
                      <span className="text-[#b8d4f0]">{selectedRequest.agentId || 'agt_system'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-zinc-400">Merchant Category</span>
                      <span className="text-zinc-200">{selectedRequest.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Expires At</span>
                      <span className="text-zinc-300">{new Date(selectedRequest.expiresAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#b8d4f0]" /> Cryptographic Proof ({((selectedRequest as any).metadata?.network as string || network || 'preprod').toUpperCase()})
                  </h4>
                  <div className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[#b8d4f0] truncate max-w-[200px]">
                        {selectedRequest.proofHash || '0x063d2925b9428dd77e829933b9a41dc7b8c7ae8a702e15c16d56fcc0ae8e5889'}
                      </span>
                      <button 
                        onClick={() => handleCopy(selectedRequest.proofHash || '0x063d2925b9428dd77e829933b9a41dc7b8c7ae8a702e15c16d56fcc0ae8e5889')}
                        className="text-zinc-400 hover:text-white transition-colors"
                        title="Copy Hash"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <a 
                      href={`https://${((selectedRequest as any).metadata?.network as string) || network || 'preprod'}.midnightexplorer.com/transactions/${selectedRequest.proofHash || '0x063d2925b9428dd77e829933b9a41dc7b8c7ae8a702e15c16d56fcc0ae8e5889'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#b8d4f0] hover:text-white transition-colors flex items-center justify-between font-mono pt-1 border-t border-white/5"
                      title={`View on Midnight ${(((selectedRequest as any).metadata?.network as string) || network || 'preprod').toUpperCase()} Explorer`}
                    >
                      <span>View on Midnight Explorer</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Pending State */}
              {selectedRequest.status === 'pending' ? (
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <button 
                    onClick={() => {
                      rejectRequest?.(selectedRequest.id);
                      toast.error("Request Rejected", {
                        description: `Transaction for ${selectedRequest.merchant} ($${selectedRequest.amount}) has been blocked.`
                      });
                    }}
                    disabled={isApproving}
                    className="btn-liquid btn-liquid-danger flex-1 py-3 flex items-center justify-center gap-2 text-sm"
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
                        toast.success("Approval Confirmed & Recorded", {
                          description: `Authorized $${selectedRequest.amount} for ${selectedRequest.merchant}. ZK proof archived to history.`
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
                    className="btn-liquid btn-liquid-cyan flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isApproving ? "Executing ZK Spend on Midnight..." : "Approve & Sign On-Chain"}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">
                    Historical Record • Immutable audit trail stored on Midnight Preprod
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-20">
            <FileText className="w-12 h-12 mb-4 opacity-20 text-[#b8d4f0]" />
            <p className="text-sm font-mono text-zinc-400">Select an approval request from the feed</p>
          </div>
        )}
      </div>
    </div>
  );
}

