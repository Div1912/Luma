"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Ghost, Loader2, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { useGhostStore } from "@/store/useGhostStore";
import { ParticleWave } from "@/components/ui/particle-wave";

export default function SignInPage() {
  const router = useRouter();
  const { walletState, connectLace, network, setNetwork } = useMidnight();
  const signInWallet = useGhostStore((s) => s.signInWallet);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      signInWallet(walletState.address);
      router.push("/dashboard");
    }
  }, [walletState.isConnected, walletState.address, router, signInWallet]);

  useEffect(() => {
    if (walletState.error) {
      setError(walletState.error);
      setIsConnecting(false);
    }
  }, [walletState.error]);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    await connectLace();
    setTimeout(() => {
      if (!walletState.isConnected && !walletState.error) {
        setIsConnecting(false);
      }
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-[#030307] text-white flex overflow-hidden justify-center items-center p-6">
      {/* Ambient Cosmic Liquid Glass Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(184,212,240,0.22),rgba(15,23,42,0.65)_55%,rgba(3,3,8,0.95)_100%)]" />

      {/* 3D Liquid Glass Particle Wave Background */}
      <ParticleWave className="opacity-90" transparent={true} />

      {/* Centered Connect Form */}
      <div className="w-full max-w-md z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl glass-liquid-panel flex items-center justify-center mb-3 shadow-2xl border border-white/20">
              <Ghost className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-[0.2em] text-white">
              <span className="text-[#b8d4f0]">/</span> GHOST
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">Autonomous AI Policy Engine</p>
          </div>

          {/* Form Card */}
          <div className="glass-liquid-panel p-8 shadow-2xl space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Authenticate with Midnight</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Zero-knowledge cryptographic access via Lace Wallet.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-5">
              {/* Network Switcher */}
              <div className="w-full bg-black/50 border border-white/10 rounded-xl p-1.5 flex gap-1 font-mono text-xs">
                <button
                  onClick={() => setNetwork('preview')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    network === 'preview' ? 'bg-[#b8d4f0] text-black font-bold shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Preview Net
                </button>
                <button
                  onClick={() => setNetwork('preprod')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    network === 'preprod' ? 'bg-[#b8d4f0] text-black font-bold shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Preprod Net
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-xs flex items-center gap-1.5 w-full justify-center font-mono bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="btn-liquid btn-liquid-primary w-full py-3.5 flex justify-center items-center gap-2 font-bold text-sm shadow-xl"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Authenticating on Midnight...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Connect with Lace Wallet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-xs font-mono text-zinc-400 hover:text-white transition-colors">
              &larr; Back to Ghost Platform
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

