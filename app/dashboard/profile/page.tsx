"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { 
  User, 
  Shield, 
  Key, 
  Lock, 
  Globe, 
  Mail, 
  Building, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Smartphone, 
  Laptop, 
  LogOut, 
  Hash, 
  Layers, 
  FileLock, 
  Activity, 
  Zap, 
  Sliders, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Check
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, metrics, policies, fleets, signOut } = useGhostStore();
  const { walletState, network, connectLace, disconnectLace } = useMidnight();

  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "Alex");
  const [lastName, setLastName] = useState(user?.name?.split(" ")[1] || "Morgan");
  const [email, setEmail] = useState(user?.email || "alex@ghost.xyz");
  const [role, setRole] = useState(user?.role || "Chief AI Security Architect");
  const [organization, setOrganization] = useState(user?.organization || "Ghost Autonomous Swarms Inc.");
  const [bio, setBio] = useState(user?.bio || "Orchestrating zero-knowledge policy firewalls across autonomous AI agent fleets.");
  const [timezone, setTimezone] = useState(user?.timezone || "UTC-8 (Pacific Time)");
  const [isSaving, setIsSaving] = useState(false);

  const [activeSessions, setActiveSessions] = useState([
    { id: "sess_1", device: "MacBook Pro (Apple Silicon M3 Max)", location: "San Francisco, US", ip: "192.0.2.45", current: true, lastActive: "Active Now", browser: "Chrome 128 / macOS" },
    { id: "sess_2", device: "Linux Workstation (Ubuntu 24.04)", location: "Ashburn, US (Data Center)", ip: "198.51.100.12", current: false, lastActive: "2 hours ago", browser: "Node Agent SDK Daemon" },
    { id: "sess_3", device: "iPhone 16 Pro", location: "San Francisco, US", ip: "203.0.113.88", current: false, lastActive: "1 day ago", browser: "Mobile WebAuthn Key" },
  ]);

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      updateUser({
        name: fullName || "Alex Morgan",
        email: email.trim() || "alex@ghost.xyz",
        role: role.trim(),
        organization: organization.trim(),
        bio: bio.trim(),
        timezone: timezone.trim()
      });
      setIsSaving(false);
      toast.success("Profile Updated Successfully", {
        description: "Your enterprise administrative credentials have been saved."
      });
    }, 400);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const handleRevokeSession = (sessionId: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    toast.info("Session Revoked", {
      description: "Cryptographic session token invalidated."
    });
  };

  const unshieldedAddress = walletState.address || "mn_preprod1qq9f45x82c4vdzk883ha049mclks7jff92e4ks88x";
  const viewingKey = "0x4b7f8e91c2a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Profile Header Card */}
      <div className="glass-liquid-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b8d4f0]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            {/* Liquid Glass Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-white/20 via-[#b8d4f0]/30 to-white/10 p-0.5 shadow-2xl backdrop-blur-xl border border-white/20">
                <div className="w-full h-full rounded-2xl bg-black/70 flex items-center justify-center text-white font-mono font-bold text-2xl tracking-wider">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-black shadow-[0_0_10px_#34d399]" title="Verified Admin" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-white">{firstName} {lastName}</h1>
                <span className="bg-[#b8d4f0]/15 text-[#b8d4f0] border border-[#b8d4f0]/30 text-xs font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Midnight Preprod Verified</span>
                </span>
                <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-mono px-2.5 py-0.5 rounded-full">
                  Quorum Signer (2/3)
                </span>
              </div>
              
              <p className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                <span>{role}</span>
                <span className="text-white/20">•</span>
                <span className="text-zinc-300">{organization}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#b8d4f0]" /> {email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#b8d4f0]" /> {timezone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleSaveProfile} 
              disabled={isSaving}
              className="btn-liquid btn-liquid-primary flex-1 md:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 font-semibold text-xs"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
            <button 
              onClick={() => {
                disconnectLace();
                signOut();
                toast.info("Signed Out", { description: "Administrative session terminated." });
                router.replace("/auth/signin");
              }}
              className="btn-liquid btn-liquid-secondary flex-1 md:flex-initial flex items-center justify-center gap-2 py-2.5 px-4 text-xs text-red-400 hover:text-red-300 font-mono"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Governance Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-liquid p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Fleets</span>
            <Layers className="w-4 h-4 text-[#b8d4f0]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{fleets.length || 3} Swarms</div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">Hierarchical Governance</div>
        </div>

        <div className="glass-liquid p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Compact Policies</span>
            <FileLock className="w-4 h-4 text-[#b8d4f0]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{policies.length || 6} Active</div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">ZK Enforced Circuits</div>
        </div>

        <div className="glass-liquid p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">30-Day Verifications</span>
            <Activity className="w-4 h-4 text-[#b8d4f0]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{(metrics.proofVerifications || 1420).toLocaleString()} Proofs</div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">100% Policy Adherence</div>
        </div>

        <div className="glass-liquid p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Proof Verification SLA</span>
            <Zap className="w-4 h-4 text-[#b8d4f0]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">Sub-second</div>
          <div className="text-[11px] text-[#b8d4f0] font-mono mt-1">Midnight Preprod Indexer</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Identity & Security Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Personal & Organization Details */}
          <div className="glass-liquid p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <User className="w-5 h-5 text-[#b8d4f0]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Administrative Identity</h2>
                <p className="text-xs text-zinc-400">Personal details and enterprise organizational context.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-mono text-zinc-400">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-mono text-zinc-400">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-mono text-zinc-400">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-mono text-zinc-400">Role Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs uppercase tracking-wider font-mono text-zinc-400">Enterprise Organization</label>
                <input
                  type="text"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs uppercase tracking-wider font-mono text-zinc-400">Bio / Governance Charter</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 resize-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Active Enterprise Sessions */}
          <div className="glass-liquid p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <Laptop className="w-5 h-5 text-[#b8d4f0]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Active Administrative Sessions</h2>
                  <p className="text-xs text-zinc-400">Devices and services authorized to orchestrate agents.</p>
                </div>
              </div>
              <span className="text-xs font-mono text-zinc-400">{activeSessions.length} Active</span>
            </div>

            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 text-zinc-300">
                      {session.device.includes("iPhone") ? <Smartphone className="w-4 h-4 text-[#b8d4f0]" /> : <Laptop className="w-4 h-4 text-[#b8d4f0]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{session.device}</span>
                        {session.current && (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        {session.location} • <span className="text-zinc-500">{session.ip}</span> • {session.browser}
                      </p>
                    </div>
                  </div>

                  {!session.current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 bg-red-500/10 px-3 py-1.5 rounded-lg transition-all font-mono self-start sm:self-auto"
                    >
                      Revoke Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Midnight Cryptographic Identity & Wallet */}
        <div className="space-y-8">
          {/* Midnight Cryptographic Card */}
          <div className="glass-liquid p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#b8d4f0]" />
                <h3 className="text-base font-bold text-white">Midnight ZK Identity</h3>
              </div>
              <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold ${
                network === 'preprod' ? 'bg-[#b8d4f0]/20 text-[#b8d4f0] border border-[#b8d4f0]/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {network.toUpperCase()}
              </span>
            </div>

            {/* Unshielded Public Address */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                Unshielded Wallet Address
              </label>
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#b8d4f0] break-all select-all">
                    {unshieldedAddress}
                  </span>
                  <button 
                    onClick={() => handleCopy(unshieldedAddress, "Wallet Address")} 
                    className="p-1.5 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                    title="Copy Address"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <a
                  href={`https://${network}.midnightexplorer.com/accounts/${unshieldedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#b8d4f0] hover:text-white transition-colors flex items-center justify-between font-mono pt-1.5 border-t border-white/5"
                >
                  <span>Explore Account on Midnight</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Shielded Viewing Key Status */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                Shielded Private Viewing Key
              </label>
              <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 truncate max-w-[200px]">
                    {viewingKey}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Synced
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono leading-tight">
                  Authorized for local ZK proof generation without revealing plaintext parameters.
                </p>
              </div>
            </div>

            {/* Quorum Governance Level */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-200">Signing Authority</span>
                <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded">Level 3</span>
              </div>
              <p className="text-xs text-purple-300/80 leading-relaxed">
                Authorized to execute dynamic threshold rebalancing and sign multi-party approvals above $50,000.
              </p>
            </div>

            {/* Wallet Actions */}
            <div className="pt-2">
              {walletState.isConnected ? (
                <button
                  onClick={() => {
                    disconnectLace();
                    toast.info("Wallet Disconnected");
                  }}
                  className="btn-liquid btn-liquid-secondary w-full py-2.5 text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Lace Wallet</span>
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await connectLace();
                      toast.success("Lace Wallet Connected!");
                    } catch (e: any) {
                      toast.error("Connection Failed", { description: e.message || String(e) });
                    }
                  }}
                  className="btn-liquid btn-liquid-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Connect Lace Wallet</span>
                </button>
              )}
            </div>
          </div>

          {/* Enterprise Security Certifications Card */}
          <div className="glass-liquid p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#b8d4f0]" />
              <span>Compliance & Security</span>
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between">
                <span className="text-zinc-300">FIDO2 WebAuthn 2FA</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                </span>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between">
                <span className="text-zinc-300">Local ZK Proof Server</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                </span>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between">
                <span className="text-zinc-300">Audit Proof Encryption</span>
                <span className="text-[#b8d4f0] font-bold">AES-256-GCM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
