"use client";

import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  Bot, 
  CheckCircle, 
  XOctagon, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  Clock,
  Server
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { useState, useEffect } from "react";

// Mock chart data based on monochrome specs
const chartData = Array.from({ length: 14 }).map((_, i) => ({
  day: i + 1,
  spend: Math.floor(Math.random() * 500) + 100,
}));

export default function DashboardOverview() {
  const { policies, agents, approvals, auditEvents, approveAction, rejectAction } = useGhostStore();
  
  const { walletState, connect, spend, publicState, ghost, connectLace, deploy, disconnectLace } = useMidnight();
  const [spendAmount, setSpendAmount] = useState<string>("50");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem('ghost_contract_address');
    if (saved) setContractAddress(saved);
  }, []);

  useEffect(() => {
    if (walletState.isConnected && contractAddress && !ghost) {
      connect(contractAddress).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletState.isConnected, contractAddress]);

  const handleDeploy = async () => {
    try {
      setIsSubmitting(true);
      // Deploy with a limit of 1,000,000
      await deploy(BigInt(1000000));
      // After deploy, walletState.address has the deployed address
      setSuccessMessage("Contract Deployed Successfully! Waiting for indexer sync...");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync the deployed address to local storage
  useEffect(() => {
    if (ghost && walletState.address && walletState.address !== contractAddress) {
      // MidnightProvider sets walletState.address to the contract address upon connect/deploy
      // wait, we only want to save if it looks like a contract address (length > 50)
      if (walletState.address.length > 50) {
        setContractAddress(walletState.address);
        localStorage.setItem('ghost_contract_address', walletState.address);
      }
    }
  }, [ghost, walletState.address]);

  const handleSpend = async () => {
    if (!spendAmount) return;
    try {
      setIsSubmitting(true);
      await spend(BigInt(spendAmount));
      
      // Push real event to dashboard
      useGhostStore.getState().addAuditEvent({
        type: "purchase_approved",
        agentId: "agt_01",
        agentName: "Wallet User",
        merchant: "Midnight Preprod",
        amount: Number(spendAmount),
        currency: "USDC",
        status: "success",
        description: "Private spend transaction executed on-chain",
        metadata: { txType: "spend", contract: contractAddress },
      });
      
      setSuccessMessage("ZK Proof Verified & Mined Successfully! 🛡️");
      setTimeout(() => setSuccessMessage(""), 5000);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setSpendAmount("");
    }
  };

  const activePolicies = policies.filter(p => p.status === "active").length;
  const activeAgents = agents.filter(a => a.status === "active").length;
  const pendingApprovals = approvals.filter(a => a.status === "pending");
  const recentEvents = auditEvents.slice(0, 7);

  // Stagger variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Spent (Public)", 
            value: publicState && publicState.total_spent !== undefined ? publicState.total_spent.toString() : "0", 
            change: "Real-time", 
            up: true,
            icon: ShieldAlert 
          },
          { 
            label: "Spending Limit", 
            value: publicState && publicState.spending_limit !== undefined ? publicState.spending_limit.toString() : "0", 
            change: "Enforced", 
            up: true,
            icon: Bot 
          },
          { 
            label: "Pending Approvals", 
            value: pendingApprovals.length, 
            change: "-2%", 
            up: false,
            icon: CheckCircle 
          },
          { 
            label: "Blocked Today", 
            value: "24", 
            change: "+18%", 
            up: true,
            icon: XOctagon 
          }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-white/70" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.up ? 'text-white/70' : 'text-white/50'}`}>
                {stat.change}
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <div className="text-3xl font-medium tracking-tight mb-1">{stat.value}</div>
            <div className="text-sm text-white/50">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Middle Row: Chart & Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-medium">Daily Spend Execution</h3>
              <p className="text-sm text-white/40">USDC volume over last 14 days</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(20,20,20,0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="spend" fill="rgba(255,255,255,0.8)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Agent Transaction */}
        <motion.div variants={itemVariants} className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-medium">Submit Agent Transaction</h3>
            {contractAddress && (
              <button 
                onClick={() => {
                  localStorage.removeItem('ghost_contract_address');
                  window.location.reload();
                }}
                className="text-xs text-red-400 hover:text-red-300 bg-red-400/10 px-2 py-1 rounded"
              >
                Reset Contract
              </button>
            )}
            {walletState.isConnected && (
              <button 
                onClick={() => disconnectLace()}
                className="text-xs text-white/50 hover:text-white px-2 py-1 rounded"
              >
                Disconnect Wallet
              </button>
            )}
          </div>
          
          {contractAddress && (
            <div className="mb-4 p-2 bg-white/5 rounded border border-white/10 flex flex-col gap-1">
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Verifiable Contract Address (Preview)</span>
              <span className="text-xs text-white font-mono break-all">{contractAddress}</span>
            </div>
          )}

          <div className="mb-4 p-2 bg-black/50 text-[10px] text-green-400 font-mono rounded overflow-auto max-h-32">
            State Debug: {publicState === undefined ? 'undefined' : JSON.stringify(publicState, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2)}
          </div>
          <div className="flex-1 space-y-4">
            <p className="text-xs text-white/50 mb-4">
              <span className="text-white/80 font-medium">Observable Privacy Behavior:</span> Amount is processed as a private ZK witness and never revealed, only the total spent updates publicly.
            </p>
            <div>
              <label className="text-xs font-medium text-white/70 mb-1 block">Spend Amount</label>
              <input
                type="number"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                placeholder="Enter amount"
              />
            </div>
            <button 
              onClick={
                !walletState.isConnected ? () => connectLace().catch(console.error) 
                : !contractAddress ? handleDeploy
                : (walletState.error && !ghost) ? () => connect(contractAddress).catch(console.error)
                : handleSpend
              }
              disabled={isSubmitting || (walletState.isConnected && !ghost && !walletState.error && !!contractAddress)}
              className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> Processing ZK Proof...</>
              ) : !walletState.isConnected ? (
                <><Bot className="w-4 h-4" /> Reconnect Lace Wallet</>
              ) : !contractAddress ? (
                <><Check className="w-4 h-4" /> Deploy New Contract</>
              ) : (walletState.error && !ghost) ? (
                <><Check className="w-4 h-4" /> Retry Connection</>
              ) : !ghost ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> Initializing Contract...</>
              ) : (
                <><Check className="w-4 h-4" /> Execute Private Spend</>
              )}
            </button>
            {walletState.error && (
              <p className="text-[10px] text-red-400/80 text-center mt-2 overflow-hidden text-ellipsis whitespace-nowrap">{walletState.error}</p>
            )}
            {successMessage && (
              <p className="text-[12px] text-green-400 font-medium text-center mt-2 animate-pulse">{successMessage}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-6">
          <h3 className="text-base font-medium mb-6">Recent Network Activity</h3>
          <div className="space-y-6">
            {recentEvents.map((event, i) => (
              <div key={event.id} className="flex gap-4 relative">
                {i !== recentEvents.length - 1 && (
                  <div className="absolute left-2.5 top-8 bottom-0 w-px bg-white/5"></div>
                )}
                <div className="relative z-10 w-5 h-5 rounded-full bg-black border-2 border-white/10 flex items-center justify-center mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${event.status === 'success' ? 'bg-white/70' : 'bg-red-400/70'}`}></div>
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">{event.action}</span>
                    <span className="text-xs text-white/40">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm text-white/50 mb-2">{event.details}</div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
                    <span>AGENT: {event.actor}</span>
                    {event.hash && (
                      <span className="flex items-center gap-1">
                        TX: <span className="text-[#b8d4f0]/70">{event.hash.slice(0, 8)}...</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div variants={itemVariants} className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-6">
          <h3 className="text-base font-medium mb-6">Trust Status</h3>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-full bg-[#b8d4f0]/10 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-[#b8d4f0]/30 animate-[spin_4s_linear_infinite]"></div>
                <ShieldAlert className="w-5 h-5 text-[#b8d4f0]" />
              </div>
              <div>
                <div className="text-sm font-medium text-white/90">Proof Chain Active</div>
                <div className="text-xs text-[#b8d4f0]/70 mt-0.5">Zero-knowledge verifier running</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Server className="w-4 h-4 text-white/40" /> Consensus Nodes
                </div>
                <span className="text-sm font-mono text-white">42 / 42</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-full h-full bg-white/70 rounded-full"></div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Activity className="w-4 h-4 text-white/40" /> Network Load
                </div>
                <span className="text-sm font-mono text-white">24%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[24%] h-full bg-white/70 rounded-full"></div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock className="w-4 h-4 text-white/40" /> Verification Latency
                </div>
                <span className="text-sm font-mono text-[#b8d4f0]">3ms</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
