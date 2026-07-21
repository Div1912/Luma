"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden justify-center items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-6">
          <Link href="/auth/signin" className="inline-flex items-center text-xs text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to sign in
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 rounded-xl bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-medium mb-2">Reset Password</h2>
                <p className="text-sm text-white/50 mb-6">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-1.5">Email</label>
                    <div className="relative">
                      <input
                        {...register("email")}
                        type="email"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 focus:bg-black/60 transition-colors"
                        placeholder="name@company.com"
                      />
                      {errors.email && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm rounded-lg py-2.5 flex justify-center items-center transition-colors"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
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
                <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-medium mb-2">Check your inbox</h2>
                <p className="text-sm text-white/50">
                  We've sent a password reset link to your email address.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
