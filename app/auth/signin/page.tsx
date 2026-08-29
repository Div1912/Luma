"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ghost, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  KeyRound, 
  Eye, 
  EyeOff,
  Zap
} from "lucide-react";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { useGhostStore } from "@/store/useGhostStore";
import { ParticleWave } from "@/components/ui/particle-wave";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const { walletState, connectLace, network, setNetwork } = useMidnight();
  const { isAuthenticated, signIn, signInWallet, signInDemo } = useGhostStore();

  const [authMode, setAuthMode] = useState<"wallet" | "credentials">("wallet");
  const [email, setEmail] = useState("demo@ghost.xyz");
  const [password, setPassword] = useState("ghost2025");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated and not actively logging out, allow navigation
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleWalletConnect = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await connectLace();
      // connectLace will set walletState
    } catch (err: any) {
      setError(err.message || "Failed to connect Lace wallet. Ensure Lace is installed and unlocked.");
      setIsSubmitting(false);
    }
  };

  // Only respond to wallet connection when triggered intentionally by the user
  useEffect(() => {
    if (isSubmitting && walletState.isConnected && walletState.address) {
      signInWallet(walletState.address);
      toast.success("Wallet Authenticated", {
        description: `Connected with Midnight ${network.toUpperCase()}`
      });
      setIsSubmitting(false);
      router.push("/dashboard");
    }
  }, [walletState.isConnected, walletState.address, isSubmitting, network, signInWallet, router]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (res.success) {
      toast.success("Welcome back!", {
        description: "Authenticated with enterprise credentials."
      });
      router.push("/dashboard");
    } else {
      setError(res.error || "Authentication failed. Please check credentials.");
    }
  };

  const handleQuickDemo = () => {
    signInDemo();
    toast.success("Sandbox Initialized", {
      description: "Signed in with enterprise demonstration account."
    });
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex overflow-hidden justify-center items-center p-6">
      {/* Luminous Ambient Glowing Light Orbs (Must be behind wave) */}
      <div className="fixed -top-32 left-1/4 w-[650px] h-[650px] bg-gradient-to-br from-[#b8d4f0]/20 via-sky-600/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-20 right-1/4 w-[550px] h-[550px] bg-gradient-to-tl from-indigo-600/20 via-[#b8d4f0]/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(184,212,240,0.15),rgba(15,23,42,0.4)_55%,rgba(3,4,10,0.85)_100%)]" />

      {/* 3D Liquid Glass Particle Wave Background */}
      <ParticleWave className="opacity-100" transparent={true} />

      {/* Centered Connect Form */}
      <div className="w-full max-w-md z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full"
        >
          {/* Logo Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl glass-liquid-panel flex items-center justify-center mb-3 shadow-2xl border border-white/20">
              <Ghost className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-[0.2em] text-white">
              <span className="text-[#b8d4f0]">/</span> GHOST
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">Autonomous Commerce Policy Firewall</p>
          </div>

          {/* Form Card */}
          <div className="glass-liquid-panel p-8 shadow-2xl space-y-6">
            {/* Auth Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-black/60 rounded-xl border border-white/10 font-mono text-xs">
              <button
                type="button"
                onClick={() => { setAuthMode("wallet"); setError(null); }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMode === "wallet" ? "bg-[#b8d4f0] text-black font-bold shadow-md" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lace Wallet</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("credentials"); setError(null); }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMode === "credentials" ? "bg-[#b8d4f0] text-black font-bold shadow-md" : "text-zinc-400 hover:text-white"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Credentials</span>
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-xs flex items-center gap-2 font-mono bg-red-500/10 border border-red-500/20 p-3 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wallet Mode Form */}
            {authMode === "wallet" && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-base font-bold text-white">Midnight Zero-Knowledge Access</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Connect your cryptographic identity via Lace Wallet.
                  </p>
                </div>

                {/* Network Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                    Target Ledger Network
                  </label>
                  <div className="bg-black/50 border border-white/10 rounded-xl p-1 flex gap-1 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setNetwork('preprod')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        network === 'preprod' ? 'bg-white/20 text-white font-bold border border-white/20' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Preprod Network
                    </button>
                    <button
                      type="button"
                      onClick={() => setNetwork('preview')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        network === 'preview' ? 'bg-white/20 text-white font-bold border border-white/20' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Preview Network
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleWalletConnect}
                  disabled={isSubmitting}
                  className="btn-liquid btn-liquid-primary w-full py-3.5 flex justify-center items-center gap-2 font-bold text-sm shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Connecting Lace Wallet...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>Connect with Lace Wallet</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Credentials Mode Form */}
            {authMode === "credentials" && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-base font-bold text-white">Enterprise Sign In</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Sign in with your organization administrator credentials.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">Work Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                      placeholder="admin@enterprise.xyz"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono pt-1">
                  <span className="text-zinc-500">Demo: demo@ghost.xyz</span>
                  <Link href="/auth/forgot" className="text-zinc-400 hover:text-white underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-liquid btn-liquid-primary w-full py-3 flex justify-center items-center gap-2 font-bold text-sm shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Credentials</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick Demo Sandbox Access */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[11px] font-mono text-zinc-400 uppercase">Or One-Click Access</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                onClick={handleQuickDemo}
                className="btn-liquid btn-liquid-secondary w-full py-2.5 text-xs font-mono font-medium text-zinc-200 hover:text-white flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-[#b8d4f0]" />
                <span>Launch Enterprise Demo Sandbox</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-zinc-400 font-mono">
              Don't have an enterprise account?{" "}
              <Link href="/auth/signup" className="text-[#b8d4f0] hover:text-white underline underline-offset-4 transition-colors">
                Request Access
              </Link>
            </p>
            <div>
              <Link href="/" className="text-xs font-mono text-zinc-400 hover:text-white transition-colors">
                &larr; Back to Ghost Platform
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

