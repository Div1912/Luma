'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

const CodeBlock = ({ code, language = 'typescript' }: { code: string, language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 border border-white/[0.07] rounded-lg bg-[#0a0a0a] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] bg-[#111]">
        <span className="text-xs text-neutral-500 font-mono">{language}</span>
        <button 
          onClick={handleCopy}
          className="text-neutral-500 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-neutral-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function QuickstartPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 font-sans flex">
      {/* Sidebar Nav */}
      <aside className="w-64 border-r border-white/[0.07] h-screen sticky top-0 hidden md:block pt-24 pb-8 px-6 overflow-y-auto">
        <nav className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-widest text-neutral-500 font-medium mb-2">Getting Started</div>
          <Link href="/docs" className="text-sm text-neutral-400 hover:text-neutral-200 py-1 transition-colors">Overview</Link>
          <Link href="/docs/quickstart" className="text-sm text-white font-medium py-1">Quickstart</Link>
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
          <h1 className="text-4xl font-medium tracking-tight text-white mb-6">Quickstart</h1>
          <p className="text-lg text-neutral-400 mb-10 leading-relaxed">
            Get Ghost running in your application in less than 5 minutes.
          </p>

          <h2 className="text-xl font-medium text-white mt-12 mb-4">1. Install the SDK</h2>
          <p className="text-neutral-400 text-sm mb-4">
            First, install the Ghost SDK via npm or your preferred package manager.
          </p>
          <CodeBlock code="npm install @ghost/sdk" language="bash" />

          <h2 className="text-xl font-medium text-white mt-12 mb-4">2. Initialize the Client</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Initialize the client with your API key from the Ghost dashboard.
          </p>
          <CodeBlock 
            code={`import { GhostClient } from '@ghost/sdk';

const ghost = new GhostClient({
  apiKey: process.env.GHOST_API_KEY,
  environment: 'production' // or 'sandbox'
});`} 
          />

          <h2 className="text-xl font-medium text-white mt-12 mb-4">3. Create a Policy</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Define a policy that restricts agent actions. This example limits a transfer amount.
          </p>
          <CodeBlock 
            code={`const policy = await ghost.policies.create({
  name: "Limit High Value Transfers",
  rules: \`
    allow transfer if amount <= 1000;
    deny transfer if amount > 1000;
  \`
});`} 
          />

          <h2 className="text-xl font-medium text-white mt-12 mb-4">4. Request Approval</h2>
          <p className="text-neutral-400 text-sm mb-4">
            Before your agent executes an action, check it against the policy engine.
          </p>
          <CodeBlock 
            code={`const txRequest = {
  action: "transfer",
  agentId: "agent_8f92k1",
  parameters: { amount: 500, token: "USDC" }
};

const decision = await ghost.evaluate(txRequest);

if (decision.approved) {
  // Execute the action safely
  await executeOnChain(txRequest);
} else {
  console.log("Transaction blocked by policy:", decision.reason);
}`} 
          />

          <div className="mt-16 flex justify-between border-t border-white/[0.07] pt-8">
            <Link 
              href="/docs"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              ← Overview
            </Link>
            <Link 
              href="/docs/core-concepts"
              className="text-white hover:text-[#b8d4f0] transition-colors"
            >
              Core Concepts →
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
