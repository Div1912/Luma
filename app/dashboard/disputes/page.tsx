"use client";

import { useState } from "react";
import { useGhostStore } from "@/store/useGhostStore";
import { AlertCircle, FileText, Send, CheckCircle2, ShieldAlert, Clock } from "lucide-react";
import { toast } from "sonner";

export default function DisputesPage() {
  const { agents, auditEvents, addAuditEvent, user } = useGhostStore();
  const [agentId, setAgentId] = useState("");
  const [description, setDescription] = useState("");
  const [proofHash, setProofHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Real disputes retrieved from audit log
  const realDisputes = auditEvents.filter((e) => e.type === "dispute_filed" || (e.metadata && e.metadata.isDispute));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please provide a description of the incident.");
      return;
    }
    setIsSubmitting(true);

    const selectedAgent = agents.find((a) => a.id === agentId);

    try {
      addAuditEvent({
        type: "dispute_filed" as any,
        agentId: selectedAgent?.id,
        agentName: selectedAgent?.name || "Unassigned Agent",
        description: `Dispute Incident: ${description.trim()}`,
        proofHash: proofHash.trim() || undefined,
        status: "pending",
        metadata: {
          isDispute: true,
          agentName: selectedAgent?.name || "Unassigned Agent",
          reportedBy: user?.name || user?.email || "Administrator",
          wallet_address: user?.walletAddress,
          timestamp: new Date().toISOString(),
        }
      });

      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Incident Report Filed", {
        description: "Cryptographic dispute registered on-chain audit log."
      });
      setAgentId("");
      setDescription("");
      setProofHash("");
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error("Failed to submit dispute", {
        description: err.message || "Could not write to audit log."
      });
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Disputes & Incidents</h1>
        <p className="text-zinc-400">Report suspicious agent activity or review active dispute investigations.</p>
      </div>

      {/* Active Disputes Status Banner */}
      {realDisputes.length === 0 ? (
        <div className="glass-liquid p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No active disputes</h3>
          <p className="text-zinc-400 text-sm max-w-md">All transactions are within policy boundaries and verified cleanly. Systems are operating normally.</p>
        </div>
      ) : (
        <div className="glass-liquid p-6 flex items-center justify-between border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{realDisputes.length} Active Dispute{realDisputes.length > 1 ? "s" : ""} Under Audit</h3>
              <p className="text-xs text-zinc-400">Incident reports are permanently committed to the cryptographic ledger.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Report Form */}
        <div className="glass-liquid p-6 space-y-5">
          <h3 className="text-base font-medium text-white flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-[#b8d4f0]" />
            Report Suspicious Activity
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Involved Agent</label>
              <select 
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-white/30 focus:outline-none text-sm cursor-pointer"
              >
                <option value="">Select Agent (Optional)...</option>
                {agents?.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Description</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-white/30 focus:outline-none text-sm resize-none" 
                rows={4} 
                placeholder="Describe the unexpected behavior or policy breach..."
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Attach Proof / Tx Hash (Optional)</label>
              <input 
                type="text" 
                value={proofHash}
                onChange={(e) => setProofHash(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-white/30 focus:outline-none font-mono text-xs" 
                placeholder="0x..." 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || submitted}
              className={`btn-liquid w-full py-3 flex justify-center items-center gap-2 ${
                submitted 
                  ? 'btn-liquid-cyan' 
                  : 'btn-liquid-primary'
              }`}
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Report Committed</span>
                </>
              ) : isSubmitting ? (
                <span>Registering on Ledger...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Incident Report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="glass-liquid p-6 space-y-5">
          <h3 className="text-base font-medium text-white flex items-center">
            <FileText className="w-4 h-4 mr-2 text-[#b8d4f0]" />
            Incident Audit History
          </h3>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {realDisputes.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-zinc-500 font-mono text-xs">
                No incidents reported yet.
              </div>
            ) : (
              realDisputes.map((dispute) => (
                <div key={dispute.id} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono text-[#b8d4f0]">{dispute.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {dispute.status}
                    </span>
                  </div>
                  <h4 className="text-zinc-100 font-medium text-sm">{dispute.description}</h4>
                  <div className="flex justify-between text-xs text-zinc-400 font-mono pt-1">
                    <span>{dispute.agentName || "General Fleet"}</span>
                    <span>{new Date(dispute.timestamp).toLocaleDateString()}</span>
                  </div>
                  {dispute.proofHash && (
                    <div className="text-[11px] font-mono text-zinc-500 truncate pt-1">
                      Ref: {dispute.proofHash}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

