'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Bell, CreditCard, AlertTriangle, Eye, Copy, RefreshCw } from 'lucide-react';

type Tab = 'profile' | 'security' | 'notifications' | 'billing' | 'danger';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [confirmText, setConfirmText] = useState('');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-2xl">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#111] border border-white/[0.1] rounded-full flex items-center justify-center text-white text-xl font-medium">
                JD
              </div>
              <div>
                <button className="px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-sm text-sm hover:bg-white/[0.1] transition-colors">
                  Upload Avatar
                </button>
                <p className="text-xs text-neutral-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400">First Name</label>
                  <input defaultValue="Jane" className="w-full bg-[#111] border border-white/[0.1] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-white/[0.3]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400">Last Name</label>
                  <input defaultValue="Doe" className="w-full bg-[#111] border border-white/[0.1] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-white/[0.3]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Email Address</label>
                <input defaultValue="jane@example.com" type="email" className="w-full bg-[#111] border border-white/[0.1] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-white/[0.3]" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-400">Bio</label>
                <textarea rows={3} className="w-full bg-[#111] border border-white/[0.1] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-white/[0.3] resize-none" defaultValue="Building agents." />
              </div>
            </div>
            
            <button className="px-6 py-2 bg-white text-black text-sm font-medium rounded-sm hover:bg-neutral-200">
              Save Changes
            </button>
          </motion.div>
        );
      case 'security':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-w-2xl">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white border-b border-white/[0.05] pb-2">Password</h3>
              <div className="space-y-4">
                <input type="password" placeholder="Current Password" className="w-full bg-[#111] border border-white/[0.1] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-white/[0.3]" />
                <input type="password" placeholder="New Password" className="w-full bg-[#111] border border-white/[0.1] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-white/[0.3]" />
                <button className="px-4 py-2 bg-white/[0.05] border border-white/[0.1] text-white text-sm font-medium rounded-sm hover:bg-white/[0.1]">
                  Update Password
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/[0.05] pb-2">
                <h3 className="text-lg font-medium text-white">API Keys</h3>
                <span className="text-xs text-neutral-500">2 Active</span>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'Production Key', prefix: 'gh_prod_', date: 'Oct 12, 2024' },
                  { name: 'Sandbox Key', prefix: 'gh_test_', date: 'Sep 01, 2024' }
                ].map((key, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#111] border border-white/[0.05] rounded-sm">
                    <div>
                      <div className="text-sm font-medium text-white">{key.name}</div>
                      <div className="text-xs text-neutral-500 font-mono mt-1">{key.prefix}••••••••••••••••</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-neutral-400 hover:text-white bg-white/[0.05] rounded"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 text-neutral-400 hover:text-white bg-white/[0.05] rounded"><Copy className="w-4 h-4" /></button>
                      <button className="p-2 text-red-400 hover:text-red-300 bg-red-500/[0.1] rounded"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white border-b border-white/[0.05] pb-2">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Authenticator App</p>
                  <p className="text-xs text-neutral-500">Use TOTP apps like Google Authenticator.</p>
                </div>
                <button className="w-12 h-6 bg-white/[0.2] rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-2xl">
            <h3 className="text-lg font-medium text-white border-b border-white/[0.05] pb-2">Email Notifications</h3>
            <div className="space-y-6">
              {[
                { title: 'Email on approval request', desc: 'Get notified when an agent hits a policy.' },
                { title: 'Email on blocked transaction', desc: 'Alerts for policy violations.', active: true },
                { title: 'Email on agent connected', desc: 'When a new agent ID is observed.', active: true },
                { title: 'Weekly digest', desc: 'Summary of agent activity and proof generation.' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button className={`w-10 h-5 rounded-full relative transition-colors ${item.active ? 'bg-white' : 'bg-white/[0.2]'}`}>
                    <div className={`w-4 h-4 bg-[#111] rounded-full absolute top-0.5 transition-all ${item.active ? 'left-[22px]' : 'left-0.5'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'billing':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-2xl">
            <div className="p-6 border border-white/[0.1] bg-[#111] rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-1">Current Plan</p>
                <h2 className="text-2xl font-medium text-white">Growth</h2>
                <p className="text-sm text-neutral-400 mt-2">Next billing date: Nov 1, 2024</p>
              </div>
              <button disabled className="px-4 py-2 bg-white/[0.05] text-neutral-500 border border-white/[0.05] text-sm rounded-sm cursor-not-allowed">
                Manage Billing
              </button>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white border-b border-white/[0.05] pb-2">Usage</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-300">Agents</span>
                  <span className="text-white font-mono">4 / 10</span>
                </div>
                <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-300">Transactions</span>
                  <span className="text-white font-mono">1,204 / 2,000</span>
                </div>
                <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'danger':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-2xl">
            <div className="p-6 border border-red-500/[0.2] bg-red-500/[0.02] rounded-lg space-y-6">
              <div>
                <h3 className="text-lg font-medium text-red-400 mb-2">Revoke All Agents</h3>
                <p className="text-sm text-neutral-400">Immediately disconnects all agents and invalidates API keys. Cannot be undone.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-neutral-500">Type CONFIRM to proceed</label>
                <div className="flex gap-4">
                  <input 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="flex-1 bg-[#0a0a0a] border border-red-500/[0.2] rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/[0.5]" 
                  />
                  <button 
                    disabled={confirmText !== 'CONFIRM'}
                    className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium rounded-sm hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border border-white/[0.05] rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2">Delete Account</h3>
              <p className="text-sm text-neutral-400 mb-6">Permanently delete your account and all associated data, policies, and audit logs.</p>
              <button className="px-4 py-2 bg-transparent text-neutral-300 border border-white/[0.1] text-sm rounded-sm hover:bg-white/[0.05]">
                Delete Account
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 font-sans p-8 md:p-12">
      <h1 className="text-3xl font-medium tracking-tight text-white mb-8">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-12">
        {/* Vertical Tabs */}
        <div className="w-full md:w-56 flex flex-col gap-1 border-r border-white/[0.05] pr-6">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm transition-colors text-left ${activeTab === 'profile' ? 'bg-white/[0.08] text-white font-medium' : 'text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200'}`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm transition-colors text-left ${activeTab === 'security' ? 'bg-white/[0.08] text-white font-medium' : 'text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200'}`}
          >
            <Shield className="w-4 h-4" /> Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm transition-colors text-left ${activeTab === 'notifications' ? 'bg-white/[0.08] text-white font-medium' : 'text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200'}`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm transition-colors text-left ${activeTab === 'billing' ? 'bg-white/[0.08] text-white font-medium' : 'text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200'}`}
          >
            <CreditCard className="w-4 h-4" /> Billing
          </button>
          <button 
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm transition-colors text-left mt-6 ${activeTab === 'danger' ? 'bg-red-500/[0.1] text-red-400 font-medium' : 'text-neutral-500 hover:bg-white/[0.03] hover:text-red-400'}`}
          >
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-[500px]">
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
