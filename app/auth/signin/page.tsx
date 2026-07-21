"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Ghost, Loader2, AlertCircle } from "lucide-react";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { useGhostStore } from "@/store/useGhostStore";

export default function SignInPage() {
  const router = useRouter();
  const { walletState, connectLace } = useMidnight();
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
    // In case connectLace resolves without error but also without connection
    // (though error state will be caught by useEffect)
    setTimeout(() => {
      if (!walletState.isConnected && !walletState.error) {
        setIsConnecting(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Centered Connect Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] flex items-center justify-center mb-4">
              <Ghost className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-medium tracking-[0.2em] text-white/90">
              <span className="text-white/50">/</span> GHOST
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-medium mb-6 text-center">Connect Wallet</h2>

            <div className="flex flex-col items-center space-y-6">
              <p className="text-sm text-white/60 text-center">
                Authenticate securely using your Lace Wallet.
              </p>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-xs flex items-center gap-1.5 w-full justify-center"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm rounded-lg py-3 flex justify-center items-center transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  "Connect with Lace"
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-xs text-white/40 hover:text-white transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Background decoration elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />
    </div>
  );
}

