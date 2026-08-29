"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { ParticleWave } from "@/components/ui/particle-wave";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotValues) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSuccess(true);
  };

  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex overflow-hidden justify-center items-center p-6">
      {/* 3D Liquid Glass Particle Wave Background */}
      <ParticleWave className="opacity-95" transparent={true} />

      {/* Luminous Ambient Glowing Light Orbs */}
      <div className="fixed -top-32 left-1/4 w-[650px] h-[650px] bg-gradient-to-br from-[#b8d4f0]/20 via-sky-600/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-20 right-1/4 w-[550px] h-[550px] bg-gradient-to-tl from-indigo-600/20 via-[#b8d4f0]/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(184,212,240,0.15),rgba(15,23,42,0.5)_55%,rgba(3,4,10,0.92)_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-6">
          <Link href="/auth/signin" className="inline-flex items-center text-xs font-mono text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to sign in
          </Link>
        </div>

        {/* Form Card */}
        <div className="glass-liquid-panel p-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-14 h-14 rounded-2xl glass-liquid-panel border border-white/20 flex items-center justify-center mb-6 shadow-xl">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1.5">Reset Password</h2>
                <p className="text-xs text-zinc-400 font-mono mb-6 leading-relaxed">
                  Enter your verified administrator email to dispatch a cryptographic reset challenge.
                </p>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
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

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-liquid btn-liquid-primary w-full py-3 font-bold text-sm flex justify-center items-center shadow-xl"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Token"}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
                <p className="text-xs text-zinc-400 font-mono max-w-[280px]">
                  We've dispatched a zero-knowledge password reset authorization link to your email.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
