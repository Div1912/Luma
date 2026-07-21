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
  Clock,
  Eye,
  Key,
  Globe,
  Settings2,
  Terminal,
  Code2,
  Lock,
  Search,
  ShoppingCart,
  Building2,
  CreditCard,
  Store,
  UserCog
} from "lucide-react";
import Hero3DScene from "@/components/hero/Hero3DScene";

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#b8d4f0] selection:text-black font-sans overflow-hidden">
      <Navbar />
      
      {/* 1. HERO */}
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
                Autonomous<br />
                <span className="text-white/60">commerce,</span><br />
                with proof.
              </h1>
              <p className="text-lg md:text-xl text-white/50 max-w-xl font-light leading-relaxed">
                Ghost provides cryptographic guardrails for AI agents. Ensure every autonomous transaction complies with strict policies before execution.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/dashboard" className="h-12 px-8 flex items-center justify-center gap-2 bg-white text-black font-medium rounded hover:bg-[#b8d4f0] transition-colors group">
                Launch App
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/contact" className="h-12 px-8 flex items-center justify-center gap-2 bg-[rgba(20,20,20,0.8)] border border-white/[0.1] text-white font-medium rounded hover:bg-white/[0.05] transition-colors">
                Request Demo
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              {[
                { icon: CheckCircle, text: "ZK Proof Verified" },
                { icon: Hexagon, text: "Policy Active" },
                { icon: Activity, text: "3 Agents Running" }
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

      {/* 2. TRUST PROBLEM */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="flex flex-col gap-6 mb-20">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight">The Trust Problem</h2>
        </div>
        
        <div className="flex flex-col gap-12">
          {[
            { num: "01", title: "AI agents are blind boxes.", desc: "Once deployed, agents execute actions with minimal oversight. Traditional monitoring only tells you what went wrong after the fact." },
            { num: "02", title: "Autonomous spending is high risk.", desc: "Giving agents access to funds without strict, programmable guardrails exposes organizations to unbounded financial risk." },
            { num: "03", title: "Ghost adds proof-backed guardrails.", desc: "Using Zero-Knowledge proofs, Ghost mathematically guarantees that every action an agent takes complies with your explicit policies." }
          ].map((panel, i) => (
            <motion.div 
              key={panel.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start border-b border-white/[0.06] pb-12 last:border-0"
            >
              <div className="md:col-span-2 font-mono text-4xl text-white/20">{panel.num}</div>
              <div className="md:col-span-4 text-2xl font-medium">{panel.title}</div>
              <div className="md:col-span-6 text-lg text-white/50 font-light">{panel.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="product" className="py-32 px-6 bg-[rgba(15,15,15,1)] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-20 text-center">How Ghost Works</h2>
          
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-white/[0.06] -translate-y-1/2 z-0" />
            
            {[
              { title: "Set Policy", icon: Settings2, desc: "Define rules, limits, and thresholds for your agents." },
              { title: "Agent Acts", icon: Activity, desc: "Agent generates an intent to spend or execute." },
              { title: "Ghost Verifies", icon: Shield, desc: "Intent is checked against policy via ZK proof." },
              { title: "Approved/Blocked", icon: CheckCircle, desc: "Cryptographic proof enforces the outcome instantly." }
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative z-10 flex flex-col p-8 bg-[rgba(10,10,10,0.65)] backdrop-blur-xl border border-white/[0.06] rounded-xl group transition-all duration-300 hover:border-white/[0.15]"
              >
                <div className="w-12 h-12 bg-white/[0.03] rounded-full flex items-center justify-center mb-6 group-hover:bg-white/[0.08] transition-colors">
                  <step.icon className="w-5 h-5 text-[#b8d4f0]" />
                </div>
                <h3 className="text-lg font-medium mb-3">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PRODUCT CAPABILITIES */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-20">Product Capabilities</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Spending Policies", icon: CreditCard },
            { title: "Approval Thresholds", icon: Settings2 },
            { title: "Instant Revoke", icon: Lock },
            { title: "Audit Log", icon: Terminal },
            { title: "Proof Viewer", icon: Eye },
            { title: "Agent Permissions", icon: Key },
            { title: "Merchant Verification", icon: Store },
            { title: "Midnight Enforcement", icon: Shield }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="p-6 bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.06] rounded-xl hover:bg-[rgba(15,15,15,0.9)] hover:border-white/[0.1] transition-all duration-300"
            >
              <feat.icon className="w-5 h-5 text-white/40 mb-4" />
              <h3 className="font-medium text-sm text-white/90">{feat.title}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. PRODUCT PREVIEW */}
      <section className="py-20 px-6 max-w-[1600px] mx-auto overflow-hidden">
        <div className="relative flex justify-center h-[600px] items-center perspective-[2000px]">
          {/* Dashboard Panel */}
          <motion.div 
            initial={{ opacity: 0, rotateY: 10, x: -100, z: -100 }}
            whileInView={{ opacity: 1, rotateY: 5, x: -150, z: -50 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="absolute w-[600px] h-[400px] bg-[#0c0c0c] border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl opacity-60 hover:opacity-100 transition-opacity"
          >
            <div className="h-8 border-b border-white/[0.1] flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="w-1/3 h-6 bg-white/5 rounded" />
              <div className="w-full h-32 bg-white/5 rounded mt-4" />
              <div className="w-full h-12 bg-white/5 rounded mt-2" />
            </div>
          </motion.div>

          {/* Central Panel: Inbox */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute z-20 w-[650px] h-[450px] bg-[rgba(12,12,12,0.9)] backdrop-blur-2xl border border-white/[0.15] rounded-xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
          >
             <div className="h-8 border-b border-white/[0.1] flex items-center px-4 gap-2 bg-white/[0.02]">
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              <div className="ml-4 text-[10px] font-mono text-white/40 tracking-widest">GHOST_INBOX</div>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <div className="flex justify-between items-end">
                <div className="text-xl font-medium">Pending Approvals</div>
                <div className="text-xs font-mono text-[#b8d4f0] border border-[#b8d4f0]/20 px-2 py-1 rounded bg-[#b8d4f0]/5">2 REQUIRES PROOF</div>
              </div>
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 border border-white/[0.06] rounded bg-white/[0.02] flex items-center px-4 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="flex flex-col gap-1">
                        <div className="w-24 h-3 bg-white/20 rounded" />
                        <div className="w-16 h-2 bg-white/10 rounded" />
                      </div>
                    </div>
                    <div className="w-20 h-6 rounded border border-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Panel: Editor */}
          <motion.div 
            initial={{ opacity: 0, rotateY: -10, x: 100, z: -100 }}
            whileInView={{ opacity: 1, rotateY: -5, x: 150, z: -50 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.1 }}
            className="absolute w-[600px] h-[400px] bg-[#0c0c0c] border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl opacity-60 hover:opacity-100 transition-opacity"
          >
             <div className="h-8 border-b border-white/[0.1] flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>
            <div className="p-6">
               <div className="w-1/2 h-6 bg-white/5 rounded mb-8" />
               <div className="space-y-4 font-mono text-sm text-white/30">
                 <div>rule require_auth {"{"}</div>
                 <div className="pl-4">amount {"<"} 1000</div>
                 <div className="pl-4">merchant in APPROVED_LIST</div>
                 <div>{"}"}</div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. USE CASES */}
      <section id="use-cases" className="py-32 px-6 bg-[rgba(15,15,15,1)] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-20">Built for Autonomous Operations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "AI Shopping Assistants", icon: ShoppingCart, desc: "Ensure your agent only buys exactly what you specified.", proof: "Item bounds, price limits" },
              { title: "Enterprise Procurement", icon: Building2, desc: "Automate B2B purchases within corporate budget rules.", proof: "Department quotas, vendor KYC" },
              { title: "BNPL Guardrails", icon: CreditCard, desc: "Issue agent credit with strict repayment policies.", proof: "Risk scoring, term compliance" },
              { title: "Merchant Verification", icon: Store, desc: "Prevent agents from transacting with blacklisted entities.", proof: "Entity reputation score" },
              { title: "Agent Policy Control", icon: UserCog, desc: "Revoke or modify an agent's capabilities in real-time.", proof: "Active lease state" }
            ].map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col p-8 bg-[rgba(10,10,10,0.65)] backdrop-blur-xl border border-white/[0.06] rounded-xl hover:border-white/[0.15] transition-all"
              >
                <uc.icon className="w-6 h-6 text-white mb-6" />
                <h3 className="text-lg font-medium mb-3">{uc.title}</h3>
                <p className="text-sm text-white/50 mb-8 flex-1">{uc.desc}</p>
                <div className="pt-4 border-t border-white/[0.06]">
                  <span className="text-xs font-mono text-white/30 uppercase block mb-1">What gets proven:</span>
                  <span className="text-sm text-[#b8d4f0]">{uc.proof}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DEVELOPER SECTION */}
      <section id="developers" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight">Built for engineers.<br/>Made for trust.</h2>
            <p className="text-lg text-white/50 font-light max-w-md">
              Integrate Ghost into your agent framework in minutes. Our SDK handles proof generation, validation, and network synchronization seamlessly.
            </p>
            
            <div className="p-4 bg-black border border-white/[0.1] rounded-lg font-mono text-sm flex items-center justify-between">
              <span className="text-white/70">npm install @ghost/sdk</span>
              <Terminal className="w-4 h-4 text-white/30" />
            </div>

            <div className="flex gap-4">
              <Link href="/docs" className="h-10 px-6 flex items-center justify-center bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors">
                View Docs
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
{"  "}network: <span className="text-green-300">'midnight-testnet'</span><br/>
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

      {/* 8. STATS BLOCK */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "1,247", label: "Proofs Verified" },
            { value: "3ms", label: "Average Latency" },
            { value: "100%", label: "Policy Enforcement" },
            { value: "Zero", label: "Trust Assumptions" }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 flex flex-col items-center justify-center text-center border border-white/[0.06] bg-[rgba(10,10,10,0.4)] rounded-xl"
            >
              <div className="text-3xl md:text-4xl font-light mb-2">{stat.value}</div>
              <div className="text-xs text-white/50 uppercase tracking-widest font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-32 px-6 text-center border-t border-white/[0.06] bg-[rgba(5,5,5,1)] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#b8d4f0]/[0.02] blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-10">Give your agents guardrails.</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard" className="h-12 px-8 flex items-center justify-center bg-white text-black font-medium rounded hover:bg-[#b8d4f0] transition-colors">
              Launch App
            </Link>
            <Link href="/contact" className="h-12 px-8 flex items-center justify-center border border-white/[0.1] text-white font-medium rounded hover:bg-white/[0.05] transition-colors">
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="px-6 py-12 border-t border-white/[0.06] bg-black">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-white" />
              <span className="font-mono text-sm tracking-[0.2em] font-bold text-white uppercase">
                Ghost
              </span>
            </Link>
            
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {["Product", "Docs", "Pricing", "Privacy", "Terms", "Contact", "GitHub", "X", "Status"].map(link => (
                <Link key={link} href={`/${link.toLowerCase()}`} className="text-sm text-white/50 hover:text-white transition-colors">
                  {link}
                </Link>
              ))}
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
