"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { Plus, X, ChevronDown, ChevronRight, Edit2, Copy, Archive, Trash2, Shield, AlertTriangle, Lock, Key, Fingerprint, EyeOff, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PoliciesPage() {
  const { policies, updatePolicy, createPolicy, deletePolicy, archivePolicy } = useGhostStore();
  const { deploy, walletState } = useMidnight();
  const [filter, setFilter] = useState("Active");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [perTxLimit, setPerTxLimit] = useState(250);
  const [dailyLimit, setDailyLimit] = useState(1000);
  const [monthlyLimit, setMonthlyLimit] = useState(5000);

  const filteredPolicies = (policies || []).filter((p: any) => {
    if (filter === "All") return true;
    return p.status?.toLowerCase() === filter.toLowerCase();
  });

  const openDrawer = (policy: any = null) => {
    setEditingPolicy(policy);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setEditingPolicy(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Policy Rules</h1>
          <p className="text-zinc-400 mt-1">Define spending boundaries and risk thresholds.</p>
        </div>
        <button onClick={() => openDrawer()} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Policy</span>
        </button>
      </div>

      <div className="flex space-x-2 border-b border-zinc-800 pb-4">
        {["Active", "Paused", "Archived", "All"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-sm">
              <th className="py-4 px-6 font-medium w-10"></th>
              <th className="py-4 px-6 font-medium">Policy Name</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Per-Tx Limit</th>
              <th className="py-4 px-6 font-medium">Daily Limit</th>
              <th className="py-4 px-6 font-medium">Monthly Limit</th>
              <th className="py-4 px-6 font-medium">Agents</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredPolicies.map((policy: any) => (
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
                      <Shield className="w-4 h-4 text-zinc-400" />
                      <span className="font-medium text-zinc-200">{policy.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`badge-${policy.status.toLowerCase()}`}>{policy.status}</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-zinc-300">${policy.perTxLimit}</td>
                  <td className="py-4 px-6 font-mono text-zinc-300">${policy.dailyLimit}</td>
                  <td className="py-4 px-6 font-mono text-zinc-300">${policy.monthlyLimit}</td>
                  <td className="py-4 px-6 text-zinc-400">
                    <span className="bg-zinc-800 px-2 py-1 rounded-md text-xs">{policy.agentsCount || 0}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openDrawer(policy); }} className="text-zinc-400 hover:text-white" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => e.stopPropagation()} className="text-zinc-400 hover:text-white" title="Duplicate">
                        <Copy className="w-4 h-4" />
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
                        <div className="grid grid-cols-3 gap-8">
                          <div>
                            <h4 className="text-sm font-medium text-zinc-400 mb-3">Restrictions</h4>
                            <ul className="space-y-2 text-sm text-zinc-300">
                              <li className="flex justify-between">
                                <span className="text-zinc-500">Requires Approval:</span>
                                <span>Above ${policy.approvalThreshold || '500'}</span>
                              </li>
                              <li className="flex justify-between">
                                <span className="text-zinc-500">High-Risk Threshold:</span>
                                <span>${policy.highRiskThreshold || '1000'}</span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-zinc-400 mb-3">Allowed Categories</h4>
                            <div className="flex flex-wrap gap-2">
                              {(policy.categories || ['SaaS', 'Cloud', 'Marketing']).map((cat: string) => (
                                <span key={cat} className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-zinc-400 mb-3">Merchants</h4>
                            <div className="space-y-3">
                              <div>
                                <span className="text-xs text-emerald-500 mb-1 block">Allowlist</span>
                                <div className="text-sm text-zinc-400 bg-zinc-900 p-2 rounded truncate">
                                  {(policy.merchantAllowlist || []).join(', ') || 'None specified'}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-red-500 mb-1 block">Blocklist</span>
                                <div className="text-sm text-zinc-400 bg-zinc-900 p-2 rounded truncate">
                                  {(policy.merchantBlocklist || []).join(', ') || 'None specified'}
                                </div>
                              </div>
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
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">
                  {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
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
                      defaultValue={editingPolicy?.name}
                      onChange={(e) => setPolicyName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none" 
                      placeholder="e.g., Marketing Budget Q3" 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Limits & Thresholds</h3>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-zinc-400">Per-transaction Limit</label>
                      <span className="text-sm text-zinc-300 font-mono">${editingPolicy?.perTxLimit || 1000}</span>
                    </div>
                    <input type="range" min="10" max="10000" defaultValue={editingPolicy?.perTxLimit || 1000} onChange={(e) => setPerTxLimit(Number(e.target.value))} className="w-full accent-zinc-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Daily Limit ($)</label>
                      <input type="number" defaultValue={editingPolicy?.dailyLimit || 5000} onChange={(e) => setDailyLimit(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Monthly Limit ($)</label>
                      <input type="number" defaultValue={editingPolicy?.monthlyLimit || 25000} onChange={(e) => setMonthlyLimit(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-zinc-400">Requires Approval Above</label>
                      <span className="text-sm text-zinc-300 font-mono">${editingPolicy?.approvalThreshold || 500}</span>
                    </div>
                    <input type="range" min="10" max="10000" defaultValue={editingPolicy?.approvalThreshold || 500} className="w-full accent-zinc-500" />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Restrictions</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Allowed Categories</label>
                    <select multiple className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-white focus:border-zinc-600 focus:outline-none h-24">
                      <option value="saas">SaaS Subscriptions</option>
                      <option value="cloud">Cloud Infrastructure</option>
                      <option value="marketing">Marketing & Ads</option>
                      <option value="travel">Travel</option>
                      <option value="office">Office Supplies</option>
                    </select>
                    <p className="text-xs text-zinc-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
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
                          <h4 className="text-sm font-medium text-zinc-200">Private Allowlist Access</h4>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Configure merchant blocklist/allowlist. Proven in ZK without revealing exact merchants on-chain.</p>
                      </div>
                      <div className="badge-active bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs border border-zinc-700">ZK Enabled</div>
                    </div>
                    <div>
                      <input type="text" defaultValue={(editingPolicy?.merchantAllowlist || []).join(', ')} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none placeholder:text-zinc-600" placeholder="e.g. AWS, GitHub, Linear (Comma separated)" />
                    </div>
                  </div>

                  {/* Eligibility Gate */}
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Fingerprint className="w-4 h-4 text-zinc-400" />
                          <h4 className="text-sm font-medium text-zinc-200">Eligibility Gate</h4>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Set minimum agent reputation or threshold scores. Evaluated in ZK without exposing underlying metrics.</p>
                      </div>
                      <div className="badge-active bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs border border-zinc-700">ZK Enabled</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-xs text-zinc-500 mb-1">Min Reputation Score</label>
                        <input type="number" defaultValue="85" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-zinc-600 focus:outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-zinc-500 mb-1">Max Risk Threshold</label>
                        <select className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-zinc-600 focus:outline-none">
                          <option>Low Risk</option>
                          <option>Medium Risk</option>
                          <option>High Risk</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Confidential Credentials */}
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4 text-zinc-400" />
                          <h4 className="text-sm font-medium text-zinc-200">Confidential Credentials</h4>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Attach API keys or secrets. Proven valid in ZK without exposing the raw credentials on-chain.</p>
                      </div>
                      <div className="badge-active bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs border border-zinc-700">ZK Enabled</div>
                    </div>
                    <div className="flex space-x-2">
                      <input type="password" placeholder="sk_test_..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-zinc-600 focus:outline-none placeholder:text-zinc-600" />
                      <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded text-sm transition-colors border border-zinc-700">Attach Secret</button>
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
                      <input type="checkbox" className="sr-only peer" defaultChecked={editingPolicy?.emergencyRevoke !== false} />
                      <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center">
                <button 
                  onClick={async () => {
                    if (!walletState.isConnected) {
                      toast.error("Wallet Not Connected", {
                        description: "Please connect your Lace wallet first to deploy on-chain!"
                      });
                      return;
                    }
                    try {
                      setIsDeploying(true);
                      await deploy(BigInt(perTxLimit || 1000));
                      if (!editingPolicy) {
                        createPolicy({
                          name: policyName || "Midnight On-Chain Policy",
                          status: "active",
                          perTransactionLimit: perTxLimit,
                          dailyLimit,
                          monthlyLimit,
                          categoryRestrictions: ["saas"],
                          merchantAllowlist: ["AWS", "GitHub"],
                          merchantBlocklist: ["CryptoBay"],
                          highRiskThreshold: 200,
                          requiresApprovalAbove: 150,
                          emergencyRevoke: true,
                        });
                      }
                      toast.success("Contract Deployed", {
                        description: "Smart contract successfully deployed to the Midnight testnet."
                      });
                      closeDrawer();
                    } catch (e: any) {
                      toast.error("Deployment Error", {
                        description: e.message || String(e)
                      });
                    } finally {
                      setIsDeploying(false);
                    }
                  }} 
                  disabled={isDeploying}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isDeploying ? "Deploying on Midnight..." : "Deploy Contract On-Chain"}</span>
                </button>
                <div className="flex space-x-3">
                  <button onClick={closeDrawer} className="btn-secondary">Cancel</button>
                  <button 
                    onClick={() => {
                      if (editingPolicy) {
                        updatePolicy(editingPolicy.id, { name: policyName || editingPolicy.name, perTransactionLimit: perTxLimit, dailyLimit, monthlyLimit });
                      } else {
                        createPolicy({
                          name: policyName || "Custom Policy",
                          status: "active",
                          perTransactionLimit: perTxLimit,
                          dailyLimit,
                          monthlyLimit,
                          categoryRestrictions: ["saas"],
                          merchantAllowlist: ["AWS", "GitHub"],
                          merchantBlocklist: ["CryptoBay"],
                          highRiskThreshold: 200,
                          requiresApprovalAbove: 150,
                          emergencyRevoke: true,
                        });
                      }
                      closeDrawer();
                    }} 
                    className="btn-primary"
                  >
                    Save Policy
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
