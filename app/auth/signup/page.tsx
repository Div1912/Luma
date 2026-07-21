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
    // Simulate creating account and signing in
    await new Promise(resolve => setTimeout(resolve, 1000));
    await signIn(data.email, data.password);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden justify-center items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-medium tracking-[0.2em] text-white/90">GHOST</h1>
        </div>

        {/* Form Card */}
        <div className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-medium mb-6">Request Access</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-1.5">Full Name</label>
              <div className="relative">
                <input
                  {...register("name")}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 focus:bg-black/60 transition-colors"
                  placeholder="Satoshi Nakamoto"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{errors.name.message}</p>}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-1.5">Email</label>
              <div className="relative">
                <input
                  {...register("email")}
                  type="email"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 focus:bg-black/60 transition-colors"
                  placeholder="satoshi@company.com"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{errors.email.message}</p>}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 focus:bg-black/60 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {errors.password && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{errors.password.message}</p>}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 focus:bg-black/60 transition-colors"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm rounded-lg py-2.5 flex justify-center items-center transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-white/40">
            Already have access?{" "}
            <Link href="/auth/signin" className="text-white/70 hover:text-white underline underline-offset-4 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
