"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Shield, 
  CheckCircle2, 
  Wallet, 
  User, 
  Mail, 
  Briefcase, 
  Building, 
  Globe, 
  ArrowRight, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles 
} from "lucide-react";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { ParticleWave } from "@/components/ui/particle-wave";
import { toast } from "sonner";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, completeProfile } = useGhostStore();
  const { walletState, network } = useMidnight();

  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWalletAddress = walletState.address || user?.walletAddress || "";

  // Form State
  const defaultWalletName = activeWalletAddress ? `Midnight Operator ${activeWalletAddress.slice(-4)}` : "";
  const defaultWalletEmail = activeWalletAddress ? `${activeWalletAddress.slice(0, 14)}_${activeWalletAddress.slice(-6)}@midnight.network` : "";

  const [fullName, setFullName] = useState(user?.name || defaultWalletName);
  const [workEmail, setWorkEmail] = useState(user?.email || defaultWalletEmail);
  const [role, setRole] = useState(user?.role || "Lead ZK Systems Engineer");
  const [organization, setOrganization] = useState(user?.organization || "Midnight Enterprise Validator");
  const [bio, setBio] = useState(user?.bio || "Autonomous policy enforcer and zero-knowledge agent operator.");
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If already registered and profile completed, skip onboarding and enter dashboard immediately
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/signin");
    } else if (user?.profileCompleted) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, user?.profileCompleted, router]);

  // Synchronize initial email/wallet address if available
  useEffect(() => {
    if (activeWalletAddress) {
      if (!fullName) setFullName(`Midnight Operator ${activeWalletAddress.slice(-4)}`);
      if (!workEmail) setWorkEmail(`${activeWalletAddress.slice(0, 14)}_${activeWalletAddress.slice(-6)}@midnight.network`);
    }
  }, [activeWalletAddress]);

  const handleCopyWallet = () => {
    if (!activeWalletAddress) return;
    navigator.clipboard.writeText(activeWalletAddress);
    setCopied(true);
    toast.success("Wallet address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = "Full name is required (at least 2 characters).";
    }
    if (!workEmail.trim() || !workEmail.includes("@")) {
      errs.workEmail = "A valid work or network email is required.";
    }
    if (!role.trim()) {
      errs.role = "Role / Title is required.";
    }
    if (!organization.trim()) {
      errs.organization = "Organization name is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await completeProfile({
        name: fullName.trim(),
        email: workEmail.trim(),
        role: role.trim(),
        organization: organization.trim(),
        bio: bio.trim(),
        timezone: timezone.trim(),
        walletAddress: activeWalletAddress || undefined
      });

      if (!res.success) {
        toast.error("Could not save profile", {
          description: res.error || "Please verify database connection."
        });
        setIsSubmitting(false);
        return;
      }

      toast.success("Profile Saved Successfully! 🛡️", {
        description: `Welcome aboard, ${fullName.trim()}. Your enterprise identity is verified.`
      });

      // Navigate into dashboard
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("An unexpected error occurred", {
        description: err.message || String(err)
      });
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await completeProfile({
        name: fullName.trim() || defaultWalletName || "Midnight Node Operator",
        email: workEmail.trim() || defaultWalletEmail,
        role: role.trim() || "Lead ZK Systems Engineer",
        organization: organization.trim() || "Midnight Enterprise Validator",
        bio: bio.trim(),
        timezone: timezone.trim(),
        walletAddress: activeWalletAddress || undefined
      });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#03040a] text-white flex overflow-hidden justify-center items-center p-4 sm:p-6 py-12">
      {/* Luminous Ambient Glowing Light Orbs */}
      <div className="fixed -top-32 left-1/3 w-[650px] h-[650px] bg-gradient-to-br from-[#b8d4f0]/20 via-sky-600/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-20 right-1/4 w-[550px] h-[550px] bg-gradient-to-tl from-indigo-600/20 via-[#b8d4f0]/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(184,212,240,0.15),rgba(15,23,42,0.4)_55%,rgba(3,4,10,0.85)_100%)]" />

      {/* 3D Liquid Glass Particle Wave Background */}
      <ParticleWave className="opacity-100" transparent={true} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl relative z-10 my-auto"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl glass-liquid-panel border border-white/20 flex items-center justify-center mb-3 shadow-2xl">
            <Shield className="w-7 h-7 text-[#b8d4f0]" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#b8d4f0] bg-[#b8d4f0]/10 border border-[#b8d4f0]/20 px-2.5 py-0.5 rounded-full">
              First-Time User Registration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Complete Your Enterprise Profile
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1 max-w-md">
            Please register and save your operator profile once to activate full policy firewall and dashboard access.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-liquid-panel p-6 sm:p-8 shadow-2xl space-y-6 border border-white/10 backdrop-blur-2xl">
          {/* Cryptographic Identity Badge */}
          {activeWalletAddress ? (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#b8d4f0]/10 border border-[#b8d4f0]/20 flex items-center justify-center text-[#b8d4f0] flex-shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-white">1AM Verified Identity</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{network.toUpperCase()}</span>
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400 break-all mt-0.5">
                    {activeWalletAddress}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyWallet}
                className="btn-liquid btn-liquid-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 self-start sm:self-center"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b8d4f0] flex-shrink-0" />
              <span>You are onboarding with enterprise credentials. You can attach a Midnight wallet at any time in Profile.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Full Name <span className="text-[#b8d4f0]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" })); }}
                    placeholder="e.g. Satoshi Nakamoto"
                    className={`w-full bg-black/50 border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors ${
                      errors.fullName ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#b8d4f0]/50"
                    }`}
                  />
                </div>
                {errors.fullName && <p className="text-red-400 text-[11px] font-mono mt-1">{errors.fullName}</p>}
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Official Email <span className="text-[#b8d4f0]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={workEmail}
                    onChange={(e) => { setWorkEmail(e.target.value); if (errors.workEmail) setErrors(prev => ({ ...prev, workEmail: "" })); }}
                    placeholder="operator@enterprise.com"
                    className={`w-full bg-black/50 border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors ${
                      errors.workEmail ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#b8d4f0]/50"
                    }`}
                  />
                </div>
                {errors.workEmail && <p className="text-red-400 text-[11px] font-mono mt-1">{errors.workEmail}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role / Title */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Role / Position <span className="text-[#b8d4f0]">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => { setRole(e.target.value); if (errors.role) setErrors(prev => ({ ...prev, role: "" })); }}
                    placeholder="Chief AI Security Architect"
                    className={`w-full bg-black/50 border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors ${
                      errors.role ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#b8d4f0]/50"
                    }`}
                  />
                </div>
                {errors.role && <p className="text-red-400 text-[11px] font-mono mt-1">{errors.role}</p>}
              </div>

              {/* Organization */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Organization / Entity <span className="text-[#b8d4f0]">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => { setOrganization(e.target.value); if (errors.organization) setErrors(prev => ({ ...prev, organization: "" })); }}
                    placeholder="Ghost Autonomous Swarms Inc."
                    className={`w-full bg-black/50 border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors ${
                      errors.organization ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#b8d4f0]/50"
                    }`}
                  />
                </div>
                {errors.organization && <p className="text-red-400 text-[11px] font-mono mt-1">{errors.organization}</p>}
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                Primary Operating Timezone
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 cursor-pointer"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="UTC-8 (Pacific Time)">UTC-8 (US Pacific Time)</option>
                  <option value="UTC-5 (Eastern Time)">UTC-5 (US Eastern Time)</option>
                  <option value="UTC+0 (London)">UTC+0 (London, GMT)</option>
                  <option value="UTC+1 (Central Europe)">UTC+1 (Berlin, Paris)</option>
                  <option value="UTC+5:30 (India Standard Time)">UTC+5:30 (IST - Mumbai, New Delhi)</option>
                  <option value="UTC+8 (Singapore, Hong Kong)">UTC+8 (Singapore, Hong Kong)</option>
                  <option value="UTC+9 (Tokyo)">UTC+9 (Tokyo, JST)</option>
                </select>
              </div>
            </div>

            {/* Bio / Security Mandate */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                Operational Mandate & Bio (Optional)
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of autonomous agent oversight scope..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#b8d4f0]/50 resize-none font-sans"
              />
            </div>

            {/* Submission Button */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-liquid btn-liquid-primary w-full py-3.5 flex justify-center items-center gap-2 font-bold text-sm shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Saving Profile to Blockchain Database...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-black" />
                    <span>Save Profile & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-black ml-1" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="btn-liquid btn-liquid-secondary w-full py-2.5 flex justify-center items-center gap-2 text-xs font-mono text-zinc-300 hover:text-white"
              >
                <span>Continue with Default Operator Profile →</span>
              </button>
            </div>

            <p className="text-[11px] font-mono text-center text-zinc-500">
              🔒 Your cryptographic identity is permanently linked with zero-knowledge provenance in Supabase.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
