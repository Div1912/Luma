"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useGhostStore } from "@/store/useGhostStore";
import { ParticleWave } from "@/components/ui/particle-wave";

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
  const { signIn } = useGhostStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await signIn(data.email, data.password);
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl glass-liquid-panel border border-white/20 flex items-center justify-center mb-3 shadow-2xl">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-[0.2em] text-white">
            <span className="text-[#b8d4f0]">/</span> GHOST
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">Enterprise Fleet Access</p>
        </div>

        {/* Form Card */}
        <div className="glass-liquid-panel p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Request Enterprise Access</h2>
          
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
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-400 font-mono">
            Already have credentials?{" "}
            <Link href="/auth/signin" className="text-[#b8d4f0] hover:text-white underline underline-offset-4 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
