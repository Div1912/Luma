"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Eye, EyeOff, Loader2, Sparkles, KeyRound, AlertCircle } from "lucide-react";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { ParticleWave } from "@/components/ui/particle-wave";
import { toast } from "sonner";

const signUpSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { signIn, signInWallet, isAuthenticated, user } = useGhostStore();
  const { walletState, connectLace, network, setNetwork } = useMidnight();
  const [authMode, setAuthMode] = useState<"wallet" | "credentials">("wallet");
  const [showPassword, setShowPassword] = useState(false);
  const [isWalletSubmitting, setIsWalletSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.profileCompleted) {
        router.push("/dashboard");
      } else {
        router.push("/auth/complete-profile");
      }
    }
  }, [isAuthenticated, user?.profileCompleted, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const handleWalletConnect = async () => {
    setError(null);
    setIsWalletSubmitting(true);
    try {
      await connectLace();
    } catch (err: any) {
      setError(err.message || "Failed to connect 1AM wallet. Ensure 1AM is installed and unlocked.");
      setIsWalletSubmitting(false);
    }
  };

  useEffect(() => {
    if (isWalletSubmitting && walletState.isConnected && walletState.address) {
      const targetAddress = walletState.address;
      const executeAuth = async () => {
        try {
          const { isNewUser } = await signInWallet(targetAddress);
          setIsWalletSubmitting(false);

          if (isNewUser) {
            toast.info("Welcome to Luma Ghost", {
              description: "Please complete and save your profile to access the dashboard."
            });
            router.push("/auth/complete-profile");
          } else {
            toast.success("Wallet Authenticated", {
              description: `Welcome back! Connected on Midnight ${network.toUpperCase()}`
            });
            router.push("/dashboard");
          }
        } catch (e: any) {
          setError(e.message || "Failed to authenticate wallet.");
          setIsWalletSubmitting(false);
        }
      };
      executeAuth();
    }
  }, [walletState.isConnected, walletState.address, isWalletSubmitting, network, signInWallet, router]);

  const onSubmit = async (data: SignUpValues) => {
    try {
      const { saveUserToSupabase } = await import("@/lib/supabase");
      await saveUserToSupabase({
        name: data.name.trim(),
        email: data.email.trim(),
        authType: "credentials",
        profileCompleted: false
      });
    } catch (e) {
      console.warn("Signup saveUserToSupabase warning:", e);
    }
    await signIn(data.email, data.password);
    router.push("/auth/complete-profile");
  };

  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex overflow-hidden justify-center items-center p-6">
      {/* Luminous Ambient Glowing Light Orbs */}
      <div className="fixed -top-32 left-1/4 w-[650px] h-[650px] bg-gradient-to-br from-[#b8d4f0]/20 via-sky-600/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-20 right-1/4 w-[550px] h-[550px] bg-gradient-to-tl from-indigo-600/20 via-[#b8d4f0]/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(184,212,240,0.15),rgba(15,23,42,0.4)_55%,rgba(3,4,10,0.85)_100%)]" />

      {/* 3D Liquid Glass Particle Wave Background */}
      <ParticleWave className="opacity-100" transparent={true} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl glass-liquid-panel border border-white/20 flex items-center justify-center mb-3 shadow-2xl">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-[0.2em] text-white">
            <span className="text-[#b8d4f0]">/</span> GHOST
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">Enterprise Fleet Access</p>
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
              <span>1AM Wallet</span>
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
                <h2 className="text-base font-bold text-white">Midnight Zero-Knowledge Signup</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Connect your cryptographic identity via 1AM Wallet.
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
                disabled={isWalletSubmitting}
                className="btn-liquid btn-liquid-primary w-full py-3.5 flex justify-center items-center gap-2 font-bold text-sm shadow-xl"
              >
                {isWalletSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Connecting 1AM Wallet...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Sign Up with 1AM Wallet</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Credentials Mode Form */}
          {authMode === "credentials" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <input
                    {...register("name")}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                    placeholder="Satoshi Nakamoto"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{errors.name.message}</p>}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">Work Email</label>
                <div className="relative">
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                    placeholder="satoshi@enterprise.xyz"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{errors.email.message}</p>}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {errors.password && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{errors.password.message}</p>}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 transition-colors"
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-liquid btn-liquid-primary w-full py-3 font-bold text-sm flex justify-center items-center shadow-xl"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Enterprise Account"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-400 font-mono">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-[#b8d4f0] hover:text-white underline underline-offset-4 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
