'use client';

import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

const CodeBlock = ({ code, title }: { code: string, title?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mb-8 border border-white/[0.07] rounded-lg bg-[#0a0a0a] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] bg-[#111]">
        <span className="text-xs text-neutral-400 font-mono">{title}</span>
        <button 
          onClick={handleCopy}
          className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2 text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-neutral-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function DeveloperPortalPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 font-sans flex flex-col md:flex-row pb-24">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/[0.07] sticky top-0 md:h-screen pt-24 pb-8 px-6 bg-[rgba(12,12,12,0.9)] backdrop-blur-md z-10">
        <nav className="flex flex-row md:flex-col gap-4 md:gap-2 overflow-x-auto md:overflow-visible">
          <a href="#overview" className="text-sm text-white font-medium whitespace-nowrap">SDK Overview</a>
          <a href="#policy" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors whitespace-nowrap">Policy API</a>
          <a href="#proof" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors whitespace-nowrap">Proof API</a>
          <a href="#webhooks" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors whitespace-nowrap">Webhook Events</a>
          <a href="#limits" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors whitespace-nowrap">Rate Limits</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-12 md:pt-24 px-6 md:px-16 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <header className="mb-20">
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-6">
              For developers. <br className="hidden md:block"/>Built like Stripe.
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl font-light">
              Predictable URLs, resource-oriented architecture, and robust typing. The Ghost API provides everything you need to securely constrain AI agents.
            </p>
          </header>

          <section id="overview" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-medium text-white mb-6 border-b border-white/[0.07] pb-4">SDK Overview</h2>
            <p className="text-neutral-400 mb-6">The official TypeScript SDK provides typed wrappers around the REST API.</p>
            <CodeBlock 
              title="npm install"
              code="npm install @ghost/sdk"
            />
            <CodeBlock 
              title="auth.ts"
              code={`import { Ghost } from '@ghost/sdk';

const ghost = new Ghost(process.env.GHOST_SECRET_KEY);`}
            />
          </section>

          <section id="policy" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-medium text-white mb-6 border-b border-white/[0.07] pb-4">Policy API</h2>
            <p className="text-neutral-400 mb-6">Create and manage policies that govern agent behavior.</p>
            <CodeBlock 
              title="create_policy.ts"
              code={`const policy = await ghost.policies.create({
  name: 'Restrict Token Swaps',
  description: 'Prevents swaps exceeding $50k USD equivalent',
  rules: [
    {
      action: 'allow',
      condition: 'tx.type == "swap" && tx.usdValue <= 50000'
    },
    {
      action: 'deny',
      condition: 'tx.type == "swap" && tx.usdValue > 50000'
    }
  ]
});`}
            />
          </section>

          <section id="proof" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-medium text-white mb-6 border-b border-white/[0.07] pb-4 border-[#b8d4f0]/[0.3]">Proof API <span className="ml-3 text-xs bg-[#b8d4f0]/[0.1] text-[#b8d4f0] px-2 py-1 rounded">Midnight Integration</span></h2>
            <p className="text-neutral-400 mb-6">Verify cryptographic proofs generated on the Midnight network for approved actions.</p>
            <CodeBlock 
              title="verify_proof.ts"
              code={`const proof = await ghost.proofs.retrieve('prf_1a2b3c4d');

const isValid = await ghost.proofs.verify(proof.id, {
  onChain: true,
  network: 'midnight-testnet'
});

console.log(isValid ? 'Proof mathematically sound' : 'Invalid proof');`}
            />
          </section>

          <section id="limits" className="mb-20 scroll-mt-24">
            <h2 className="text-2xl font-medium text-white mb-6 border-b border-white/[0.07] pb-4">Rate Limits</h2>
            <p className="text-neutral-400 mb-6">Limits are evaluated per minute based on your active plan.</p>
            <div className="overflow-x-auto border border-white/[0.07] rounded-lg bg-[rgba(12,12,12,0.7)] backdrop-blur-xl">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-[#111] text-neutral-400 border-b border-white/[0.05]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Plan</th>
                    <th className="px-6 py-4 font-medium">Evaluations / min</th>
                    <th className="px-6 py-4 font-medium">Management API / min</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  <tr>
                    <td className="px-6 py-4">Builder (Free)</td>
                    <td className="px-6 py-4 font-mono">60</td>
                    <td className="px-6 py-4 font-mono">100</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Growth</td>
                    <td className="px-6 py-4 font-mono">600</td>
                    <td className="px-6 py-4 font-mono">500</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Enterprise</td>
                    <td className="px-6 py-4 font-mono">Custom</td>
                    <td className="px-6 py-4 font-mono">Custom</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

        </motion.div>
      </main>
    </div>
  );
}
