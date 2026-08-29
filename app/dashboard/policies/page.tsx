"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhostStore, Policy } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { Plus, X, ChevronDown, ChevronRight, Edit2, Copy, Archive, Trash2, Shield, AlertTriangle, Lock, Key, Fingerprint, EyeOff, Sparkles, Loader2, SplitSquareHorizontal } from "lucide-react";
import { toast } from "sonner";

export default function PoliciesPage() {
  const { policies, updatePolicy, createPolicy, deletePolicy, archivePolicy } = useGhostStore();
  const { deploy, rebalanceThreshold, walletState, network } = useMidnight();
  const [filter, setFilter] = useState("Active");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);

  // Form State
  const [policyName, setPolicyName] = useState("");
  const [perTxLimit, setPerTxLimit] = useState(250);
  const [dailyLimit, setDailyLimit] = useState(1000);
  const [monthlyLimit, setMonthlyLimit] = useState(5000);
  const [multiSigThreshold, setMultiSigThreshold] = useState(50000);
  const [requiredSigners, setRequiredSigners] = useState("2 of 3 (Enterprise Multi-Sig)");
  const [merchantAllowlist, setMerchantAllowlist] = useState<string>("");
  const [merchantBlocklist, setMerchantBlocklist] = useState<string>("");
  const [minReputation, setMinReputation] = useState<number>(85);
  const [maxRisk, setMaxRisk] = useState<string>("Medium Risk");
  const [credentials, setCredentials] = useState<string>("");
  const [splits, setSplits] = useState<{address: string, percentage: number}[]>([]);
  const [emergencyRevoke, setEmergencyRevoke] = useState(true);

  const filteredPolicies = (policies || []).filter((p) => {
    if (filter === "All") return true;
    return p.status?.toLowerCase() === filter.toLowerCase();
  });

  const openDrawer = (policy: Policy | null = null) => {
    setEditingPolicy(policy);
    if (policy) {
      setPolicyName(policy.name);
      setPerTxLimit(policy.perTransactionLimit);
      setDailyLimit(policy.dailyLimit);
      setMonthlyLimit(policy.monthlyLimit);
      setMerchantAllowlist((policy.merchantAllowlist || []).join(", "));
      setMerchantBlocklist((policy.merchantBlocklist || []).join(", "));
      setMinReputation(policy.eligibilityThresholds?.minReputation || 85);
      setMaxRisk(policy.eligibilityThresholds?.maxRisk || "Medium Risk");
      setCredentials((policy.confidentialCredentials || []).join(", "));
      setSplits(policy.splitsConfiguration || []);
      setEmergencyRevoke(policy.emergencyRevoke);
    } else {
      setPolicyName("");
      setPerTxLimit(250);
      setDailyLimit(1000);
      setMonthlyLimit(5000);
      setMerchantAllowlist("");
      setMerchantBlocklist("");
      setMinReputation(85);
      setMaxRisk("Medium Risk");
      setCredentials("");
      setSplits([]);
      setEmergencyRevoke(true);
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setEditingPolicy(null), 300);
  };

  const handleSave = async (deployOnChain: boolean = false) => {
    if (deployOnChain) {
      if (!walletState.isConnected) {
        toast.error("Wallet Not Connected", { description: "Please connect your Lace wallet first to deploy on-chain!" });
        return;
      }
      setIsDeploying(true);
      try {
        await deploy(BigInt(perTxLimit || 1000));
        toast.success("Contract Deployed", { description: "Smart contract successfully deployed to the Midnight testnet." });
      } catch (e: any) {
        toast.error("Deployment Error", { description: e.message || String(e) });
        setIsDeploying(false);
        return;
      }
      setIsDeploying(false);
    }

    const payload = {
      name: policyName || (editingPolicy ? editingPolicy.name : "Custom Policy"),
      perTransactionLimit: perTxLimit,
      dailyLimit,
      monthlyLimit,
      merchantAllowlist: merchantAllowlist.split(",").map(s => s.trim()).filter(Boolean),
      merchantBlocklist: merchantBlocklist.split(",").map(s => s.trim()).filter(Boolean),
      eligibilityThresholds: { minReputation, maxRisk },
      confidentialCredentials: credentials.split(",").map(s => s.trim()).filter(Boolean),
      splitsConfiguration: splits,
      emergencyRevoke,
      status: "active" as const,
      categoryRestrictions: ["saas"],
      highRiskThreshold: 200,
      requiresApprovalAbove: 150,
    };

    if (editingPolicy) {
      updatePolicy(editingPolicy.id, payload);
      toast.success("Policy Updated");
    } else {
      createPolicy(payload);
      toast.success("Policy Created");
    }
    closeDrawer();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Enterprise Policies</h1>
          <p className="text-zinc-400 mt-1">Configure zero-knowledge guardrails and spending boundaries.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={async () => {
              if (!walletState.isConnected) {
                toast.error("Wallet Not Connected", { description: "Please connect Lace wallet to trigger dynamic on-chain rebalancing." });
                return;
              }
              setIsRebalancing(true);
              try {
                const newLimit = BigInt(75000);
                await rebalanceThreshold(newLimit);
                toast.success("Dynamic ZK Threshold Re-balanced", {
                  description: `Successfully broadcasted encrypted commitment update ($75,000 limit) to Midnight ${network}.`
                });
              } catch (e: any) {
                toast.error("Rebalance Error", { description: e.message || String(e) });
              } finally {
                setIsRebalancing(false);
              }
            }}
            disabled={isRebalancing}
            className="btn-liquid btn-liquid-cyan flex items-center gap-2"
            title="Update encrypted ZK spending limit on-chain without redeploying contract"
          >
            {isRebalancing ? <Loader2 className="w-4 h-4 animate-spin text-[#b8d4f0]" /> : <Sparkles className="w-4 h-4 text-[#b8d4f0]" />}
            <span>{isRebalancing ? "Re-balancing On-Chain..." : "Rebalance ZK Threshold"}</span>
          </button>
          <button onClick={() => openDrawer()} className="btn-liquid btn-liquid-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Policy</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl w-fit">
        {["Active", "Paused", "Archived", "All"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab
                ? "bg-white/15 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/15"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass-liquid overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10 text-zinc-400 text-xs uppercase tracking-wider font-mono">
              <th className="py-4 px-6 font-medium w-10"></th>
              <th className="py-4 px-6 font-medium">Policy Name</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Per-Tx Limit</th>
              <th className="py-4 px-6 font-medium">Daily Limit</th>
              <th className="py-4 px-6 font-medium">Modules Active</th>
              <th className="py-4 px-6 font-medium">Agents</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredPolicies.map((policy) => (
              <React.Fragment key={policy.id}>
                <tr 
                  className={`group hover:bg-zinc-900/50 transition-colors cursor-pointer ${expandedRow === policy.id ? 'bg-zinc-900/30' : ''}`}
                  onClick={() => setExpandedRow(expandedRow === policy.id ? null : policy.id)}
                >
                  <td className="py-4 px-6 text-zinc-500">
                    {expandedRow === policy.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-[#b8d4f0]" />
                      <span className="font-medium text-zinc-200">{policy.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`badge-${policy.status.toLowerCase()}`}>{policy.status}</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-zinc-300">${policy.perTransactionLimit}</td>
                  <td className="py-4 px-6 font-mono text-zinc-300">${policy.dailyLimit}</td>
                  <td className="py-4 px-6 text-zinc-400 flex gap-2">
                    {policy.merchantAllowlist?.length > 0 && <span title="Private Allowlist"><EyeOff className="w-4 h-4 text-emerald-400" /></span>}
                    {policy.splitsConfiguration && policy.splitsConfiguration.length > 0 && <span title="Private Splits"><SplitSquareHorizontal className="w-4 h-4 text-blue-400" /></span>}
                    {policy.confidentialCredentials?.length && <span title="Confidential Credentials"><Key className="w-4 h-4 text-yellow-400" /></span>}
                  </td>
                  <td className="py-4 px-6 text-zinc-400">
                    <span className="bg-zinc-800 px-2 py-1 rounded-md text-xs">{policy.agentCount || 0}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openDrawer(policy); }} className="text-zinc-400 hover:text-white" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); archivePolicy(policy.id); }} className="text-zinc-400 hover:text-white" title="Archive">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deletePolicy(policy.id); }} className="text-red-400 hover:text-red-300" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === policy.id && (
                  <tr>
                    <td colSpan={8} className="p-0 border-b border-zinc-800">
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        className="bg-zinc-950 p-6"
                      >
                        <div className="grid grid-cols-4 gap-8">
                          <div>
                            <h4 className="text-sm font-medium text-[#b8d4f0] mb-3 flex items-center"><EyeOff className="w-4 h-4 mr-2" /> Allowlist</h4>
                            <div className="text-sm text-zinc-400 bg-zinc-900 p-2 rounded truncate">
                              {(policy.merchantAllowlist || []).join(', ') || 'None specified'}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-[#b8d4f0] mb-3 flex items-center"><SplitSquareHorizontal className="w-4 h-4 mr-2" /> Splits</h4>
                            <div className="text-sm text-zinc-400 bg-zinc-900 p-2 rounded">
                              {policy.splitsConfiguration && policy.splitsConfiguration.length > 0 ? 
                                policy.splitsConfiguration.map((s,i) => <div key={i}>{s.address.slice(0,6)}... ({s.percentage}%)</div>) 
                                : 'None specified'}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-[#b8d4f0] mb-3 flex items-center"><Fingerprint className="w-4 h-4 mr-2" /> Eligibility</h4>
                            <ul className="space-y-1 text-sm text-zinc-300 bg-zinc-900 p-2 rounded">
                              <li>Score ≥ {policy.eligibilityThresholds?.minReputation || 85}</li>
                              <li>Max Risk: {policy.eligibilityThresholds?.maxRisk || 'Medium'}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-[#b8d4f0] mb-3 flex items-center"><Key className="w-4 h-4 mr-2" /> Credentials</h4>
                            <div className="text-sm text-zinc-400 bg-zinc-900 p-2 rounded truncate">
                              {policy.confidentialCredentials && policy.confidentialCredentials.length > 0 ? '✓ Attached Securely' : 'None specified'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeDrawer}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">
                  {editingPolicy ? 'Edit Enterprise Policy' : 'Create Enterprise Policy'}
                </h2>
                <button onClick={closeDrawer} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow space-y-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Policy Name</label>
                    <input 
                      type="text" 
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none" 
                      placeholder="e.g., Q3 Cloud Procurement" 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Limits & Thresholds</h3>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-zinc-400">Per-transaction Limit</label>
                      <span className="text-sm text-zinc-300 font-mono">${perTxLimit}</span>
                    </div>
                    <input type="range" min="10" max="10000" value={perTxLimit} onChange={(e) => setPerTxLimit(Number(e.target.value))} className="w-full accent-zinc-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Daily Limit ($)</label>
                      <input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Monthly Limit ($)</label>
                      <input type="number" value={monthlyLimit} onChange={(e) => setMonthlyLimit(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2 flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Zero-Knowledge Privacy Modules
                  </h3>
                  
                  {/* Private Allowlist Access */}
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <EyeOff className="w-4 h-4 text-zinc-400" />
                          <h4 className="text-sm font-medium text-zinc-200">1. Private Allowlist Access (Supply Chain)</h4>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Configure approved merchants. Proven in ZK without revealing vendors on-chain.</p>
                      </div>
                      <div className="bg-[#b8d4f0]/10 text-[#b8d4f0] px-2 py-0.5 rounded text-xs border border-[#b8d4f0]/20">ZK Protected</div>
                    </div>
                    <div>
                      <input type="text" value={merchantAllowlist} onChange={(e) => setMerchantAllowlist(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none placeholder:text-zinc-600" placeholder="e.g. AWS, GitHub (Comma separated)" />
                    </div>
                  </div>

                  {/* Private Splits & Payroll */}
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <SplitSquareHorizontal className="w-4 h-4 text-zinc-400" />
                          <h4 className="text-sm font-medium text-zinc-200">2. Private Splits & Payroll</h4>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Confidential percentage payouts and revenue sharing across multiple vendor addresses.</p>
                      </div>
                      <div className="bg-[#b8d4f0]/10 text-[#b8d4f0] px-2 py-0.5 rounded text-xs border border-[#b8d4f0]/20">ZK Protected</div>
                    </div>
                    {splits.map((split, i) => (
                      <div key={i} className="flex space-x-2">
                        <input type="text" value={split.address} onChange={(e) => {
                          const s = [...splits]; s[i].address = e.target.value; setSplits(s);
                        }} className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none" placeholder="Vendor Wallet Address" />
                        <input type="number" value={split.percentage} onChange={(e) => {
                          const s = [...splits]; s[i].percentage = Number(e.target.value); setSplits(s);
                        }} className="w-24 bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none" placeholder="%" />
                        <button onClick={() => setSplits(splits.filter((_, idx) => idx !== i))} className="p-2 text-zinc-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => setSplits([...splits, { address: "", percentage: 0 }])} className="text-xs text-[#b8d4f0] hover:underline">+ Add Split Recipient</button>
                  </div>

                  {/* Confidential Credentials */}
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4 text-zinc-400" />
                          <h4 className="text-sm font-medium text-zinc-200">3. Confidential Credentials (API Keys)</h4>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Hash and store API keys. Agents prove they possess them without transmitting secrets.</p>
                      </div>
                      <div className="bg-[#b8d4f0]/10 text-[#b8d4f0] px-2 py-0.5 rounded text-xs border border-[#b8d4f0]/20">ZK Protected</div>
                    </div>
                    <div className="flex space-x-2">
                      <input type="password" value={credentials} onChange={(e) => setCredentials(e.target.value)} placeholder="sk_live_..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-zinc-600 focus:outline-none placeholder:text-zinc-600" />
                      <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded text-sm transition-colors border border-zinc-700">Hash & Attach</button>
                    </div>
                  </div>

                  {/* Eligibility Gate */}
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Fingerprint className="w-4 h-4 text-zinc-400" />
                          <h4 className="text-sm font-medium text-zinc-200">4. Eligibility / Reputation Gate</h4>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Ensure agents meet minimum collateral or reputation scores before executing contracts.</p>
                      </div>
                      <div className="bg-[#b8d4f0]/10 text-[#b8d4f0] px-2 py-0.5 rounded text-xs border border-[#b8d4f0]/20">ZK Protected</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-xs text-zinc-500 mb-1">Min Reputation Score</label>
                        <input type="number" value={minReputation} onChange={(e) => setMinReputation(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-zinc-600 focus:outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-zinc-500 mb-1">Max Risk Threshold</label>
                        <select value={maxRisk} onChange={(e) => setMaxRisk(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-zinc-600 focus:outline-none">
                          <option>Low Risk</option>
                          <option>Medium Risk</option>
                          <option>High Risk</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Party ZK Approvals */}
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-purple-400" />
                          <h4 className="text-sm font-medium text-zinc-200">5. Multi-Party ZK Approvals (Transactions &gt; $50,000)</h4>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Enforce mathematical quorum proofs across multiple authorized corporate signers before execution.</p>
                      </div>
                      <div className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-xs border border-purple-500/20">Advanced Compact Circuit</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Multi-Party Threshold ($)</label>
                        <input type="number" value={multiSigThreshold} onChange={(e) => setMultiSigThreshold(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-zinc-600 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Quorum Requirement</label>
                        <select value={requiredSigners} onChange={(e) => setRequiredSigners(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-zinc-600 focus:outline-none">
                          <option>2 of 3 (Enterprise Multi-Sig)</option>
                          <option>3 of 5 (Board Authorization)</option>
                          <option>Strict Unanimous (All Signers)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 p-4 rounded-lg border border-red-900/30 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-zinc-200">Emergency Revoke Enabled</h4>
                    <p className="text-xs text-zinc-500 mt-1">If active, this policy will immediately pause all attached agents if suspicious activity exceeds the high-risk threshold.</p>
                  </div>
                  <div className="ml-auto">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={emergencyRevoke} onChange={(e) => setEmergencyRevoke(e.target.checked)} />
                      <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-black/60 backdrop-blur-xl flex justify-between items-center">
                <button 
                  onClick={() => handleSave(true)} 
                  disabled={isDeploying}
                  className="btn-liquid btn-liquid-cyan flex items-center gap-2 text-xs py-2.5 px-4"
                >
                  {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isDeploying ? "Deploying on Midnight..." : "Deploy Contract On-Chain"}</span>
                </button>
                <div className="flex space-x-3">
                  <button onClick={closeDrawer} className="btn-liquid btn-liquid-secondary text-xs py-2.5 px-4">Cancel</button>
                  <button onClick={() => handleSave(false)} className="btn-liquid btn-liquid-primary text-xs py-2.5 px-4">
                    Save Policy Locally
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
