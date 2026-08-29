"use client";

import { useState } from "react";
import { useGhostStore } from "@/store/useGhostStore";
import { AlertCircle, FileText, Send, CheckCircle2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function DisputesPage() {
  const { agents } = useGhostStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Seeded historical data
  const historicalDisputes = [
    {
      id: "DSP-8821",
      type: "Policy Override Request",
      status: "Resolved",
      date: "Oct 12, 2023",
      agent: "ProcureBot-Alpha"
    },
    {
      id: "DSP-7104",
      type: "Unrecognized Merchant Category",
      status: "Resolved",
      date: "Sep 28, 2023",
      agent: "TravelAgent-X"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Disputes & Incidents</h1>
        <p className="text-zinc-400">Report suspicious activity or review past resolutions.</p>
      </div>

      {/* Empty State for Active */}
      <div className="glass-liquid p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <ShieldAlert className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No active disputes</h3>
        <p className="text-zinc-400 text-sm max-w-md">All transactions are within policy boundaries and resolved cleanly. Systems are operating normally.</p>
      </div>

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
              <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-white/30 focus:outline-none text-sm cursor-pointer">
                <option value="">Select Agent...</option>
                {agents?.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Description</label>
              <textarea 
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-white/30 focus:outline-none text-sm resize-none" 
                rows={4} 
                placeholder="Describe the unexpected behavior..."
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1.5">Attach Proof Hash (Optional)</label>
              <input 
                type="text" 
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
                  <span>Report Submitted</span>
                </>
              ) : isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="glass-liquid p-6 space-y-5">
          <h3 className="text-base font-medium text-white flex items-center">
            <FileText className="w-4 h-4 mr-2 text-[#b8d4f0]" />
            Resolution History
          </h3>
          <div className="space-y-3">
            {historicalDisputes.map((dispute) => (
              <div key={dispute.id} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono text-zinc-400">{dispute.id}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    {dispute.status}
                  </span>
                </div>
                <h4 className="text-zinc-100 font-medium text-sm">{dispute.type}</h4>
                <div className="flex justify-between text-xs text-zinc-400 font-mono pt-1">
                  <span>{dispute.agent}</span>
                  <span>{dispute.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
