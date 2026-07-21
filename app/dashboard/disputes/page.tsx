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
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Disputes & Incidents</h1>
        <p className="text-zinc-400">Report suspicious activity or review past resolutions.</p>
      </div>

      {/* Empty State for Active */}
      <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed border-zinc-700">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No active disputes</h3>
        <p className="text-zinc-400 max-w-md">All transactions are within policy boundaries and resolved cleanly. Systems are operating normally.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Report Form */}
        <div>
          <h3 className="text-lg font-medium text-white mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-zinc-400" />
            Report Suspicious Activity
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Involved Agent</label>
              <select className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none">
                <option value="">Select Agent...</option>
                {agents?.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
              <textarea 
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none" 
                rows={4} 
                placeholder="Describe the unexpected behavior..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Attach Proof Hash (Optional)</label>
              <input 
                type="text" 
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none font-mono text-sm" 
                placeholder="0x..." 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || submitted}
              className={`w-full py-3 rounded-lg font-medium flex justify-center items-center space-x-2 transition-all ${
                submitted 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-zinc-100 text-black hover:bg-white'
              }`}
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
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
        <div>
          <h3 className="text-lg font-medium text-white mb-6 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-zinc-400" />
            Resolution History
          </h3>
          <div className="space-y-4">
            {historicalDisputes.map((dispute) => (
              <div key={dispute.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-mono text-zinc-500">{dispute.id}</span>
                  <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">
                    {dispute.status}
                  </span>
                </div>
                <h4 className="text-zinc-200 font-medium mb-1">{dispute.type}</h4>
                <div className="flex justify-between text-sm text-zinc-500">
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
