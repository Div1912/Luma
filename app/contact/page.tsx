'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  message: z.string().min(10, 'Please provide a bit more detail')
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormValues) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-neutral-200 font-sans">
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        
        {/* Left Side */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-6">
            Talk to the team.
          </h1>
          <p className="text-xl text-neutral-400 font-light mb-12">
            Learn how Ghost can secure your autonomous workloads with cryptographic certainty.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 w-6 h-6 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Architecture Review</h3>
                <p className="text-sm text-neutral-400">Discuss your current agent stack and integration points.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 w-6 h-6 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Custom Policies</h3>
                <p className="text-sm text-neutral-400">See how complex logic maps to our deterministic engine.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 w-6 h-6 rounded-full bg-[#b8d4f0]/[0.1] border border-[#b8d4f0]/[0.3] flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-[#b8d4f0]" />
              </div>
              <div>
                <h3 className="text-[#b8d4f0] font-medium mb-1">Midnight Deep-Dive</h3>
                <p className="text-sm text-neutral-400">Understand our ZK proof generation and network mechanics.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side / Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[rgba(12,12,12,0.7)] backdrop-blur-xl border border-white/[0.07] rounded-xl p-8"
        >
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6">
                <Check className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl font-medium text-white mb-2">Request Received</h2>
              <p className="text-neutral-400 mb-8">We'll be in touch within 24 hours.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-sm text-white border border-white/[0.1] px-4 py-2 rounded-sm hover:bg-white/[0.05] transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">Name</label>
                  <input 
                    {...register('name')}
                    className="w-full bg-[#111] border border-white/[0.07] rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2] transition-colors"
                    placeholder="Jane Doe"
                  />
                  {errors.name && <span className="text-xs text-red-400">{errors.name.message}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">Email</label>
                  <input 
                    {...register('email')}
                    className="w-full bg-[#111] border border-white/[0.07] rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2] transition-colors"
                    placeholder="jane@company.com"
                  />
                  {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">Company</label>
                  <input 
                    {...register('company')}
                    className="w-full bg-[#111] border border-white/[0.07] rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2] transition-colors"
                    placeholder="Acme Inc."
                  />
                  {errors.company && <span className="text-xs text-red-400">{errors.company.message}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">Role</label>
                  <select 
                    {...register('role')}
                    className="w-full bg-[#111] border border-white/[0.07] rounded-sm px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-white/[0.2] transition-colors appearance-none"
                  >
                    <option value="">Select a role...</option>
                    <option value="engineering">Engineering</option>
                    <option value="product">Product</option>
                    <option value="security">Security</option>
                    <option value="founder">Founder / Exec</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.role && <span className="text-xs text-red-400">{errors.role.message}</span>}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-neutral-400">How can we help?</label>
                <textarea 
                  {...register('message')}
                  rows={4}
                  className="w-full bg-[#111] border border-white/[0.07] rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-white/[0.2] transition-colors resize-none"
                  placeholder="Tell us about your infrastructure and use case..."
                />
                {errors.message && <span className="text-xs text-red-400">{errors.message.message}</span>}
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-sm text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Request Demo'}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center border-t border-white/[0.05] pt-6">
            <span className="text-neutral-500 text-sm">Already have an account? </span>
            <Link href="/login" className="text-white text-sm hover:underline underline-offset-4">Sign in</Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
