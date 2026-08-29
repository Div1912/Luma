'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Webhook, Code2, Plus, Copy, Trash2, CheckCircle2, Shield, Blocks } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsed: string;
}

export default function AppDeveloperPage() {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState("prod");
  const [keys, setKeys] = useState<ApiKey[]>([
    { id: '1', name: 'Production Fleet Server', prefix: 'gh_prod_...8f92', lastUsed: '2 mins ago' },
    { id: '2', name: 'Local AutoGPT Testing', prefix: 'gh_test_...3a1b', lastUsed: 'Oct 14, 2024' }
  ]);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);

  const generateKey = () => {
    if (!newKeyName) return;
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    const secureRandomStr = Array.from(array, dec => dec.toString(36).padStart(7, '0')).join('');
    const keyVal = `gh_${newKeyEnv}_${secureRandomStr}`;
    setNewlyGeneratedKey(keyVal);
    setKeys([{ id: Date.now().toString(), name: newKeyName, prefix: `gh_${newKeyEnv}_...${keyVal.slice(-4)}`, lastUsed: 'Never' }, ...keys]);
    setNewKeyName("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen text-neutral-200 font-sans p-8 md:p-12 pb-24 space-y-10">
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Developer Platform</h1>
          <p className="text-sm text-neutral-400">Manage Ghost API keys and integrate ZK compliance into your AI agent frameworks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column - Main configs */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* API Keys */}
          <section className="glass-liquid overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#b8d4f0]/10 border border-[#b8d4f0]/20">
                  <Key className="w-5 h-5 text-[#b8d4f0]" />
                </div>
                <h2 className="text-lg font-medium text-white">API Keys</h2>
              </div>
              <button 
                onClick={() => { setShowKeyModal(true); setNewlyGeneratedKey(null); }}
                className="btn-liquid btn-liquid-primary text-xs py-2 px-3.5 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Generate New Key
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-white/[0.02] text-neutral-400 border-b border-white/10 text-xs font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Prefix</th>
                    <th className="px-6 py-3 font-medium">Last Used</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {keys.map(k => (
                    <tr key={k.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-medium text-white">{k.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-[#b8d4f0]">{k.prefix}</td>
                      <td className="px-6 py-4 text-neutral-400 text-xs font-mono">{k.lastUsed}</td>
                      <td className="px-6 py-4 flex justify-end gap-3">
                        <button onClick={() => setKeys(keys.filter(key => key.id !== k.id))} className="text-neutral-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {keys.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">No API keys generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Webhooks */}
          <section className="glass-liquid p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#b8d4f0]/10 border border-[#b8d4f0]/20">
                  <Webhook className="w-5 h-5 text-[#b8d4f0]" />
                </div>
                <h2 className="text-lg font-medium text-white">Webhooks (Enterprise)</h2>
              </div>
              <button className="btn-liquid btn-liquid-secondary text-xs py-1.5 px-3">Add Endpoint</button>
            </div>

            <div className="border border-white/10 rounded-xl p-4 bg-black/40">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
                    <span className="font-mono text-xs text-white">https://api.myapp.com/ghost-webhook</span>
                  </div>
                  <p className="text-xs text-neutral-500 font-mono">whsec_j9k2...l2o1</p>
                </div>
                <button className="btn-liquid btn-liquid-secondary text-xs py-1 px-2.5">Test</button>
              </div>
              <div className="flex gap-2 font-mono">
                <span className="text-[10px] bg-white/[0.05] text-neutral-300 px-2 py-0.5 rounded border border-white/10">policy.evaluated</span>
                <span className="text-[10px] bg-[#b8d4f0]/10 text-[#b8d4f0] px-2 py-0.5 rounded border border-[#b8d4f0]/20">proof.generated</span>
                <span className="text-[10px] bg-red-400/10 text-red-400 px-2 py-0.5 rounded border border-red-400/20">agent.blocked</span>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column - Integration */}
        <div className="space-y-6">
          <section className="glass-liquid p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2 rounded-lg bg-[#b8d4f0]/10 border border-[#b8d4f0]/20">
                <Blocks className="w-5 h-5 text-[#b8d4f0]" />
              </div>
              <h2 className="text-lg font-medium text-white">Framework SDK</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-neutral-400 mb-2">1. Install Ghost SDK</p>
                <div className="bg-[#0a0a0a] border border-white/[0.05] rounded p-3 text-xs font-mono text-neutral-300 relative group flex items-center justify-between">
                  <span>npm install @ghost/sdk</span>
                  <button onClick={() => copyToClipboard('npm install @ghost/sdk')} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3.5 h-3.5 text-neutral-500 hover:text-white" /></button>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-neutral-400 mb-2">2. LangChain / AutoGPT Integration</p>
                <div className="bg-[#0a0a0a] border border-white/[0.05] rounded p-4 text-xs font-mono text-neutral-300 relative group overflow-hidden">
                  <div className="whitespace-pre">
<span className="text-pink-400">import</span> {'{'} GhostClient {'}'} <span className="text-pink-400">from</span> <span className="text-green-300">'@ghost/sdk'</span>;

<span className="text-pink-400">const</span> ghost = <span className="text-pink-400">new</span> GhostClient({'{'}
  apiKey: process.env.GHOST_KEY,
  network: <span className="text-green-300">'midnight-mainnet'</span>
{'}'});

<span className="text-neutral-500">// Intercept intent before execution</span>
<span className="text-pink-400">const</span> proof = <span className="text-pink-400">await</span> ghost.proveIntent({'{'}
  agentId: <span className="text-green-300">'agent_098x'</span>,
  action: <span className="text-green-300">'PURCHASE'</span>,
  amount: <span className="text-blue-300">250.00</span>
{'}'});

<span className="text-pink-400">if</span> (proof.isValid) {'{'}
  <span className="text-neutral-500">// Execute safely in LangChain/AutoGPT</span>
  <span className="text-pink-400">await</span> execute(intent);
{'}'}
                  </div>
                  <button onClick={() => copyToClipboard(`import { GhostClient } from '@ghost/sdk';\n\nconst ghost = new GhostClient({\n  apiKey: process.env.GHOST_KEY,\n  network: 'midnight-mainnet'\n});\n\nconst proof = await ghost.proveIntent({\n  agentId: 'agent_098x',\n  action: 'PURCHASE',\n  amount: 250.00\n});\n\nif (proof.isValid) {\n  await execute(intent);\n}`)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black p-1.5 rounded border border-white/[0.1]"><Copy className="w-3.5 h-3.5 text-neutral-500 hover:text-white" /></button>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.05]">
                <a href="/docs" className="text-sm text-[#b8d4f0] hover:text-white transition-colors flex items-center justify-between">
                  Read Integration Docs <span>→</span>
                </a>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* Modal for new key */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { if (!newlyGeneratedKey) setShowKeyModal(false); }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-white/[0.1] rounded-xl shadow-2xl w-full max-w-md p-6 relative z-10"
            >
              {!newlyGeneratedKey ? (
                <>
                  <h3 className="text-xl font-medium text-white mb-2">Generate API Key</h3>
                  <p className="text-sm text-neutral-400 mb-6">Create a new key to authenticate your agents with the Ghost SDK.</p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300">Name</label>
                      <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. CI/CD Runner" className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/[0.3]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300">Environment</label>
                      <select value={newKeyEnv} onChange={e => setNewKeyEnv(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/[0.3] appearance-none">
                        <option value="test">Test</option>
                        <option value="prod">Production</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end border-t border-white/[0.05] pt-4">
                    <button 
                      onClick={() => setShowKeyModal(false)}
                      className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={generateKey}
                      disabled={!newKeyName}
                      className="px-4 py-2 bg-[#b8d4f0] text-black text-sm font-medium rounded hover:bg-white transition-colors disabled:opacity-50"
                    >
                      Generate Key
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white">Key Generated</h3>
                  </div>
                  <p className="text-sm text-neutral-400 mb-6">Please copy this key and store it somewhere safe. For security reasons, <strong className="text-white">it will not be shown again</strong>.</p>
                  
                  <div className="bg-[#0a0a0a] border border-white/[0.1] rounded p-4 flex items-center justify-between mb-8">
                    <code className="text-[#b8d4f0] font-mono text-sm break-all mr-4">{newlyGeneratedKey}</code>
                    <button onClick={() => copyToClipboard(newlyGeneratedKey)} className="p-2 hover:bg-white/10 rounded transition-colors shrink-0">
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowKeyModal(false)}
                    className="w-full py-2 bg-white text-black text-sm font-medium rounded hover:bg-neutral-200 transition-colors"
                  >
                    I have saved this key
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
