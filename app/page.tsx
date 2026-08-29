"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import {
  ArrowRight,
  Shield,
  Activity,
  CheckCircle,
  Hexagon,
  EyeOff,
  Key,
  Globe,
  Settings2,
  Terminal,
  Code2,
  Lock,
  Building2,
  Briefcase,
  Users,
  LineChart,
  SplitSquareHorizontal
} from "lucide-react";
import Hero3DScene from "@/components/hero/Hero3DScene";

export default function LandingPage() {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#b8d4f0] selection:text-black font-sans overflow-hidden">
      <Navbar />
      
      {/* 1. HERO: What are we? */}
      <section className="relative min-h-screen flex flex-col pt-32 pb-20 px-6 lg:px-12 max-w-[1600px] mx-auto">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-8 z-10"
          >
            <div className="flex flex-col gap-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
                Zero-Knowledge<br />
                <span className="text-white/60">payment gateway,</span><br />
                for AI Agents.
              </h1>
              <p className="text-lg md:text-xl text-white/50 max-w-xl font-light leading-relaxed">
                Ghost enables autonomous AI agents to negotiate, procure, and execute B2B transactions without exposing corporate budgets, vendor relationships, or secret API credentials to the public ledger.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/dashboard" className="h-12 px-8 flex items-center justify-center gap-2 bg-white text-black font-medium rounded hover:bg-[#b8d4f0] transition-colors group">
                Launch Platform
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/contact" className="h-12 px-8 flex items-center justify-center gap-2 bg-[rgba(20,20,20,0.8)] border border-white/[0.1] text-white font-medium rounded hover:bg-white/[0.05] transition-colors">
                Request Enterprise Demo
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              {[
                { icon: Shield, text: "Built on Midnight Blockchain" },
                { icon: Hexagon, text: "Consensus-Enforced" },
                { icon: EyeOff, text: "Complete Privacy" }
              ].map((chip, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (idx * 0.1) }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(10,10,10,0.65)] backdrop-blur-xl border border-white/[0.06] text-xs font-medium text-[#b8d4f0]"
                >
                  <chip.icon className="w-3.5 h-3.5" />
                  {chip.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="relative h-[50vh] lg:h-full min-h-[400px] w-full z-0 flex items-center justify-center">
            <Hero3DScene />
          </div>
        </div>

        {/* Live activity ribbon */}
        <div className="absolute bottom-0 left-0 right-0 h-12 border-t border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-md overflow-hidden flex items-center">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap gap-12 px-6"
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-8 text-xs font-mono text-white/40">
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#b8d4f0]" /> TX_A92F PROVEN</span>
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white/20" /> POLICY_SYNC</span>
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#b8d4f0]" /> AGENT_REQ APPROVED</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="flex flex-col gap-6 mb-20 text-center">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight">The Roadblock to Autonomous Operations</h2>
          <p className="text-lg text-white/50 max-w-3xl mx-auto">
            As enterprises adopt autonomous AI agents to manage cloud infrastructure, procure software, and negotiate vendor deals, they face critical roadblocks.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 border border-white/[0.06] bg-[rgba(15,15,15,0.4)] rounded-2xl flex flex-col gap-6"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-2xl font-medium">The Trust Deficit (Rogue Spending)</h3>
            <p className="text-white/60 leading-relaxed">
              Giving an AI agent wallet or treasury access poses immense risk. Standard Web2 dashboards rely on centralized software toggles that can fail, be bypassed, or get breached.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-10 border border-white/[0.06] bg-[rgba(15,15,15,0.4)] rounded-2xl flex flex-col gap-6"
          >
            <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Globe className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-2xl font-medium">The Public Ledger Privacy Dilemma</h3>
            <p className="text-white/60 leading-relaxed">
              Existing Web3 payment rails (Ethereum, Solana) are fully transparent. If an enterprise AI agent pays a vendor on a public blockchain, competitors can easily map their supply chain, track contract sizes, and exploit negotiated pricing.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-12 p-8 border border-[#b8d4f0]/20 bg-[#b8d4f0]/5 rounded-xl text-center"
        >
          <p className="text-xl font-medium text-[#b8d4f0]">
            Result: Enterprises cannot safely deploy autonomous financial AI agents without privacy and consensus-enforced spending limits.
          </p>
        </motion.div>
      </section>

      {/* 3. THE SOLUTION: GHOST PROTOCOL */}
      <section id="protocol" className="py-32 px-6 bg-[rgba(15,15,15,1)] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-6">The Solution: Ghost Protocol</h2>
            <p className="text-lg text-white/50 max-w-3xl mx-auto">
              Ghost solves this by wrapping AI agents in mathematical, Zero-Knowledge guardrails enforced at Midnight's consensus layer. Instead of asking users to "trust" the platform, Ghost provides cryptographic assertions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative z-10 flex flex-col p-10 bg-[rgba(10,10,10,0.65)] backdrop-blur-xl border border-white/[0.06] rounded-xl hover:border-white/[0.15] transition-all"
            >
              <div className="w-12 h-12 bg-white/[0.03] rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-5 h-5 text-[#b8d4f0]" />
              </div>
              <h3 className="text-2xl font-medium mb-4">Constraint Enforcement</h3>
              <p className="text-white/60 leading-relaxed text-lg">
                If an AI agent spends funds, Midnight validates a ZK proof that the spend is within user-defined policies. If the proof is invalid, the transaction is rejected at the protocol level—no centralized server required.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative z-10 flex flex-col p-10 bg-[rgba(10,10,10,0.65)] backdrop-blur-xl border border-white/[0.06] rounded-xl hover:border-white/[0.15] transition-all"
            >
              <div className="w-12 h-12 bg-white/[0.03] rounded-full flex items-center justify-center mb-6">
                <EyeOff className="w-5 h-5 text-[#b8d4f0]" />
              </div>
              <h3 className="text-2xl font-medium mb-4">Complete Financial Privacy</h3>
              <p className="text-white/60 leading-relaxed text-lg">
                Observers on the public blockchain only see cumulative compliance metrics. The transaction payload, target merchant, and raw authorization credentials remain private ZK witnesses, invisible to competitors.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. KEY ZK MODULES */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-6 text-center">Key ZK Modules & Midnight Primitives</h2>
        <p className="text-lg text-white/50 max-w-3xl mx-auto text-center mb-20">
          Ghost natively integrates Midnight's core ZK capabilities into a unified payment infrastructure.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Private Allowlist Access", subtitle: "Supply Chain Privacy", icon: Building2, desc: "Proves the AI agent is transacting with an approved corporate vendor without broadcasting the vendor's wallet address or identity on-chain." },
            { title: "Private Splits & Payroll", subtitle: "Confidential Payments", icon: SplitSquareHorizontal, desc: "Routes vendor payouts privately so competitors cannot discern individual transaction amounts or revenue sharing agreements." },
            { title: "Confidential Credentials", subtitle: "ZK API Keys", icon: Key, desc: "Verifies that the AI agent possesses valid corporate signing keys in ZK without transmitting secret API keys over the wire." },
            { title: "Eligibility / Reputation Gate", subtitle: "Threshold Verification", icon: Shield, desc: "Proves the agent satisfies credit/collateral thresholds prior to high-value contract execution, without revealing total balances." }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-8 bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.06] rounded-xl hover:bg-[rgba(15,15,15,0.9)] hover:border-white/[0.1] transition-all flex flex-col gap-4"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-white/[0.03] rounded-lg">
                  <feat.icon className="w-6 h-6 text-[#b8d4f0]" />
                </div>
                <div>
                  <h3 className="font-medium text-lg text-white/90">{feat.title}</h3>
                  <p className="text-sm text-white/40 font-mono">{feat.subtitle}</p>
                </div>
              </div>
              <p className="text-white/60 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. MARKET VIABILITY */}
      <section className="py-32 px-6 bg-[rgba(15,15,15,1)] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col gap-8">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight">Market Viability & Business Model</h2>
            <p className="text-lg text-white/50 leading-relaxed">
              Ghost is positioned to capture the explosive growth in autonomous AI commerce by providing the missing enterprise trust layer.
            </p>
          </div>
          
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-8 border border-white/[0.06] bg-black rounded-xl"
            >
              <Users className="w-8 h-8 text-[#b8d4f0] mb-6" />
              <h4 className="text-xl font-medium mb-3">Target Audience</h4>
              <p className="text-white/50 text-sm leading-relaxed">Enterprise B2B Procurement Teams, Autonomous AI Trading Assistants, SaaS Vendors, and AI Agent Frameworks (LangChain, AutoGPT, CrewAI).</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 border border-white/[0.06] bg-black rounded-xl"
            >
              <LineChart className="w-8 h-8 text-[#b8d4f0] mb-6" />
              <h4 className="text-xl font-medium mb-3">Commercial Model</h4>
              <p className="text-white/50 text-sm leading-relaxed">Transaction verification fee on ZK-guaranteed agent purchases + Enterprise SaaS subscription for custom policy compiler tools and compliance auditing suites.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 border border-[#b8d4f0]/20 bg-[#b8d4f0]/5 rounded-xl sm:col-span-2 flex flex-col md:flex-row items-center gap-6"
            >
              <Briefcase className="w-10 h-10 text-[#b8d4f0] shrink-0" />
              <div>
                <h4 className="text-xl font-medium mb-2 text-[#b8d4f0]">Competitive Moat</h4>
                <p className="text-white/70 text-sm leading-relaxed">First mover advantage in zero-knowledge autonomous agent policy enforcement on the highly scalable Midnight blockchain.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. DEVELOPER SECTION */}
      <section id="developers" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight">Ghost Agent SDK<br/>(`@ghost/sdk`)</h2>
            <p className="text-lg text-white/50 font-light max-w-md">
              A lightweight npm package enabling developers to plug ZK policy compliance directly into LangChain or AutoGPT workflows in 3 lines of code.
            </p>
            
            <div className="p-4 bg-black border border-white/[0.1] rounded-lg font-mono text-sm flex items-center justify-between">
              <span className="text-white/70">npm install @ghost/sdk</span>
              <Terminal className="w-4 h-4 text-white/30" />
            </div>

            <div className="flex gap-4">
              <Link href="/dashboard/developer" className="h-10 px-6 flex items-center justify-center bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors">
                Get API Keys
              </Link>
              <Link href="#" className="h-10 px-6 flex items-center justify-center border border-white/[0.1] text-white text-sm font-medium rounded hover:bg-white/[0.05] transition-colors gap-2">
                <Code2 className="w-4 h-4" /> GitHub
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.06] rounded-xl font-mono text-sm shadow-2xl"
          >
            <div className="flex gap-2 mb-6 border-b border-white/[0.06] pb-4">
              <span className="text-white/50">agent.ts</span>
            </div>
            <pre className="text-white/70 overflow-x-auto">
              <code>
<span className="text-pink-400">import</span> {"{ GhostClient }"} <span className="text-pink-400">from</span> <span className="text-green-300">'@ghost/sdk'</span>;<br/><br/>
<span className="text-pink-400">const</span> ghost = <span className="text-pink-400">new</span> GhostClient({"{"}<br/>
{"  "}apiKey: process.env.GHOST_KEY,<br/>
{"  "}network: <span className="text-green-300">'midnight-mainnet'</span><br/>
{"}"});<br/><br/>
<span className="text-white/30">// Intercept intent before execution</span><br/>
<span className="text-pink-400">const</span> proof = <span className="text-pink-400">await</span> ghost.proveIntent({"{"}<br/>
{"  "}agentId: <span className="text-green-300">'agent_098x'</span>,<br/>
{"  "}action: <span className="text-green-300">'PURCHASE'</span>,<br/>
{"  "}amount: <span className="text-blue-300">250.00</span><br/>
{"}"});<br/><br/>
<span className="text-pink-400">if</span> (proof.isValid) {"{"}<br/>
{"  "}<span className="text-white/30">// Execute safely</span><br/>
{"  "}<span className="text-pink-400">await</span> execute(intent);<br/>
{"}"}
              </code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-32 px-6 text-center border-t border-white/[0.06] bg-[rgba(5,5,5,1)] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#b8d4f0]/[0.02] blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-10">Give your agents guardrails.</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard" className="h-12 px-8 flex items-center justify-center bg-white text-black font-medium rounded hover:bg-[#b8d4f0] transition-colors">
              Launch Enterprise Platform
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="px-6 py-12 border-t border-white/[0.06] bg-black">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-white" />
              <span className="font-mono text-sm tracking-[0.2em] font-bold text-white uppercase">
                Ghost
              </span>
            </Link>
            
            <div className="flex flex-wrap gap-x-8 gap-y-4 items-center">
              <Link href="#product" className="text-sm text-white/50 hover:text-white transition-colors">Product</Link>
              <Link href="/docs" className="text-sm text-white/50 hover:text-white transition-colors">Docs</Link>
              <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="text-sm text-white/50 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-sm text-white/50 hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="text-sm text-white/50 hover:text-white transition-colors">Contact</Link>
              <a href="https://github.com/Div1912/Luma" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">GitHub</a>
              <a href="https://x.com/Ghostmidnight1" target="_blank" rel="noopener noreferrer" className="text-sm text-[#b8d4f0] hover:text-white transition-colors font-medium flex items-center gap-1">
                <span>X (@Ghostmidnight1)</span>
              </a>
              <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">Status</Link>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-8 border-t border-white/[0.06] text-xs text-white/30">
            <div>© {new Date().getFullYear()} Ghost Inc. All rights reserved.</div>
            <div className="flex items-center gap-2 border border-white/[0.1] px-3 py-1.5 rounded bg-white/[0.02]">
              <Globe className="w-3 h-3" />
              Built on Midnight
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
