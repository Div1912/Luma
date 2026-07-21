'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Webhook, Code2, Plus, Copy, Trash2, CheckCircle2 } from 'lucide-react';

export default function AppDeveloperPage() {
  const [showKeyModal, setShowKeyModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 font-sans p-8 md:p-12 pb-24">
      <div className="flex justify-between items-center mb-10 border-b border-white/[0.07] pb-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Developer</h1>
          <p className="text-sm text-neutral-400">Manage API keys, webhooks, and integration details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column - Main configs */}
        <div className="xl:col-span-2 space-y-10">
          
          {/* API Keys */}
          <section className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-lg overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-neutral-400" />
                <h2 className="text-lg font-medium text-white">API Keys</h2>
              </div>
              <button 
                onClick={() => setShowKeyModal(true)}
                className="flex items-center gap-2 text-xs font-medium bg-white text-black px-3 py-1.5 rounded hover:bg-neutral-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Generate Key
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-[#111] text-neutral-500 border-b border-white/[0.05] text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Prefix</th>
                    <th className="px-6 py-3 font-medium">Last Used</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-white">Production Server</td>
                    <td className="px-6 py-4 font-mono text-xs">gh_prod_...8f92</td>
                    <td className="px-6 py-4 text-neutral-500">2 mins ago</td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button className="text-neutral-500 hover:text-white transition-colors"><Copy className="w-4 h-4" /></button>
                      <button className="text-neutral-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-white">Local Testing</td>
                    <td className="px-6 py-4 font-mono text-xs">gh_test_...3a1b</td>
                    <td className="px-6 py-4 text-neutral-500">Oct 14, 2024</td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button className="text-neutral-500 hover:text-white transition-colors"><Copy className="w-4 h-4" /></button>
                      <button className="text-neutral-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Webhooks */}
          <section className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Webhook className="w-5 h-5 text-neutral-400" />
                <h2 className="text-lg font-medium text-white">Webhooks</h2>
              </div>
              <button className="text-xs bg-[#111] border border-white/[0.1] px-3 py-1.5 rounded hover:bg-white/[0.05]">Add Endpoint</button>
            </div>

            <div className="border border-white/[0.05] rounded p-4 bg-[#0a0a0a]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="font-medium text-sm text-white">https://api.myapp.com/ghost-webhook</span>
                  </div>
                  <p className="text-xs text-neutral-500 font-mono">whsec_j9k2...l2o1</p>
                </div>
                <button className="text-xs text-neutral-400 hover:text-white border border-white/[0.1] px-2 py-1 rounded">Test</button>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] bg-white/[0.05] text-neutral-300 px-2 py-1 rounded border border-white/[0.05]">policy.evaluated</span>
                <span className="text-[10px] bg-[#b8d4f0]/[0.1] text-[#b8d4f0] px-2 py-1 rounded border border-[#b8d4f0]/[0.2]">proof.generated</span>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column - Integration */}
        <div className="space-y-6">
          <section className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-white/[0.05] pb-4">
              <Code2 className="w-5 h-5 text-neutral-400" />
              <h2 className="text-lg font-medium text-white">Integration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-neutral-400 mb-2">Initialize Client</p>
                <div className="bg-[#0a0a0a] border border-white/[0.05] rounded p-3 text-xs font-mono text-neutral-300 relative group">
                  import {'{'} Ghost {'}'} from '@ghost/sdk';<br/><br/>
                  const ghost = new Ghost();
                  <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3.5 h-3.5 text-neutral-500" /></button>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-neutral-400 mb-2">Check Policy</p>
                <div className="bg-[#0a0a0a] border border-white/[0.05] rounded p-3 text-xs font-mono text-neutral-300 relative group overflow-hidden">
                  <div className="whitespace-pre">
{`const result = await ghost.evaluate({
  agentId: 'ag_123',
  action: 'swap',
  data: { amount: 100 }
});`}
                  </div>
                  <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3.5 h-3.5 text-neutral-500" /></button>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.05]">
                <a href="/docs" className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center justify-between">
                  View full documentation <span>→</span>
                </a>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* Modal for new key */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-white/[0.1] rounded-xl shadow-2xl w-full max-w-md p-6"
          >
            <h3 className="text-xl font-medium text-white mb-2">Generate API Key</h3>
            <p className="text-sm text-neutral-400 mb-6">This key will only be shown once. Copy it somewhere safe.</p>
            
            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Name</label>
                <input placeholder="e.g. CI/CD Runner" className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-white/[0.3]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Environment</label>
                <select className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-white/[0.3] appearance-none">
                  <option value="test">Test</option>
                  <option value="prod">Production</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 bg-white text-black text-sm font-medium rounded-sm hover:bg-neutral-200"
              >
                Generate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
