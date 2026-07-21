'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DocsOverviewPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 font-sans flex">
      {/* Sidebar Nav */}
      <aside className="w-64 border-r border-white/[0.07] h-screen sticky top-0 hidden md:block pt-24 pb-8 px-6 overflow-y-auto">
        <nav className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-widest text-neutral-500 font-medium mb-2">Getting Started</div>
          <Link href="/docs" className="text-sm text-white font-medium py-1">Overview</Link>
          <Link href="/docs/quickstart" className="text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors">Quickstart</Link>
          <Link href="/docs/core-concepts" className="text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors">Core Concepts</Link>
          
          <div className="text-xs uppercase tracking-widest text-neutral-500 font-medium mt-6 mb-2">Guides</div>
          <Link href="/docs/policy-language" className="text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors">Policy Language</Link>
          <Link href="/docs/sdk-reference" className="text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors">SDK Reference</Link>
          <Link href="/docs/proof-lifecycle" className="text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors">Proof Lifecycle</Link>
          <Link href="/docs/webhooks" className="text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors">Webhooks</Link>
          
          <div className="text-xs uppercase tracking-widest text-neutral-500 font-medium mt-6 mb-2">Reference</div>
          <Link href="/docs/api" className="text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors">API Reference</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-24 px-6 md:px-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-medium tracking-tight text-white mb-6">Overview</h1>
          <p className="text-lg text-neutral-400 mb-12 leading-relaxed">
            Ghost is the deterministic policy engine for AI agents. It provides a secure, verifiable layer that sits between your agents and the execution environment, enforcing constraints before actions are taken and generating zero-knowledge proofs on the Midnight network.
          </p>

          <h2 className="text-2xl font-medium text-white mb-6 border-b border-white/[0.07] pb-4">Architecture</h2>
          
          <div className="w-full bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-lg p-8 mb-12 flex flex-col items-center gap-6">
            <div className="flex w-full justify-between items-center max-w-xl">
              <div className="border border-white/[0.1] rounded bg-[#111] p-4 text-center w-32">
                <span className="text-sm font-medium">AI Agent</span>
              </div>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-white/[0.2] to-transparent relative">
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-white/[0.4] rotate-45"></div>
              </div>
              <div className="border border-[#b8d4f0]/[0.3] rounded bg-[#b8d4f0]/[0.05] p-4 text-center w-32 shadow-[0_0_15px_rgba(184,212,240,0.1)]">
                <span className="text-sm font-medium text-[#b8d4f0]">Ghost Engine</span>
              </div>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-white/[0.2] to-transparent relative">
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-white/[0.4] rotate-45"></div>
              </div>
              <div className="border border-white/[0.1] rounded bg-[#111] p-4 text-center w-32">
                <span className="text-sm font-medium">Blockchain / APIs</span>
              </div>
            </div>
            
            <div className="w-0.5 h-12 bg-gradient-to-b from-white/[0.2] to-transparent relative"></div>
            
            <div className="border border-white/[0.1] rounded bg-[#111] p-4 text-center w-48">
              <span className="text-sm font-medium">Midnight Network (Proofs)</span>
            </div>
          </div>

          <h2 className="text-2xl font-medium text-white mb-6 border-b border-white/[0.07] pb-4">Key Concepts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="border border-white/[0.07] bg-[rgba(12,12,12,0.7)] p-6 rounded-lg">
              <h3 className="text-white font-medium mb-2">Policy</h3>
              <p className="text-sm text-neutral-400">Written in TypeScript-like syntax, defining exactly what parameters are allowed for specific actions.</p>
            </div>
            <div className="border border-white/[0.07] bg-[rgba(12,12,12,0.7)] p-6 rounded-lg">
              <h3 className="text-white font-medium mb-2">Agent</h3>
              <p className="text-sm text-neutral-400">The autonomous entity submitting transactions. Authenticated via standard API keys or DID.</p>
            </div>
            <div className="border border-white/[0.07] bg-[rgba(12,12,12,0.7)] p-6 rounded-lg">
              <h3 className="text-white font-medium mb-2">Approval</h3>
              <p className="text-sm text-neutral-400">A deterministic yes/no response from the engine based strictly on the active policy state.</p>
            </div>
            <div className="border border-[#b8d4f0]/[0.2] bg-[#b8d4f0]/[0.02] p-6 rounded-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#b8d4f0]/[0.05] blur-3xl rounded-full"></div>
              <h3 className="text-[#b8d4f0] font-medium mb-2">Proof</h3>
              <p className="text-sm text-neutral-400">A Zero-Knowledge proof generated post-approval, asserting that policy rules were strictly followed without revealing internal state.</p>
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <Link 
              href="/docs/quickstart"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-medium rounded-sm hover:bg-neutral-200 transition-colors"
            >
              Next: Quickstart →
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
