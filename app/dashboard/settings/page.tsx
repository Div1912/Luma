'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Shield, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  LogOut, 
  Save, 
  CheckCircle2,
  Cpu,
  Wallet
} from 'lucide-react';
import { useGhostStore } from '@/store/useGhostStore';
import { useMidnight } from '@/lib/midnight/useMidnight';
import { toast } from 'sonner';

type Tab = 'profile' | 'ledger' | 'danger';

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, agents, revokeAgent, setUserContractAddress, signOut } = useGhostStore();
  const { network, setNetwork, walletState, connectLace, disconnect } = useMidnight();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [copied, setCopied] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmRevokeText, setConfirmRevokeText] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  // Form State initialized from user
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [contractAddressInput, setContractAddressInput] = useState(user?.contractAddress || '');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || '');
      setOrganization(user.organization || '');
      setBio(user.bio || '');
      setTimezone(user.timezone || 'UTC');
      setContractAddressInput(user.contractAddress || '');
    }
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('Copied to clipboard', { description: text });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
        organization: organization.trim(),
        bio: bio.trim(),
        timezone: timezone.trim(),
        walletAddress: walletState.address || user?.walletAddress
      });
      toast.success('Profile Updated', {
        description: 'Changes securely committed to database.'
      });
    } catch (err: any) {
      toast.error('Save Failed', {
        description: err.message || 'Could not update user record.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContractAddressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = contractAddressInput.replace(/^0x/, '').trim();
    if (!clean) {
      toast.error('Please enter a valid contract address');
      return;
    }
    try {
      await setUserContractAddress(clean);
      toast.success('Contract Address Linked', {
        description: `Active contract bound: ${clean.slice(0, 10)}...`
      });
    } catch (err: any) {
      toast.error('Failed to link contract', {
        description: err.message || 'Error updating contract address.'
      });
    }
  };

  const handleRevokeAllAgents = async () => {
    if (confirmRevokeText !== 'CONFIRM') return;
    setIsRevoking(true);
    try {
      const activeAgents = agents.filter(a => a.status === 'connected' || a.status === 'paused');
      for (const agent of activeAgents) {
        revokeAgent(agent.id);
      }
      toast.success('All Agents Revoked', {
        description: `Successfully revoked permissions for ${activeAgents.length} agents.`
      });
      setConfirmRevokeText('');
    } catch (err: any) {
      toast.error('Revocation Error', { description: err.message });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    toast.info('Signed Out', { description: 'Session cleared.' });
    router.replace('/auth/signin');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-2xl">
            <div className="flex items-center gap-6 pb-6 border-b border-white/10">
              <div className="w-16 h-16 bg-[#b8d4f0]/10 border border-[#b8d4f0]/30 rounded-2xl flex items-center justify-center text-[#b8d4f0] text-xl font-mono font-bold shadow-lg">
                {(name || user?.email || 'G').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{name || 'Enterprise Admin'}</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{email || user?.email || 'No email registered'}</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {user?.authType === 'wallet' ? '1AM Cryptographic Auth' : 'Credentials Authenticated'}
                </span>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Full Name</label>
                  <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Role / Title</label>
                  <input 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Security Architect"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Email Address</label>
                  <input 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Organization</label>
                  <input 
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Ghost Swarms Corp"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Timezone</label>
                  <input 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="UTC"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Linked Wallet Address</label>
                  <input 
                    value={user?.walletAddress || walletState.address || 'Not connected'}
                    readOnly
                    className="w-full bg-black/30 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-400 select-all cursor-default" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Bio / Node Context</label>
                <textarea 
                  rows={3} 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 resize-none" 
                  placeholder="Tell us about your swarm orchestration..."
                />
              </div>
              
              <button 
                type="submit"
                disabled={isSaving}
                className="btn-liquid btn-liquid-primary px-6 py-2.5 flex items-center gap-2 text-sm font-semibold shadow-lg"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-black" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        );

      case 'ledger':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-2xl">
            {/* Target Network Switcher */}
            <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-white">Midnight Ledger Network</h3>
                  <p className="text-xs text-zinc-400 mt-1">Select the active Midnight testnet network for zero-knowledge contract state.</p>
                </div>
                <span className="px-2.5 py-1 bg-[#b8d4f0]/10 border border-[#b8d4f0]/30 rounded-lg text-xs font-mono text-[#b8d4f0] uppercase">
                  Active: {network}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNetwork('preprod')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    network === 'preprod'
                      ? 'bg-white/15 border-white/30 text-white shadow-lg'
                      : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="font-bold text-sm">Midnight Preprod</div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Primary staging network</div>
                </button>
                <button
                  type="button"
                  onClick={() => setNetwork('preview')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    network === 'preview'
                      ? 'bg-white/15 border-white/30 text-white shadow-lg'
                      : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="font-bold text-sm">Midnight Preview</div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Feature validation network</div>
                </button>
              </div>
            </div>

            {/* 1AM Wallet State */}
            <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#b8d4f0]/10 border border-[#b8d4f0]/20 rounded-xl text-[#b8d4f0]">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">1AM Cryptographic Wallet</h3>
                    <p className="text-xs text-zinc-400">Midnight shielded identity connection.</p>
                  </div>
                </div>

                {walletState.isConnected ? (
                  <button
                    onClick={() => disconnect()}
                    className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-mono hover:bg-red-500/20 transition-all"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connectLace()}
                    className="btn-liquid btn-liquid-cyan px-4 py-2 text-xs font-semibold"
                  >
                    Connect 1AM
                  </button>
                )}
              </div>

              {walletState.isConnected && walletState.address ? (
                <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
                    <span>Connected Address:</span>
                    <button
                      onClick={() => copyToClipboard(walletState.address!, 'wallet')}
                      className="hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copied === 'wallet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-white break-all">{walletState.address}</div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 font-mono">No wallet actively linked in browser session.</p>
              )}
            </div>

            {/* Contract Address Binding */}
            <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">Deployed Ghost Contract Address</h3>
                <p className="text-xs text-zinc-400 mt-1">Bind or change the active Compact contract hash for your agent policy firewall.</p>
              </div>

              <form onSubmit={handleContractAddressUpdate} className="space-y-3">
                <div className="space-y-1.5">
                  <input
                    value={contractAddressInput}
                    onChange={(e) => setContractAddressInput(e.target.value)}
                    placeholder="Enter deployed contract address (e.g. 02005a...)"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#b8d4f0]/50"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="btn-liquid btn-liquid-primary px-4 py-2 text-xs font-semibold"
                  >
                    Update Contract Binding
                  </button>

                  {user?.contractAddress && (
                    <a
                      href={`https://explorer.1am.xyz/contract/${user.contractAddress}?network=${network}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>1AM Explorer</span>
                    </a>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        );

      case 'danger':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-2xl">
            {/* Revoke All Agents */}
            <div className="p-6 border border-red-500/25 bg-red-500/5 rounded-2xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-red-400 mb-1 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Revoke All Active Agents
                </h3>
                <p className="text-xs text-zinc-400">
                  Instantly disconnects all autonomous agents and invalidates policy clearances on the ledger.
                </p>
              </div>
              
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-red-400/80 block">
                  Type CONFIRM to execute swarm revocation
                </label>
                <div className="flex gap-3">
                  <input 
                    value={confirmRevokeText}
                    onChange={(e) => setConfirmRevokeText(e.target.value)}
                    placeholder="CONFIRM"
                    className="flex-1 bg-black/60 border border-red-500/30 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500" 
                  />
                  <button 
                    type="button"
                    disabled={confirmRevokeText !== 'CONFIRM' || isRevoking}
                    onClick={handleRevokeAllAgents}
                    className="px-5 py-2 bg-red-500 text-white text-xs font-bold font-mono rounded-xl hover:bg-red-600 disabled:opacity-40 transition-colors shadow-lg shadow-red-500/20"
                  >
                    {isRevoking ? 'Revoking...' : 'Revoke Swarm'}
                  </button>
                </div>
              </div>
            </div>

            {/* Session Sign Out */}
            <div className="p-6 border border-white/10 bg-black/40 rounded-2xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-zinc-400" />
                  Sign Out & Disconnect Session
                </h3>
                <p className="text-xs text-zinc-400">
                  Safely clears your active session, wallet link, and local cached tokens.
                </p>
              </div>
              <button 
                type="button"
                onClick={handleSignOut}
                className="px-5 py-2.5 bg-white/10 border border-white/20 text-white text-xs font-mono font-semibold rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Ghost</span>
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen text-neutral-200 font-sans p-8 md:p-12 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings & Configuration</h1>
        <p className="text-zinc-400 text-sm">Manage your cryptographic identity, Midnight ledger connection, and agent swarms.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-1.5 glass-liquid p-3 h-fit rounded-2xl">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all text-left ${activeTab === 'profile' ? 'bg-white/15 text-white font-bold shadow-inner border border-white/15' : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white'}`}
          >
            <User className="w-4 h-4 text-[#b8d4f0]" /> 
            <span>Profile & Org</span>
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all text-left ${activeTab === 'ledger' ? 'bg-white/15 text-white font-bold shadow-inner border border-white/15' : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white'}`}
          >
            <Layers className="w-4 h-4 text-[#b8d4f0]" /> 
            <span>Midnight Ledger</span>
          </button>
          <div className="h-px bg-white/10 my-2" />
          <button 
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all text-left ${activeTab === 'danger' ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/30' : 'text-neutral-500 hover:bg-red-500/10 hover:text-red-400'}`}
          >
            <AlertTriangle className="w-4 h-4 text-red-400" /> 
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-h-[500px] glass-liquid p-8 rounded-2xl">
          <AnimatePresence mode="wait">
            <div key={activeTab}>
              {renderTabContent()}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
