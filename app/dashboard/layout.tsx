"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Bot, 
  FileLock, 
  ShieldCheck, 
  ActivitySquare, 
  FileSignature, 
  AlertTriangle, 
  TerminalSquare, 
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Plus,
  Ghost
} from "lucide-react";
import { useGhostStore } from "@/store/useGhostStore";
import { useMidnight } from "@/lib/midnight/useMidnight";
import { toast } from "sonner";
import { ParticleWave } from "@/components/ui/particle-wave";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Agents", icon: Bot, href: "/dashboard/agents" },
  { label: "Policies", icon: FileLock, href: "/dashboard/policies" },
  { label: "Approvals", icon: ShieldCheck, href: "/dashboard/approvals", showBadge: true },
  { label: "Audit Log", icon: ActivitySquare, href: "/dashboard/audit" },
  { label: "Proof Viewer", icon: FileSignature, href: "/dashboard/proof" },
  { label: "Disputes", icon: AlertTriangle, href: "/dashboard/disputes" },
  { label: "Developer", icon: TerminalSquare, href: "/dashboard/developer" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, signOut, approvals, fetchData } = useGhostStore();
  const { network, setNetwork } = useMidnight();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/signin");
    } else {
      fetchData(); // Fetch real data from Supabase
    }
  }, [isAuthenticated, router, fetchData]);

  if (!isAuthenticated) return null;

  const pendingApprovalsCount = approvals.filter(a => a.status === "pending").length;

  const handleSignOut = () => {
    signOut();
    router.replace("/auth/signin");
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex overflow-hidden">
      {/* 3D Liquid Glass Particle Wave Background */}
      <ParticleWave className="opacity-65" transparent={true} />

      {/* Mobile Header (Hidden on Desktop) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[rgba(8,8,8,0.9)] backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Ghost className="w-6 h-6 text-white" />
          <span className="font-medium tracking-wider">GHOST</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white/70 hover:text-white">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:relative top-0 left-0 h-full w-60 
        bg-black/60 backdrop-blur-2xl border-r border-white/10
        flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0 pt-16 md:pt-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Desktop Logo */}
        <div className="hidden md:flex h-20 items-center gap-3 px-6 border-b border-white/10">
          <Ghost className="w-7 h-7 text-white" />
          <span className="font-semibold tracking-[0.15em] text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">GHOST</span>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${isActive 
                    ? "bg-white/10 text-white border-l-2 border-[#b8d4f0] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]" 
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"}
                `}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-[#b8d4f0]" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                <span>{item.label}</span>
                {item.showBadge && pendingApprovalsCount > 0 && (
                  <span className={`
                    ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono font-medium
                    ${isActive ? "bg-[#b8d4f0]/20 text-[#b8d4f0] border border-[#b8d4f0]/30" : "bg-white/10 text-zinc-300"}
                  `}>
                    {pendingApprovalsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-white/10">
          <div className="glass-liquid p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold text-[#b8d4f0]">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">{user?.name || "User"}</div>
                <div className="text-[11px] text-zinc-500 truncate font-mono">{user?.email || "user@ghost.luma"}</div>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 md:pt-0 pt-16">
        {/* Top Header */}
        <header className="h-20 bg-black/40 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight capitalize text-white">
              {pathname.split("/").pop() || "Overview"}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-xl p-1 text-xs">
              <span className="text-[10px] text-zinc-400 uppercase font-mono px-2">Net:</span>
              <button 
                onClick={() => setNetwork('preview')}
                className={`px-3 py-1 rounded-lg transition-all font-mono text-xs ${network === 'preview' ? 'bg-[#b8d4f0] text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                Preview
              </button>
              <button 
                onClick={() => setNetwork('preprod')}
                className={`px-3 py-1 rounded-lg transition-all font-mono text-xs ${network === 'preprod' ? 'bg-[#b8d4f0] text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                Preprod
              </button>
            </div>
            <button onClick={() => toast.info("Search active", { description: "Filter by agent ID, tx hash, or merchant." })} className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all">
              <Search className="w-4 h-4" />
            </button>
            <button onClick={() => toast.info("No new notifications", { description: "All autonomous agents compliant." })} className="relative p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#b8d4f0] shadow-[0_0_6px_#b8d4f0]"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
